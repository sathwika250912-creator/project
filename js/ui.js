export class UI {
    constructor(auth, router, dataService) {
        this.auth = auth;
        this.router = router;
        this.dataService = dataService;
        this.notificationCount = 0;
    }

    initialize() {
        this.initializeSidebar();
        this.initializeModals();
        this.initializeEventListeners();
        this.initializeProfileEditListeners();
        this.updateNotificationCount();
        
        // Initialize tooltips
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }

    initializeSidebar() {
        const sidebarToggle = document.getElementById('sidebarCollapse');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('active');
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const isClickInsideSidebar = sidebar.contains(e.target);
            const isClickOnToggle = e.target === sidebarToggle || sidebarToggle.contains(e.target);
            
            if (!isClickInsideSidebar && !isClickOnToggle && window.innerWidth <= 768) {
                sidebar.classList.add('active');
            }
        });
    }

    initializeModals() {
        // Initialize any modals that should be available globally
        this.initializeCreateTicketModal();
        this.initializeAssignTicketModal();
    }

    initializeCreateTicketModal() {
        const createTicketModal = document.getElementById('createTicketModal');
        if (createTicketModal) {
            createTicketModal.addEventListener('shown.bs.modal', () => {
                // Focus the first input when modal is shown
                const firstInput = createTicketModal.querySelector('input, select, textarea');
                if (firstInput) firstInput.focus();
            });

            // Reset form when modal is hidden
            createTicketModal.addEventListener('hidden.bs.modal', () => {
                const form = createTicketModal.querySelector('form');
                if (form) form.reset();
            });
        }
    }

    initializeAssignTicketModal() {
        const assignTicketModal = document.getElementById('assignTicketModal');
        if (assignTicketModal) {
            assignTicketModal.addEventListener('shown.bs.modal', () => {
                // Focus the first input when modal is shown
                const firstInput = assignTicketModal.querySelector('input, select, textarea');
                if (firstInput) firstInput.focus();
            });
        }
    }

    initializeEventListeners() {
        // Global event listeners that should be available on all pages
        this.initializeLogoutButton();
        this.initializeRoleSwitcher();
        this.initializeRaiseTicketButton();
        this.initializeFormSubmissions();
    }

    initializeLogoutButton() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.auth.logout());
        }
    }

    initializeRoleSwitcher() {
        const roleDropdown = document.getElementById('roleDropdown');
        if (roleDropdown) {
            roleDropdown.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Toggle dropdown
                const dropdownMenu = roleDropdown.nextElementSibling;
                if (dropdownMenu) {
                    const isShown = dropdownMenu.classList.contains('show');
                    
                    // Close all other dropdowns
                    document.querySelectorAll('.dropdown-menu').forEach(menu => {
                        if (menu !== dropdownMenu) {
                            menu.classList.remove('show');
                        }
                    });
                    
                    // Toggle current dropdown
                    dropdownMenu.classList.toggle('show', !isShown);
                }
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!roleDropdown.contains(e.target)) {
                    const dropdownMenu = roleDropdown.nextElementSibling;
                    if (dropdownMenu) {
                        dropdownMenu.classList.remove('show');
                    }
                }
            });
            
            // Handle role selection
            document.querySelectorAll('#role-options .dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const role = e.currentTarget.getAttribute('data-role');
                    this.auth.switchRole(role);
                    
                    // Update UI
                    const currentRoleEl = document.getElementById('current-role');
                    if (currentRoleEl) {
                        currentRoleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
                    }
                    
                    // Navigate to dashboard for the new role
                    this.router.navigateTo('dashboard');
                });
            });
        }
    }

    initializeRaiseTicketButton() {
        // Handle raise ticket button in the header
        const raiseTicketBtn = document.getElementById('raise-ticket-btn');
        if (raiseTicketBtn) {
            raiseTicketBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = new bootstrap.Modal(document.getElementById('createTicketModal'));
                modal.show();
            });
        }
    }

    initializeFormSubmissions() {
        // Handle ticket form submission
        const ticketForm = document.getElementById('ticketForm');
        if (ticketForm) {
            ticketForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleTicketSubmission();
            });
        }
        
        // Handle assign ticket form submission
        const assignForm = document.getElementById('assignForm');
        if (assignForm) {
            assignForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAssignTicket();
            });
        }
    }

    async handleTicketSubmission() {
        const form = document.getElementById('ticketForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const ticketData = {
            title: formData.get('title') || document.getElementById('ticketTitle')?.value,
            category: formData.get('category') || document.getElementById('ticketCategory')?.value,
            priority: formData.get('priority') || document.getElementById('ticketPriority')?.value,
            // description removed
            location: formData.get('location') || document.getElementById('ticketLocation')?.value,
            status: 'open',
            createdAt: new Date().toISOString(),
            createdBy: this.auth.getCurrentUser().id
        };
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]') || document.getElementById('submitTicket');
        const originalBtnText = submitBtn?.innerHTML;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
        }
        
        try {
            // In a real app, this would be an API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Generate a unique ID for the ticket
            ticketData.id = 'T' + Math.floor(1000 + Math.random() * 9000);
            
            // Save to local storage (in a real app, this would be an API call)
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            tickets.push(ticketData);
            localStorage.setItem('tickets', JSON.stringify(tickets));
            
            // Show success message
            this.showToast('Success', 'Ticket submitted successfully!', 'success');
            
            // Close modal if it's open
            const modal = bootstrap.Modal.getInstance(document.getElementById('createTicketModal'));
            if (modal) modal.hide();
            
            // Reset form
            form.reset();
            
            // Redirect to tickets list or refresh current view
            if (this.router.currentRoute?.view === 'raise-ticket') {
                this.router.navigateTo('my-tickets');
            } else {
                this.router.navigateTo(this.router.currentRoute?.path || 'dashboard', false);
            }
        } catch (error) {
            console.error('Error submitting ticket:', error);
            this.showToast('Error', 'Failed to submit ticket. Please try again.', 'error');
        } finally {
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    }

    async handleAssignTicket() {
        const form = document.getElementById('assignForm');
        if (!form) return;
        
        const ticketId = document.getElementById('ticketIdToAssign')?.value;
        const staffId = document.getElementById('staffSelect')?.value;
        const dueDate = document.getElementById('dueDate')?.value;
        const notes = document.getElementById('assignNotes')?.value;
        
        if (!ticketId || !staffId || !dueDate) {
            this.showToast('Error', 'Please fill in all required fields', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]') || document.getElementById('confirmAssign');
        const originalBtnText = submitBtn?.innerHTML;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Assigning...';
        }
        
        try {
            // In a real app, this would be an API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update ticket in local storage
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            const ticketIndex = tickets.findIndex(t => t.id === ticketId);
            
            if (ticketIndex !== -1) {
                tickets[ticketIndex] = {
                    ...tickets[ticketIndex],
                    status: 'assigned',
                    assignedTo: staffId,
                    dueDate: dueDate,
                    updatedAt: new Date().toISOString()
                };
                
                localStorage.setItem('tickets', JSON.stringify(tickets));
                
                // Show success message
                this.showToast('Success', 'Ticket assigned successfully!', 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('assignTicketModal'));
                if (modal) modal.hide();
                
                // Reset form
                form.reset();
                
                // Refresh the current view
                this.router.navigateTo(this.router.currentRoute?.path || 'all-tickets', false);
            } else {
                throw new Error('Ticket not found');
            }
        } catch (error) {
            console.error('Error assigning ticket:', error);
            this.showToast('Error', 'Failed to assign ticket. Please try again.', 'error');
        } finally {
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText || 'Assign';
            }
        }
    }

    updateNotificationCount(count) {
        this.notificationCount = count || 0;
        const notificationBadge = document.getElementById('notification-count');
        if (notificationBadge) {
            notificationBadge.textContent = count || '0';
            notificationBadge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    showToast(title, message, type = 'info') {
        // Create toast element if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.top = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = '1100';
            document.body.appendChild(toastContainer);
        }
        
        const toastId = 'toast-' + Date.now();
        const typeClass = {
            success: 'bg-success',
            error: 'bg-danger',
            warning: 'bg-warning',
            info: 'bg-info'
        }[type] || 'bg-primary';
        
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast show ${typeClass} text-white mb-2`;
        toast.role = 'alert';
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <h6 class="mb-1">${title}</h6>
                    <p class="mb-0">${message}</p>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto-remove toast after 5 seconds
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                toastElement.classList.remove('show');
                setTimeout(() => {
                    toastElement.remove();
                }, 300);
            }
        }, 5000);
        
        // Add click to dismiss
        toast.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    }

    showLoading(show = true, message = 'Loading...') {
        let loadingElement = document.getElementById('loading-overlay');
        
        if (show) {
            if (!loadingElement) {
                loadingElement = document.createElement('div');
                loadingElement.id = 'loading-overlay';
                loadingElement.style.position = 'fixed';
                loadingElement.style.top = '0';
                loadingElement.style.left = '0';
                loadingElement.style.width = '100%';
                loadingElement.style.height = '100%';
                loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                loadingElement.style.display = 'flex';
                loadingElement.style.justifyContent = 'center';
                loadingElement.style.alignItems = 'center';
                loadingElement.style.zIndex = '9999';
                
                loadingElement.innerHTML = `
                    <div class="text-center text-white">
                        <div class="spinner-border mb-2" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mb-0">${message}</p>
                    </div>
                `;
                
                document.body.appendChild(loadingElement);
            } else {
                loadingElement.style.display = 'flex';
            }
            
            // Prevent scrolling when loading is shown
            document.body.style.overflow = 'hidden';
        } else if (loadingElement) {
            loadingElement.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // Helper method to format dates
    formatDate(dateString, format = 'short') {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        const options = {
            year: 'numeric',
            month: format === 'short' ? 'short' : 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString(undefined, options);
    }

    openEditProfileModal() {
        const user = this.auth.getCurrentUser();
        
        // Populate form fields with current user data
        document.getElementById('editProfileName').value = user.name || '';
        document.getElementById('editProfileEmail').value = user.email || '';
        document.getElementById('editProfilePhone').value = user.phone || '';
        document.getElementById('editProfileDepartment').value = user.department || '';
        document.getElementById('editProfileAddress').value = user.address || '';
        document.getElementById('editProfileIdNumber').value = user.idNumber || '';
        document.getElementById('editProfilePosition').value = user.position || '';
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        modal.show();
    }

    initializeProfileEditListeners() {
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', async () => {
                await this.saveProfileChanges();
            });
        }
    }

    async saveProfileChanges() {
        const editForm = document.getElementById('editProfileForm');
        if (!editForm) return;
        
        const profileData = {
            name: document.getElementById('editProfileName').value,
            email: document.getElementById('editProfileEmail').value,
            phone: document.getElementById('editProfilePhone').value,
            department: document.getElementById('editProfileDepartment').value,
            address: document.getElementById('editProfileAddress').value,
            idNumber: document.getElementById('editProfileIdNumber').value,
            position: document.getElementById('editProfilePosition').value
        };
        
        // Validate required fields
        if (!profileData.name || !profileData.email) {
            this.showToast('Error', 'Name and email are required', 'error');
            return;
        }
        
        // Show loading state
        const saveBtn = document.getElementById('saveProfileBtn');
        const originalBtnText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update the profile using auth service
            this.auth.updateProfile(profileData);
            
            // Show success message
            this.showToast('Success', 'Profile updated successfully!', 'success');
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
            if (modal) modal.hide();
            
            // Refresh the profile view if it's currently displayed
            if (this.router.currentRoute?.view === 'profile') {
                this.router.navigateTo('profile', false);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showToast('Error', 'Failed to update profile. Please try again.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnText;
        }
    }
}
