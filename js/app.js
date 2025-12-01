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
    if (loginPage) loginPage.style.display = 'flex';
    initializeLoginForm(auth);
}

function initializeLoginForm(auth) {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const role = document.querySelector('input[name="role"]:checked').value;

        if (!username || !password) {
            showErrorToast('Please enter credentials');
            return;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
            await auth.login(username, password, role);
            showSuccessToast(`Welcome, ${auth.getCurrentUser().name}!`);
            setTimeout(() => showMainApp(auth), 500);
        } catch (error) {
            showErrorToast(error.message || 'Login failed');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

function showMainApp(auth) {
    const loginPage = document.getElementById('login-page');
    const mainWrapper = document.getElementById('main-wrapper');

    if (loginPage) loginPage.style.display = 'none';
    if (mainWrapper) mainWrapper.classList.add('show');

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
    } catch (error) {
        console.error('Failed to load app:', error);
        showErrorToast('Failed to load application');
    }
}

function setupTopbarEvents(auth, ui, router) {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) sidebarToggle.addEventListener('click', () => toggleSidebar());

    const logoutButtons = [document.getElementById('logout-btn'), document.getElementById('logout-link')];
    logoutButtons.forEach(btn => {
        if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); handleLogout(auth); });
    });

    const profileLinks = document.querySelectorAll('[href="#profile"]');
    profileLinks.forEach(link => {
        link.addEventListener('click', (e) => { e.preventDefault(); router.navigateTo('profile'); });
    });

    document.addEventListener('click', closeAllDropdowns);
}

function setupSidebarEvents(router) {
    const closeSidebarBtn = document.getElementById('close-sidebar');
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => closeSidebar());

    const sidebarMenu = document.getElementById('sidebar-menu');
    if (sidebarMenu) {
        sidebarMenu.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                const link = e.target.closest('a');
                e.preventDefault();
                const route = link.getAttribute('href').substring(1);
                router.navigateTo(route);
                closeSidebar();
            }
        });
    }
}

function setupModalEvents(auth, ui, dataService) {
    const saveProfileBtn = document.getElementById('saveProfileChanges');
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', () => ui.saveProfileChanges());

    const submitRaiseBtn = document.getElementById('submitRaiseTicket');
    if (submitRaiseBtn) submitRaiseBtn.addEventListener('click', () => handleRaiseTicket(auth, dataService));

    const confirmAssignBtn = document.getElementById('confirmAssignTicket');
    if (confirmAssignBtn) confirmAssignBtn.addEventListener('click', () => handleAssignTicket(auth, dataService));
}

async function handleRaiseTicket(auth, dataService) {
    const title = document.getElementById('ticketTitle').value.trim();
    const category = document.getElementById('ticketCategory').value;
    const priority = document.getElementById('ticketPriority').value;
    const location = document.getElementById('ticketLocation').value.trim();
    const description = document.getElementById('ticketDescription').value.trim();

    if (!title || !category || !location || !description) {
        showErrorToast('Please fill all fields');
        return;
    }

    try {
        const ticket = {
            id: generateId(),
            title, category, priority, location, description,
            status: 'Not Assigned',
            createdBy: auth.getCurrentUser().id,
            createdAt: new Date().toISOString()
        };

        dataService.createTicket(ticket);
        showSuccessToast('Ticket raised successfully!');
        document.getElementById('raiseTicketForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('raiseTicketModal')).hide();
    } catch (error) {
        showErrorToast('Failed to raise ticket');
    }
}

async function handleAssignTicket(auth, dataService) {
    const ticketId = document.getElementById('assignTicketId').value;
    const staffId = document.getElementById('assignStaff').value;
    const dueDate = document.getElementById('assignDueDate').value;
    const priority = document.getElementById('assignPriority').value;

    if (!staffId || !dueDate) {
        showErrorToast('Please fill required fields');
        return;
    }

    try {
        dataService.assignTicket(ticketId, {
            assignedTo: staffId, dueDate, priority,
            assignedBy: auth.getCurrentUser().id,
            assignedAt: new Date().toISOString()
        });

        showSuccessToast('Ticket assigned!');
        bootstrap.Modal.getInstance(document.getElementById('assignTicketModal')).hide();
    } catch (error) {
        showErrorToast('Failed to assign ticket');
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
        showSuccessToast('Logged out successfully');
        setTimeout(() => window.location.reload(), 500);
    }
}

function showSuccessToast(message) { showToast(message, 'success'); }
function showErrorToast(message) { showToast(message, 'error'); }
function showWarningToast(message) { showToast(message, 'warning'); }

function showToast(message, type = 'info') {
    const toast = document.getElementById('alertToast');
    const toastMessage = document.getElementById('toast-message');
    if (!toast || !toastMessage) return;

    toastMessage.innerHTML = message;
    toast.classList.remove('hide', 'success', 'error', 'warning');
    toast.classList.add(type);

    const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
    bsToast.show();
    setTimeout(() => toast.classList.add('hide'), 3500);
}

function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export { generateId, showSuccessToast, showErrorToast, showWarningToast };
