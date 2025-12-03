// Import modules
import { Router } from './router.js';
import { Auth } from './auth.js';
import { UI } from './ui.js';
import { DataService } from './data-service.js';

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        const auth = new Auth();
        auth.initialize();

        if (auth.isLoggedIn) {
            showMainApp(auth);
        } else {
            showLoginPage(auth);
        }
    } catch (error) {
        console.error('Initialization failed:', error);
        showErrorToast('Failed to initialize application');
    }
}

function showLoginPage(auth) {
    const loginPage = document.getElementById('login-page');
    const mainWrapper = document.getElementById('main-wrapper');
    
    if (loginPage) loginPage.style.display = 'flex';
    if (mainWrapper) mainWrapper.style.display = 'none';
    
    initializeLoginForm(auth);
}

function initializeLoginForm(auth) {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Login';

    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        // No role input in login form; determine role automatically in auth.login

        if (!username || !password) {
            showErrorToast('Please enter username and password');
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
            }

            await auth.login(username, password);
            showSuccessToast(`Welcome, ${auth.getCurrentUser().name}!`);

            // Ensure route points to dashboard and show main app
            try { window.location.hash = '#dashboard'; } catch (e) {}
            setTimeout(() => showMainApp(auth), 300);
        } catch (error) {
            showErrorToast(error.message || 'Login failed');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    };
}

function showMainApp(auth) {
    const loginPage = document.getElementById('login-page');
    const mainWrapper = document.getElementById('main-wrapper');

    if (loginPage) loginPage.style.display = 'none';
    if (mainWrapper) {
        mainWrapper.style.display = 'flex';
        mainWrapper.classList.add('show');
    }

    initializeMainApp(auth);
}

async function initializeMainApp(auth) {
    try {
        const dataService = new DataService(auth);
        const router = new Router(auth, dataService);
        const ui = new UI(auth, router, dataService);

        setupTopbarEvents(auth, ui, router);
        setupSidebarEvents(router);
        setupModalEvents(auth, ui, dataService);

        await ui.initialize();
        await router.initialize();

        window.app = { auth, router, ui, dataService };
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Failed to load app:', error);
        showErrorToast('Failed to load application');
    }
}

function setupTopbarEvents(auth, ui, router) {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => toggleSidebar());
    }

    const logoutButtons = [
        document.getElementById('logout-btn'),
        document.getElementById('topbar-logout-link')
    ];
    
    logoutButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout(auth);
            });
        }
    });

    const profileLinks = document.querySelectorAll('[href="#profile"]');
    profileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (router) router.navigateTo('profile');
            // Close dropdowns if open
            const profileDropdown = document.getElementById('profile-dropdown');
            if (profileDropdown) profileDropdown.style.display = 'none';
            const notificationDropdown = document.getElementById('notification-dropdown');
            if (notificationDropdown) notificationDropdown.style.display = 'none';
        });
    });

    document.addEventListener('click', closeAllDropdowns);
}

function setupSidebarEvents(router) {
    const closeSidebarBtn = document.getElementById('close-sidebar');
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => closeSidebar());
    }

    const sidebarMenu = document.getElementById('sidebar-menu');
    if (sidebarMenu) {
        sidebarMenu.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                const link = e.target.closest('a');
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const route = href.substring(1);
                    router.navigateTo(route);
                    // Close sidebar and dropdowns to avoid overlapping UI
                    closeSidebar();
                    const notificationDropdown = document.getElementById('notification-dropdown');
                    const profileDropdown = document.getElementById('profile-dropdown');
                    if (notificationDropdown) notificationDropdown.style.display = 'none';
                    if (profileDropdown) profileDropdown.style.display = 'none';
                }
            }
        });
    }
}

function setupModalEvents(auth, ui, dataService) {
    const saveProfileBtn = document.getElementById('saveProfileChanges');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => ui.saveProfileChanges());
    }

    const submitRaiseBtn = document.getElementById('submitRaiseTicket');
    if (submitRaiseBtn) {
        submitRaiseBtn.addEventListener('click', () => handleRaiseTicket(auth, ui, dataService));
    }

    const confirmAssignBtn = document.getElementById('confirmAssignTicket');
    if (confirmAssignBtn) {
        confirmAssignBtn.addEventListener('click', () => handleAssignTicket(auth, ui, dataService));
    }
}

async function handleRaiseTicket(auth, ui, dataService) {
    const title = document.getElementById('ticketTitle').value.trim();
    const category = document.getElementById('ticketCategory').value;
    const priority = document.getElementById('ticketPriority').value;
    const location = document.getElementById('ticketLocation').value.trim();
    if (!title || !category || !location) {
        ui.showErrorToast('Please fill all required fields');
        return;
    }

    try {
        const ticket = {
            id: generateId(),
            title,
            category,
            priority,
            location,
            // description removed
            status: 'New',
            createdBy: auth.getCurrentUser().id,
            createdAt: new Date().toISOString()
        };

        dataService.createTicket(ticket);
        ui.showSuccessToast('Ticket raised successfully!');

        // Reset form and hide modal
        const form = document.getElementById('raiseTicketForm');
        if (form) form.reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('raiseTicketModal'));
        if (modal) modal.hide();

        // Navigate to My Tickets to show the newly created ticket
        try {
            if (ui && ui.router) {
                ui.router.navigateTo('my-tickets');
            } else if (window.app && window.app.router) {
                window.app.router.navigateTo('my-tickets');
            } else {
                // Fallback: force route re-render
                if (window.location.hash.replace('#', '') === 'my-tickets') {
                    // trigger hashchange to re-render
                    window.location.hash = '#my-tickets-refresh-' + Date.now();
                    setTimeout(() => window.location.hash = '#my-tickets', 50);
                } else {
                    window.location.hash = '#my-tickets';
                }
            }
        } catch (e) {
            console.warn('Unable to navigate to my-tickets automatically', e);
        }
    } catch (error) {
        ui.showErrorToast('Failed to raise ticket');
        console.error(error);
    }
}

async function handleAssignTicket(auth, ui, dataService) {
    const ticketId = document.getElementById('assignTicketId').value;
    const staffId = document.getElementById('assignStaff').value;
    const dueDate = document.getElementById('assignDueDate').value;
    const priority = document.getElementById('assignPriority').value;

    if (!staffId || !dueDate) {
        ui.showErrorToast('Please fill all required fields');
        return;
    }

    try {
        dataService.assignTicket(ticketId, {
            assignedTo: staffId,
            dueDate,
            priority,
            assignedBy: auth.getCurrentUser().id,
            assignedAt: new Date().toISOString()
        });

        ui.showSuccessToast('Ticket assigned successfully!');
        const modal = bootstrap.Modal.getInstance(document.getElementById('assignTicketModal'));
        if (modal) modal.hide();
    } catch (error) {
        ui.showErrorToast('Failed to assign ticket');
        console.error(error);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('show');
    if (overlay) overlay.classList.toggle('show');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
}

function closeAllDropdowns() {
    const notificationDropdown = document.getElementById('notification-dropdown');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (notificationDropdown) notificationDropdown.style.display = 'none';
    if (profileDropdown) profileDropdown.style.display = 'none';
}

function handleLogout(auth) {
    if (confirm('Are you sure you want to logout?')) {
        auth.logout();
        // Clear any routing state and show login page without a full reload
        try {
            window.location.hash = '';
        } catch (e) {}
        showSuccessToast('Logged out successfully');
        // Ensure login page is visible and main app hidden
        try {
            const loginPage = document.getElementById('login-page');
            const mainWrapper = document.getElementById('main-wrapper');
            if (loginPage) loginPage.style.display = 'flex';
            if (mainWrapper) mainWrapper.style.display = 'none';
        } catch (e) {}
    }
}

function showSuccessToast(message) {
    showToast(message, 'success');
}

function showErrorToast(message) {
    showToast(message, 'error');
}

function showWarningToast(message) {
    showToast(message, 'warning');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('alertToast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) {
        console.error('Toast element not found');
        return;
    }

    toastMessage.innerHTML = message;
    toast.classList.remove('hide', 'success', 'error', 'warning');
    toast.classList.add(type);

    try {
        const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
        bsToast.show();
        setTimeout(() => toast.classList.add('hide'), 3500);
    } catch (e) {
        console.error('Bootstrap Toast error:', e);
    }
}

function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export { generateId, showSuccessToast, showErrorToast, showWarningToast };
