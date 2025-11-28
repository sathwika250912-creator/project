export class Auth {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.isLoggedIn = false;
    }

    initialize() {
        // Check if user is logged in from localStorage
        const userData = localStorage.getItem('currentUser');
        const role = localStorage.getItem('currentRole');
        
        if (userData && role) {
            this.currentUser = JSON.parse(userData);
            this.currentRole = role;
            this.isLoggedIn = true;
            this.updateUI();
        }
    }

    async login(username, password, role) {
        return new Promise((resolve, reject) => {
            // Simulate API call with validation
            setTimeout(() => {
                // For demo purposes, accept any non-empty credentials
                if (username && password) {
                    this.currentUser = this.createDemoUser(role);
                    this.currentRole = role;
                    this.isLoggedIn = true;
                    this.saveToStorage();
                    this.updateUI();
                    resolve(this.currentUser);
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 1000);
        });
    }

    createDemoUser(role) {
        const demoUsers = {
            student: {
                id: 'U1001',
                name: 'Alex Johnson',
                email: 'alex.johnson@example.com',
                role: 'student',
                department: 'Computer Science',
                idNumber: 'S12345678',
                phone: '+1 (555) 123-4567',
                joinDate: '2023-09-01',
                avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=random'
            },
            staff: {
                id: 'E2001',
                name: 'Sarah Wilson',
                email: 'sarah.wilson@example.com',
                role: 'staff',
                department: 'Facilities Management',
                position: 'Maintenance Technician',
                phone: '+1 (555) 987-6543',
                joinDate: '2022-01-15',
                avatar: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=random'
            },
            admin: {
                id: 'A3001',
                name: 'Admin User',
                email: 'admin@campus.edu',
                role: 'admin',
                department: 'Administration',
                position: 'System Administrator',
                phone: '+1 (555) 555-1234',
                joinDate: '2020-05-10',
                avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=random'
            }
        };

        return demoUsers[role] || demoUsers.student;
    }

    logout() {
        // In a real app, this would also call the API to invalidate the session
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentRole');
        this.currentUser = null;
        this.currentRole = null;
        this.isLoggedIn = false;
        
        // Redirect to login page
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('main-wrapper').style.display = 'none';
        
        // Show login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
    }

    switchRole(newRole) {
        if (['student', 'staff', 'admin'].includes(newRole)) {
            this.currentRole = newRole;
            this.saveToStorage();
            this.updateUI();
            return true;
        }
        return false;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentRole() {
        return this.currentRole;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    hasRole(role) {
        return this.currentRole === role;
    }

    saveToStorage() {
        if (this.currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
        if (this.currentRole) {
            localStorage.setItem('currentRole', this.currentRole);
        }
    }

    updateUI() {
        // Update UI elements based on authentication state
        const user = this.currentUser;
        const role = this.currentRole;
        
        // Update user info in sidebar
        const usernameEl = document.getElementById('username');
        const userRoleEl = document.getElementById('user-role');
        const currentRoleEl = document.getElementById('current-role');
        
        if (usernameEl) usernameEl.textContent = user.name;
        if (userRoleEl) userRoleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        if (currentRoleEl) currentRoleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        
        // Update avatar if element exists
        const avatarImg = document.querySelector('.user-profile img');
        if (avatarImg && user.avatar) {
            avatarImg.src = user.avatar;
            avatarImg.alt = user.name;
        }
        
        // Update sidebar menu based on role
        this.updateSidebarMenu(role);
    }

    updateSidebarMenu(role) {
        const sidebarMenu = document.getElementById('sidebar-menu');
        if (!sidebarMenu) return;
        
        const routes = {
            student: [
                { path: 'dashboard', title: 'Dashboard', icon: 'tachometer-alt' },
                { path: 'raise-ticket', title: 'Raise Ticket', icon: 'plus-circle' },
                { path: 'my-tickets', title: 'My Tickets', icon: 'ticket-alt' },
                { path: 'notifications', title: 'Notifications', icon: 'bell' },
                { path: 'profile', title: 'Profile', icon: 'user' }
            ],
            staff: [
                { path: 'dashboard', title: 'Dashboard', icon: 'tachometer-alt' },
                { path: 'assigned-tickets', title: 'Assigned Tickets', icon: 'clipboard-list' },
                { path: 'my-works', title: 'My Works', icon: 'tools' },
                { path: 'notifications', title: 'Notifications', icon: 'bell' },
                { path: 'profile', title: 'Profile', icon: 'user' }
            ],
            admin: [
                { path: 'dashboard', title: 'Dashboard', icon: 'tachometer-alt' },
                { path: 'all-tickets', title: 'All Tickets', icon: 'tickets' },
                { path: 'assign-tickets', title: 'Assign Tickets', icon: 'user-tag' },
                { path: 'manage-staff', title: 'Manage Staff', icon: 'users-cog' },
                { path: 'notifications', title: 'Notifications', icon: 'bell' },
                { path: 'profile', title: 'Profile', icon: 'user' }
            ]
        };
        
        const menuItems = routes[role] || routes.student;
        const currentHash = window.location.hash.replace('#', '') || 'dashboard';
        
        sidebarMenu.innerHTML = menuItems.map(item => `
            <li>
                <a href="#${item.path}" class="${currentHash === item.path ? 'active' : ''}">
                    <i class="fas fa-${item.icon}"></i>
                    <span>${item.title}</span>
                </a>
            </li>
        `).join('');
        
        // Add logout button at the bottom
        const logoutItem = document.createElement('li');
        logoutItem.className = 'mt-auto';
        logoutItem.innerHTML = `
            <a href="#" id="logout-link">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </a>
        `;
        sidebarMenu.appendChild(logoutItem);
        
        // Add event listener to logout link
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        // Add click handlers to all menu links
        document.querySelectorAll('#sidebar-menu a:not(#logout-link)').forEach(link => {
            link.addEventListener('click', (e) => {
                // Let the router handle navigation via hash change
                // Remove active class from all links
                document.querySelectorAll('#sidebar-menu a').forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                link.classList.add('active');
            });
        });
    }

    // Check if user has permission for a specific action
    hasPermission(permission) {
        const permissions = {
            student: ['view_tickets', 'create_tickets', 'view_profile'],
            staff: ['view_tickets', 'update_tickets', 'view_profile', 'update_own_tickets'],
            admin: ['view_all_tickets', 'create_tickets', 'assign_tickets', 'manage_staff', 'view_reports']
        };
        
        return permissions[this.currentRole]?.includes(permission) || false;
    }

    updateProfile(profileData) {
        if (this.currentUser) {
            this.currentUser = {
                ...this.currentUser,
                ...profileData
            };
            this.saveToStorage();
            this.updateUI();
            return this.currentUser;
        }
        return null;
    }
