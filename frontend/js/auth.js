export class Auth {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.isLoggedIn = false;
        this.token = null;
        this.apiUrl = 'http://localhost:5000'; // Backend URL
    }

    initialize() {
        // Check if user is logged in from localStorage
        const userData = localStorage.getItem('currentUser');
        const role = localStorage.getItem('currentRole');
        const token = localStorage.getItem('authToken');
        
        if (userData && role && token) {
            this.currentUser = JSON.parse(userData);
            this.currentRole = role;
            this.token = token;
            this.isLoggedIn = true;
            this.updateUI();
        }
    }

    async login(username, password, role = null) {
        try {
            // Call backend JWT login endpoint
                // Basic client-side validation to match server rules
                const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
                if (!emailRegex.test(username)) {
                    throw new Error('Username must be a valid email address');
                }
                const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
                if (!pwdRegex.test(password)) {
                    throw new Error('Password must be at least 8 characters and include letters, numbers and symbols');
                }

                const response = await fetch(`${this.apiUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

            if (!response.ok) {
                throw new Error('Login failed: Invalid credentials');
            }

            const data = await response.json();
            this.token = data.token;

            // Use user object returned from backend
            if (data.user) {
                this.currentUser = data.user;
                this.currentRole = data.user.role;
            } else {
                // Fallback: infer role from username
                const uname = username.toLowerCase();
                this.currentRole = uname.includes('admin') ? 'admin' : (uname.includes('staff') ? 'staff' : 'student');
                this.currentUser = this.createDemoUser(this.currentRole);
            }

            this.isLoggedIn = true;
            this.saveToStorage();
            this.updateUI();

            return this.currentUser;
        } catch (error) {
            throw new Error(error.message || 'Login failed');
        }
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
        // Clear all auth data from localStorage and memory
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentRole');
        localStorage.removeItem('authToken');
        this.currentUser = null;
        this.currentRole = null;
        this.token = null;
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

    getToken() {
        return this.token;
    }

    isAuthenticated() {
        return !!this.currentUser && !!this.token;
    }

    // Helper to make authenticated API calls with JWT token
    async apiCall(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add Authorization header if token exists
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.apiUrl}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Token expired or invalid - logout user
            this.logout();
            throw new Error('Session expired. Please login again.');
        }

        return response;
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
        if (this.token) {
            localStorage.setItem('authToken', this.token);
        }
    }

    updateUI() {
        // Update UI elements based on authentication state
        const user = this.currentUser;
        const role = this.currentRole;
        
        // Update user info in sidebar
        const usernameEl = document.getElementById('sidebar-username');
        const userRoleEl = document.getElementById('sidebar-userrole');
        const topbarUsernameEl = document.getElementById('topbar-username');
        
        if (usernameEl) usernameEl.textContent = user.name;
        if (userRoleEl) userRoleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        if (topbarUsernameEl) topbarUsernameEl.textContent = user.name;
        
        // Update avatar if element exists
        const sidebarAvatar = document.querySelector('#sidebar .user-profile img');
        const topbarAvatar = document.getElementById('topbar-avatar');
        if (sidebarAvatar && user.avatar) {
            sidebarAvatar.src = user.avatar;
            sidebarAvatar.alt = user.name;
        }
        if (topbarAvatar && user.avatar) {
            topbarAvatar.src = user.avatar;
            topbarAvatar.alt = user.name;
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
                { path: 'notifications', title: 'Notifications', icon: 'bell' }
            ],
            staff: [
                { path: 'dashboard', title: 'Dashboard', icon: 'tachometer-alt' },
                { path: 'assigned-tickets', title: 'Assigned Tickets', icon: 'clipboard-list' },
                { path: 'notifications', title: 'Notifications', icon: 'bell' }
            ],
            admin: [
                { path: 'dashboard', title: 'Dashboard', icon: 'tachometer-alt' },
                { path: 'assign-tickets', title: 'Assign Tickets', icon: 'user-tag' },
                { path: 'manage-staff', title: 'Manage Staff', icon: 'users-cog' },
                { path: 'notifications', title: 'Notifications', icon: 'bell' }
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
        
        // Add click handlers to all menu links
        document.querySelectorAll('#sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
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
}
