export class Router {
    constructor(auth, dataService, ui = null) {
        this.auth = auth;
        this.dataService = dataService;
        this.ui = ui;
        this.routes = [];
        this.currentRoute = null;
        this.views = {};
    }

    initialize() {
        // Define routes for each role
        this.defineRoutes();
        // Handle browser back/forward
        window.addEventListener('popstate', () => this.handleRouteChange());
        // Initial route handling
        this.handleRouteChange();
    }

    defineRoutes() {
        // Common routes for all roles
        const commonRoutes = [
            { path: 'dashboard', view: 'dashboard', title: 'Dashboard', icon: 'tachometer-alt' },
            { path: 'profile', view: 'profile', title: 'My Profile', icon: 'user' },
            { path: 'notifications', view: 'notifications', title: 'Notifications', icon: 'bell' }
        ];

        // Student/Staff routes
        this.routes['student'] = [
            ...commonRoutes,
            { path: 'raise-ticket', view: 'raise-ticket', title: 'Raise Ticket', icon: 'plus-circle' },
            { path: 'my-tickets', view: 'my-tickets', title: 'My Tickets', icon: 'ticket-alt' }
        ];

        // Admin routes
        this.routes['admin'] = [
            ...commonRoutes,
            { path: 'all-tickets', view: 'all-tickets', title: 'All Tickets', icon: 'tickets' },
            { path: 'assign-tickets', view: 'assign-tickets', title: 'Assign Tickets', icon: 'user-tag' },
            { path: 'manage-staff', view: 'manage-staff', title: 'Manage Staff', icon: 'users-cog' }
        ];

        // Staff routes
        this.routes['staff'] = [
            ...commonRoutes,
            { path: 'assigned-tickets', view: 'assigned-tickets', title: 'Assigned Tickets', icon: 'clipboard-list' },
            { path: 'my-works', view: 'my-works', title: 'My Works', icon: 'tools' },
            { path: 'reports', view: 'reports', title: 'Reports', icon: 'chart-bar' }
        ];
    }

    getRoutesForRole(role) {
        return this.routes[role] || [];
    }

    async navigateTo(path, pushState = true) {
        if (pushState) {
            history.pushState({}, '', `#${path}`);
        }
        await this.handleRouteChange();
    }

    async handleRouteChange() {
        const path = window.location.hash.replace('#', '') || 'dashboard';
        const role = this.auth.getCurrentRole();
        console.log(`[Router] handleRouteChange - path: ${path}, role: ${role}`);
        
        const routes = this.getRoutesForRole(role);
        console.log(`[Router] Available routes for ${role}:`, routes.map(r => r.path));
        
        const route = routes.find(r => r.path === path) || routes[0];
        console.log(`[Router] Matched route:`, route);
        
        if (route) {
            this.currentRoute = route;
            document.title = `${route.title} | Smart Campus`;
            console.log(`[Router] Loading view: ${route.view}`);
            
            try {
                await this.loadView(route.view);
                console.log(`[Router] View loaded successfully`);
                this.updateActiveNav();
            } catch (error) {
                console.error(`[Router] Error loading view:`, error);
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class="alert alert-danger">
                            <h5>Error Loading Page</h5>
                            <p>Error: ${error.message}</p>
                            <button class="btn btn-sm btn-outline-secondary" onclick="window.location.reload()">
                                <i class="fas fa-sync-alt me-1"></i> Reload Page
                            </button>
                        </div>
                    `;
                }
            }
        }
    }

    async loadView(viewName) {
        console.log(`[Router.loadView] Starting to load view: ${viewName}`);
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('[Router.loadView] main-content element not found!');
            return;
        }
        
        console.log(`[Router.loadView] main-content element found`);

        // Show loading indicator
        mainContent.innerHTML = `
            <div class="spinner-container">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

        try {
            // In a real app, this would be an API call or dynamic import
            // For now, we'll use a simple switch case
            let viewHTML = '';
            
            console.log(`[Router.loadView] Switching to view: ${viewName}`);
            
            switch(viewName) {
                case 'dashboard':
                    console.log('[Router.loadView] Getting dashboard view');
                    viewHTML = await this.getDashboardView();
                    break;
                case 'my-tickets':
                case 'all-tickets':
                case 'assigned-tickets':
                    viewHTML = await this.getTicketsView(viewName);
                    break;
                case 'raise-ticket':
                    viewHTML = await this.getRaiseTicketView();
                    break;
                case 'profile':
                    viewHTML = await this.getProfileView();
                    break;
                case 'notifications':
                    viewHTML = await this.getNotificationsView();
                    break;
                default:
                    viewHTML = this.getDefaultView();
            }
            
            console.log(`[Router.loadView] View HTML generated, setting innerHTML`);
            
            mainContent.innerHTML = viewHTML;
            this.updateActiveNav();
            this.attachEventListeners(viewName);
            
            console.log(`[Router.loadView] View loaded successfully`);
        } catch (error) {
            console.error('[Router.loadView] Error loading view:', error);
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    <h5>Error Loading Page</h5>
                    <p>There was an error loading the requested page. Please try again later.</p>
                    <p><small>${error.message}</small></p>
                    <button class="btn btn-sm btn-outline-secondary" onclick="window.location.reload()">
                        <i class="fas fa-sync-alt me-1"></i> Reload Page
                    </button>
                </div>
            `;
        }
    }

    updateActiveNav() {
        // Remove active class from all menu items
        const allLinks = document.querySelectorAll('#sidebar-menu li a');
        allLinks.forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current menu item
        const currentPath = this.currentRoute?.path || 'dashboard';
        const activeItem = document.querySelector(`#sidebar-menu a[href="#${currentPath}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    // View generators
    async getDashboardView() {
        console.log('[getDashboardView] Starting');
        const role = this.auth.getCurrentRole();
        const user = this.auth.getCurrentUser();
        console.log('[getDashboardView] Role:', role);
        console.log('[getDashboardView] User:', user);
        
        // Return a simple dashboard immediately
        return `
            <div class="dashboard">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="mb-0">Dashboard</h2>
                    ${role !== 'staff' ? `
                        <button class="btn btn-primary" id="raise-ticket-btn">
                            <i class="fas fa-plus me-2"></i>Raise New Ticket
                        </button>
                    ` : ''}
                </div>
                
                <div class="row">
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="fas fa-user fa-3x text-primary mb-3"></i>
                                <h6>Welcome</h6>
                                <p class="mb-0"><strong>${user.name}</strong></p>
                                <small class="text-muted">${role.charAt(0).toUpperCase() + role.slice(1)}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="fas fa-envelope fa-3x text-success mb-3"></i>
                                <h6>Email</h6>
                                <small>${user.email}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="fas fa-phone fa-3x text-info mb-3"></i>
                                <h6>Phone</h6>
                                <small>${user.phone}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="fas fa-building fa-3x text-warning mb-3"></i>
                                <h6>Department</h6>
                                <small>${user.department || 'N/A'}</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Quick Info</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>ID Number:</strong> ${user.idNumber || 'N/A'}</p>
                                        <p><strong>Join Date:</strong> ${user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
                                        <p><strong>Position:</strong> ${user.position || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="alert alert-info mt-4">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Welcome to Smart Campus!</strong> Use the menu on the left to navigate to different sections.
                </div>
            </div>
        `;
    }

    async getTicketsView(viewType) {
        const role = this.auth.getCurrentRole();
        let tickets = [];
        let title = '';
        let showActions = true;
        
        switch(viewType) {
            case 'my-tickets':
                tickets = await this.dataService.getUserTickets('my');
                title = 'My Tickets';
                showActions = false;
                break;
            case 'assigned-tickets':
                tickets = await this.dataService.getUserTickets('assigned');
                title = 'Assigned Tickets';
                break;
            case 'all-tickets':
                tickets = await this.dataService.getAllTickets();
                title = 'All Tickets';
                break;
        }
        
        const ticketsTable = this.generateTicketsTable(tickets, role === 'admin');
        
        return `
            <div class="tickets-view">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="mb-0">${title}</h2>
                    ${role !== 'staff' ? `
                        <button class="btn btn-primary" id="raise-ticket-btn">
                            <i class="fas fa-plus me-2"></i>Raise New Ticket
                        </button>
                    ` : ''}
                </div>
                
                <div class="card
                    ${tickets.length === 0 ? 'd-flex align-items-center justify-content-center' : ''}
                ">
                    ${tickets.length > 0 ? `
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Ticket ID</th>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            ${role === 'admin' ? '<th>Raised By</th>' : ''}
                                            <th>Date Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${ticketsTable}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : `
                        <div class="empty-state py-5">
                            <i class="fas fa-ticket-alt text-muted"></i>
                            <h5>No Tickets Found</h5>
                            <p class="mb-4">There are no tickets to display at the moment.</p>
                            ${role !== 'staff' ? `
                                <button class="btn btn-primary" id="raise-ticket-btn">
                                    <i class="fas fa-plus me-2"></i>Raise Your First Ticket
                                </button>
                            ` : ''}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    generateTicketsTable(tickets, isAdmin = false) {
        if (!tickets || tickets.length === 0) return '';
        
        return tickets.map(ticket => {
            const statusClass = this.getStatusClass(ticket.status);
            const priorityClass = this.getPriorityClass(ticket.priority);
            
            return `
                <tr>
                    <td>#${ticket.id}</td>
                    <td>
                        <a href="#ticket/${ticket.id}" class="text-primary fw-medium">
                            ${ticket.title}
                        </a>
                    </td>
                    <td>${ticket.category}</td>
                    <td><span class="badge ${statusClass}">${ticket.status}</span></td>
                    <td>
                        <span class="priority-indicator priority-${ticket.priority}"></span>
                        ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </td>
                    ${isAdmin ? `<td>${ticket.raisedBy || 'N/A'}</td>` : ''}
                    <td>${new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" 
                                data-bs-toggle="dropdown" aria-expanded="false">
                                Actions
                            </button>
                            <ul class="dropdown-menu">
                                <li>
                                    <a class="dropdown-item" href="#ticket/${ticket.id}">
                                        <i class="far fa-eye me-2"></i>View Details
                                    </a>
                                </li>
                                ${ticket.status === 'Not Assigned' && isAdmin ? `
                                    <li>
                                        <a class="dropdown-item assign-ticket" href="#" data-ticket-id="${ticket.id}">
                                            <i class="fas fa-user-tag me-2"></i>Assign
                                        </a>
                                    </li>
                                ` : ''}
                                ${ticket.status === 'assigned' && !isAdmin ? `
                                    <li>
                                        <a class="dropdown-item update-status" href="#" 
                                           data-ticket-id="${ticket.id}" data-status="in-progress">
                                            <i class="fas fa-spinner me-2"></i>Start Work
                                        </a>
                                    </li>
                                ` : ''}
                                ${ticket.status === 'in-progress' && !isAdmin ? `
                                    <li>
                                        <a class="dropdown-item update-status" href="#" 
                                           data-ticket-id="${ticket.id}" data-status="completed">
                                            <i class="fas fa-check-circle me-2"></i>Mark as Completed
                                        </a>
                                    </li>
                                ` : ''}
                            </ul>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getStatusClass(status) {
        switch(status.toLowerCase()) {
            case 'Not Assigned': return 'badge-status-open';
            case 'in-progress': return 'badge-status-in-progress';
            case 'completed': return 'badge-status-completed';
            case 'Emergency': return 'badge-status-Emergency';
            default: return 'badge-secondary';
        }
    }

    getPriorityClass(priority) {
        return priority.toLowerCase();
    }

    // Other view generators would follow the same pattern...
    getRaiseTicketView() {
        return `
            <div class="raise-ticket">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="mb-0">Raise New Ticket</h2>
                    <a href="#my-tickets" class="btn btn-outline-secondary">
                        <i class="fas fa-arrow-left me-2"></i>Back to My Tickets
                    </a>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <form id="ticketForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="ticketTitle" class="form-label">Title</label>
                                    <input type="text" class="form-control" id="ticketTitle" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="ticketCategory" class="form-label">Category</label>
                                    <select class="form-select" id="ticketCategory" required>
                                        <option value="">Select a category</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="HVAC">HVAC</option>
                                        <option value="Carpentry">Carpentry</option>
                                        <option value="Cleaning">Cleaning</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="ticketPriority" class="form-label">Priority</label>
                                    <select class="form-select" id="ticketPriority" required>
                                        <option value="low">Low</option>
                                        <option value="medium" selected>Medium</option>
                                        <option value="high">High</option>
                                        <option value="Emergency">Emergency</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="ticketLocation" class="form-label">Location</label>
                                    <input type="text" class="form-control" id="ticketLocation" required>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="ticketDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="ticketDescription" rows="5" required></textarea>
                                <div class="form-text">Please provide as much detail as possible about the issue.</div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="ticketAttachment" class="form-label">Attachments (Optional)</label>
                                <input class="form-control" type="file" id="ticketAttachment" multiple>
                                <div class="form-text">You can upload images or documents (max 5MB each)</div>
                            </div>
                            
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" class="btn btn-outline-secondary" id="cancelTicket">
                                    Cancel
                                </button>
                                <button type="submit" class="btn btn-primary" id="submitTicket">
                                    <i class="fas fa-paper-plane me-2"></i>Submit Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    getProfileView() {
        console.log('[getProfileView] Getting user profile...');
        const user = this.auth.getCurrentUser();
        console.log('[getProfileView] User data:', user);
        
        if (!user) {
            console.error('[getProfileView] No user data found!');
            return '<div class="alert alert-danger">No user data found</div>';
        }
        
        return `
            <div class="profile-view">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="mb-0">My Profile</h2>
                    <button class="btn btn-outline-primary" id="editProfileBtn">
                        <i class="fas fa-edit me-2"></i>Edit Profile
                    </button>
                </div>
                
                <div class="row">
                    <div class="col-lg-4">
                        <div class="card mb-4">
                            <div class="card-body text-center">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random" 
                                     alt="Profile" class="rounded-circle img-fluid" style="width: 150px;">
                                <h5 class="my-3">${user.name}</h5>
                                <p class="text-muted mb-1">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                                <p class="text-muted mb-4">${user.department || 'N/A'}</p>
                                <div class="d-flex justify-content-center mb-2">
                                    <button type="button" class="btn btn-primary me-2">Follow</button>
                                    <button type="button" class="btn btn-outline-primary">Message</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card mb-4">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h6 class="mb-0">Contact Information</h6>
                                    <button class="btn btn-sm btn-link p-0">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </div>
                                <hr class="mt-0">
                                <div class="mb-3">
                                    <p class="mb-1"><i class="fas fa-envelope me-2 text-primary"></i> ${user.email || 'N/A'}</p>
                                    <p class="mb-1"><i class="fas fa-phone me-2 text-primary"></i> ${user.phone || 'N/A'}</p>
                                    <p class="mb-0"><i class="fas fa-map-marker-alt me-2 text-primary"></i> ${user.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-8">
                        <div class="card mb-4">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h6 class="mb-0">Personal Information</h6>
                                    <button class="btn btn-sm btn-link p-0">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </div>
                                <hr class="mt-0">
                                <div class="row mb-3">
                                    <div class="col-sm-3">
                                        <p class="mb-0">Full Name</p>
                                    </div>
                                    <div class="col-sm-9">
                                        <p class="text-muted mb-0">${user.name || 'N/A'}</p>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-sm-3">
                                        <p class="mb-0">ID Number</p>
                                    </div>
                                    <div class="col-sm-9">
                                        <p class="text-muted mb-0">${user.idNumber || 'N/A'}</p>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-sm-3">
                                        <p class="mb-0">Department</p>
                                    </div>
                                    <div class="col-sm-9">
                                        <p class="text-muted mb-0">${user.department || 'N/A'}</p>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-sm-3">
                                        <p class="mb-0">Role</p>
                                    </div>
                                    <div class="col-sm-9">
                                        <p class="text-muted mb-0">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-sm-3">
                                        <p class="mb-0">Join Date</p>
                                    </div>
                                    <div class="col-sm-9">
                                        <p class="text-muted mb-0">${user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-body">
                                <h6 class="mb-3">Activity</h6>
                                <div class="timeline">
                                    ${this.generateActivityTimeline(user.activity || [])}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateActivityTimeline(activities) {
        if (!activities || activities.length === 0) {
            return `
                <div class="text-center py-4">
                    <i class="fas fa-history fa-2x text-muted mb-2"></i>
                    <p class="text-muted mb-0">No recent activity</p>
                </div>
            `;
        }
        
        return activities.map(activity => {
            const icon = this.getActivityIcon(activity.type);
            return `
                <div class="d-flex mb-3">
                    <div class="flex-shrink-0 me-3">
                        <div class="bg-light rounded-circle d-flex align-items-center justify-content-center" 
                             style="width: 40px; height: 40px;">
                            <i class="fas fa-${icon} text-primary"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${activity.title}</h6>
                        <p class="text-muted mb-1">${activity.description}</p>
                        <small class="text-muted">
                            <i class="far fa-clock me-1"></i> 
                            ${new Date(activity.timestamp).toLocaleString()}
                        </small>
                    </div>
                </div>
            `;
        }).join('');
    }

    getActivityIcon(type) {
        switch(type) {
            case 'ticket_created': return 'plus-circle';
            case 'ticket_updated': return 'edit';
            case 'ticket_closed': return 'check-circle';
            case 'login': return 'sign-in-alt';
            case 'profile_update': return 'user-edit';
            default: return 'circle';
        }
    }

    getNotificationsView() {
        return `
            <div class="notifications-view">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="mb-0">Notifications</h2>
                    <div>
                        <button class="btn btn-outline-secondary btn-sm me-2" id="mark-all-read">
                            <i class="far fa-check-circle me-1"></i>Mark All as Read
                        </button>
                        <button class="btn btn-outline-danger btn-sm" id="clear-notifications">
                            <i class="far fa-trash-alt me-1"></i>Clear All
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body p-0">
                        <ul class="list-group list-group-flush" id="notifications-list">
                            <!-- Notifications will be loaded here -->
                            <div class="text-center py-5">
                                <i class="far fa-bell-slash fa-2x text-muted mb-3"></i>
                                <p class="text-muted mb-0">No notifications yet</p>
                            </div>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    getDefaultView() {
        return `
            <div class="empty-state py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h3>Page Not Found</h3>
                <p class="text-muted mb-4">The page you are looking for doesn't exist or has been moved.</p>
                <a href="#dashboard" class="btn btn-primary">
                    <i class="fas fa-home me-2"></i>Back to Dashboard
                </a>
            </div>
        `;
    }

    // Helper methods for dashboard widgets
    getAdminDashboardWidgets() {
        return `
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Tickets by Category</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="ticketsByCategoryChart" height="300"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Tickets by Status</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="ticketsByStatusChart" height="300"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Recent Activities</h5>
                            <a href="#" class="btn btn-sm btn-outline-primary">View All</a>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Activity</th>
                                            <th>User</th>
                                            <th>Time</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>1</td>
                                            <td>New ticket created</td>
                                            <td>John Doe</td>
                                            <td>2 mins ago</td>
                                            <td><span class="badge bg-success">Completed</span></td>
                                        </tr>
                                        <tr>
                                            <td>2</td>
                                            <td>Ticket #1234 assigned</td>
                                            <td>Jane Smith</td>
                                            <td>10 mins ago</td>
                                            <td><span class="badge bg-warning text-dark">Pending</span></td>
                                        </tr>
                                        <tr>
                                            <td>3</td>
                                            <td>Ticket #1233 resolved</td>
                                            <td>Mike Johnson</td>
                                            <td>1 hour ago</td>
                                            <td><span class="badge bg-success">Completed</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStaffDashboardWidgets() {
        return `
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">My Performance</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="performanceChart" height="300"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Quick Actions</h5>
                        </div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-6">
                                    <button class="btn btn-outline-primary w-100 py-3">
                                        <i class="fas fa-plus-circle fa-2x mb-2 d-block"></i>
                                        New Work Order
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-outline-success w-100 py-3">
                                        <i class="fas fa-tools fa-2x mb-2 d-block"></i>
                                        My Tasks
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-outline-info w-100 py-3">
                                        <i class="fas fa-calendar-alt fa-2x mb-2 d-block"></i>
                                        Schedule
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-outline-warning w-100 py-3">
                                        <i class="fas fa-chart-bar fa-2x mb-2 d-block"></i>
                                        Reports
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Event listeners for dynamic content
    attachEventListeners(viewName) {
        // Handle sidebar toggle
        const sidebarToggle = document.getElementById('sidebarCollapse');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('active');
            });
        }

        // Handle raise ticket button
        const raiseTicketBtn = document.getElementById('raise-ticket-btn');
        if (raiseTicketBtn) {
            raiseTicketBtn.addEventListener('click', () => {
                // In a real app, we would show a modal or navigate to the ticket creation page
                const modal = new bootstrap.Modal(document.getElementById('createTicketModal'));
                modal.show();
            });
        }

        // Handle ticket form submission
        const ticketForm = document.getElementById('ticketForm');
        if (ticketForm) {
            ticketForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTicketSubmission();
            });
        }

        // Handle cancel button in ticket form
        const cancelTicketBtn = document.getElementById('cancelTicket');
        if (cancelTicketBtn) {
            cancelTicketBtn.addEventListener('click', () => {
                window.location.hash = 'my-tickets';
            });
        }

        // Handle assign ticket buttons
        document.querySelectorAll('.assign-ticket').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const ticketId = e.currentTarget.getAttribute('data-ticket-id');
                this.showAssignTicketModal(ticketId);
            });
        });

        // Handle update status buttons
        document.querySelectorAll('.update-status').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const ticketId = e.currentTarget.getAttribute('data-ticket-id');
                const newStatus = e.currentTarget.getAttribute('data-status');
                await this.updateTicketStatus(ticketId, newStatus);
            });
        });

        // Handle role switching
        const roleLinks = document.querySelectorAll('#role-options .dropdown-item');
        roleLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const role = e.currentTarget.getAttribute('data-role');
                this.auth.switchRole(role);
                // Update the UI to reflect the new role
                document.getElementById('current-role').textContent = role.charAt(0).toUpperCase() + role.slice(1);
                // Reload the current view with the new role
                this.navigateTo(this.currentRoute?.path || 'dashboard', false);
            });
        });

        // View-specific event listeners
        switch(viewName) {
            case 'dashboard':
                this.attachDashboardListeners();
                break;
            case 'raise-ticket':
                this.attachRaiseTicketListeners();
                break;
            case 'profile':
                this.attachProfileListeners();
                break;
            case 'notifications':
                this.attachNotificationListeners();
                break;
        }
    }

    async handleTicketSubmission() {
        // In a real app, this would be an API call
        const ticketData = {
            id: 'T' + Math.floor(1000 + Math.random() * 9000),
            title: document.getElementById('ticketTitle').value,
            category: document.getElementById('ticketCategory').value,
            priority: document.getElementById('ticketPriority').value,
            description: document.getElementById('ticketDescription').value,
            location: document.getElementById('ticketLocation').value,
            status: 'Not Assigned',
            createdAt: new Date().toISOString(),
            createdBy: this.auth.getCurrentUser().id
        };

        // Show loading state
        const submitBtn = document.getElementById('submitTicket');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Save to local storage (in a real app, this would be an API call)
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            tickets.push(ticketData);
            localStorage.setItem('tickets', JSON.stringify(tickets));

            // Show success message
            alert('Ticket submitted successfully!');
            
            // Close modal if it's open
            const modal = bootstrap.Modal.getInstance(document.getElementById('createTicketModal'));
            if (modal) modal.hide();
            
            // Redirect to tickets list
            this.navigateTo('my-tickets');
        } catch (error) {
            console.error('Error submitting ticket:', error);
            alert('Failed to submit ticket. Please try again.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    async showAssignTicketModal(ticketId) {
        // In a real app, we would fetch staff members from an API
        const staffMembers = [
            { id: 1, name: 'John Doe', role: 'Electrician' },
            { id: 2, name: 'Jane Smith', role: 'Plumber' },
            { id: 3, name: 'Mike Johnson', role: 'HVAC Technician' },
            { id: 4, name: 'Sarah Williams', role: 'Carpenter' },
            { id: 5, name: 'David Brown', role: 'General Maintenance' }
        ];

        // Populate staff dropdown
        const staffSelect = document.getElementById('staffSelect');
        staffSelect.innerHTML = staffMembers.map(staff => 
            `<option value="${staff.id}">${staff.name} (${staff.role})</option>`
        ).join('');

        // Set ticket ID in hidden field
        document.getElementById('ticketIdToAssign').value = ticketId;

        // Set default due date to 3 days from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);
        document.getElementById('dueDate').valueAsDate = dueDate;

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('assignTicketModal'));
        modal.show();

        // Handle assign button click
        document.getElementById('confirmAssign').onclick = async () => {
            const staffId = staffSelect.value;
            const dueDate = document.getElementById('dueDate').value;
            const notes = document.getElementById('assignNotes').value;
            
            // In a real app, this would be an API call
            console.log(`Assigning ticket ${ticketId} to staff ${staffId} with due date ${dueDate}`);
            
            // Show success message
            alert('Ticket assigned successfully!');
            
            // Close the modal
            modal.hide();
            
            // Refresh the view
            this.navigateTo('all-tickets');
        };
    }

    async updateTicketStatus(ticketId, newStatus) {
        // In a real app, this would be an API call
        console.log(`Updating ticket ${ticketId} status to ${newStatus}`);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Show success message
        alert(`Ticket ${ticketId} marked as ${newStatus.replace('-', ' ')}`);
        
        // Refresh the view
        this.navigateTo(window.location.hash.replace('#', ''), false);
    }

    // Additional view-specific event listener methods
    attachDashboardListeners() {
        // Initialize charts or other dashboard-specific functionality
        this.initializeDashboardCharts();
    }

    attachRaiseTicketListeners() {
        // Add any raise ticket specific event listeners
    }

    attachProfileListeners() {
        // Add profile specific event listeners
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn && this.ui) {
            editProfileBtn.addEventListener('click', () => {
                this.ui.openEditProfileModal();
            });
        }
    }

    attachNotificationListeners() {
        // Add notification specific event listeners
        const markAllReadBtn = document.getElementById('mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                alert('Mark all as read functionality would be implemented here');
            });
        }

        const clearNotificationsBtn = document.getElementById('clear-notifications');
        if (clearNotificationsBtn) {
            clearNotificationsBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all notifications?')) {
                    // In a real app, this would clear notifications
                    alert('All notifications cleared');
                }
            });
        }
    }

    // Initialize charts for the dashboard
    initializeDashboardCharts() {
        // This would initialize charts using Chart.js or similar library
        // For now, we'll just log to the console
        console.log('Initializing dashboard charts...');
        
        // In a real app, you would use Chart.js like this:
        /*
        const ctx = document.getElementById('ticketsByCategoryChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Electrical', 'Plumbing', 'HVAC', 'Carpentry', 'Other'],
                datasets: [{
                    label: 'Tickets by Category',
                    data: [12, 19, 3, 5, 2],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        */
    }
}
