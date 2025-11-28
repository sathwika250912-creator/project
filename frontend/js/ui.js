export class UI {
    constructor(auth, router, dataService) {
        this.auth = auth;
        this.router = router;
        this.dataService = dataService;
    }

    initialize() {
        this.setupEventListeners();
        this.updateProfileModal();
    }

    setupEventListeners() {
        // Notification bell
        const notificationBell = document.getElementById('notification-bell');
        if (notificationBell) {
            notificationBell.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = document.getElementById('notification-dropdown');
                if (dropdown) {
                    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                }
            });
        }

        // Profile dropdown
        const profileBtn = document.getElementById('profile-dropdown-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = document.getElementById('profile-dropdown');
                if (dropdown) {
                    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                }
            });
        }

        // Edit profile link
        const editProfileLinks = document.querySelectorAll('a[href="#profile"]');
        editProfileLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.openEditProfileModal();
            });
        });

        // Click outside to close dropdowns
        document.addEventListener('click', () => {
            const notificationDropdown = document.getElementById('notification-dropdown');
            const profileDropdown = document.getElementById('profile-dropdown');
            if (notificationDropdown) notificationDropdown.style.display = 'none';
            if (profileDropdown) profileDropdown.style.display = 'none';
        });
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
