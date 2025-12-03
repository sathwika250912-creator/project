export class UI {
    constructor(auth, router, dataService) {
        this.auth = auth;
        this.router = router;
        this.dataService = dataService;
    }

    initialize() {
        this.setupEventListeners();
        this.updateProfileModal();
        this.renderNotifications();
    }

    setupEventListeners() {
        // Notification bell -> toggle notifications dropdown
        const notificationBell = document.getElementById('notification-bell');
        if (notificationBell) {
            notificationBell.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = document.getElementById('notification-dropdown');
                if (dropdown) {
                    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                }
            });
        }
        const notificationDropdownEl = document.getElementById('notification-dropdown');
        if (notificationDropdownEl) {
            notificationDropdownEl.addEventListener('click', (e) => e.stopPropagation());
        }

        // Profile button -> toggle profile dropdown
        const profileBtn = document.getElementById('profile-dropdown-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = document.getElementById('profile-dropdown');
                if (dropdown) {
                    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                }
            });
        }
        const profileDropdownEl = document.getElementById('profile-dropdown');
        if (profileDropdownEl) {
            profileDropdownEl.addEventListener('click', (e) => e.stopPropagation());
        }

        // Edit profile and profile links -> navigate to profile page
        const profileLinks = document.querySelectorAll('a[href="#profile"]');
        profileLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.router) this.router.navigateTo('profile');
            });
        });

        // Topbar logout link in the profile dropdown
        const topbarLogout = document.getElementById('topbar-logout-link');
        if (topbarLogout) {
            topbarLogout.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.app && window.app.auth) {
                    if (confirm('Are you sure you want to logout?')) {
                        window.app.auth.logout();
                        // Clear route and ensure login page visible
                        try { window.location.hash = ''; } catch (e) {}
                        this.showSuccessToast('Logged out successfully');
                    }
                }
            });
        }

        // Click outside to close dropdowns
        document.addEventListener('click', () => {
            const notificationDropdown = document.getElementById('notification-dropdown');
            const profileDropdown = document.getElementById('profile-dropdown');
            if (notificationDropdown) notificationDropdown.style.display = 'none';
            if (profileDropdown) profileDropdown.style.display = 'none';
        });

        // Mark all notifications as read (dropdown control)
        const markAllBtn = document.getElementById('mark-all-read');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Clear demo notifications and update UI
                const notifs = [];
                localStorage.setItem('notifications', JSON.stringify(notifs));
                const list = document.getElementById('notification-list');
                if (list) list.innerHTML = '<p class="text-center text-muted py-3">No notifications</p>';
                const count = document.getElementById('notification-count');
                if (count) count.textContent = '0';
                this.renderNotifications();
            });
        }

        // View All notifications -> navigate to page
        const viewAll = document.getElementById('view-all-notifications');
        if (viewAll) {
            viewAll.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.router) this.router.navigateTo('notifications');
                const dropdown = document.getElementById('notification-dropdown');
                if (dropdown) dropdown.style.display = 'none';
            });
        }
    }

    renderNotifications() {
        const listEl = document.getElementById('notification-list');
        const countEl = document.getElementById('notification-count');
        const raw = localStorage.getItem('notifications');
        const items = raw ? JSON.parse(raw) : [];
        if (!listEl) return;
        if (!items || items.length === 0) {
            listEl.innerHTML = '<p class="text-center text-muted py-3">No notifications</p>';
            if (countEl) countEl.textContent = '0';
            return;
        }
        listEl.innerHTML = items.map(n => `
            <div class="notification-item" data-id="${n.id}">
                <div class="notification-icon bg-light"> <i class="fas fa-bell"></i></div>
                <div class="notification-content">
                    <h6 class="mb-0">${n.title}</h6>
                    <small class="text-muted">${n.message}</small>
                </div>
            </div>
        `).join('');
        if (countEl) countEl.textContent = String(items.length);
    }

    updateProfileModal() {
        const user = this.auth.getCurrentUser();
        
        document.getElementById('editName').value = user.name || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editPhone').value = user.phone || '';
        document.getElementById('editDepartment').value = user.department || '';
        document.getElementById('editIdNumber').value = user.id || '';
        document.getElementById('editPosition').value = user.position || user.role || '';
    }

    openEditProfileModal() {
        this.updateProfileModal();
        const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        modal.show();
    }

    saveProfileChanges() {
        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const department = document.getElementById('editDepartment').value.trim();

        if (!name || !email) {
            this.showErrorToast('Please fill required fields');
            return;
        }

        const updated = this.auth.updateProfile({
            name, email, phone, department
        });

        if (updated) {
            this.showSuccessToast('Profile updated successfully!');
            bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
        }
    }

    showSuccessToast(message) {
        this.showToast(message, 'success');
    }

    showErrorToast(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
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
}
