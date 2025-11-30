export class Router {
    constructor(auth, dataService) {
        this.auth = auth;
        this.dataService = dataService;
        this.currentRoute = 'dashboard';
        this.routes = {};
    }

    initialize() {
        this.defineRoutes();
        window.addEventListener('hashchange', () => this.handleRouteChange());
        this.handleRouteChange();
    }

    defineRoutes() {
        const role = this.auth.getCurrentRole();
        
        this.routes = {
            student: {
                dashboard: () => this.getDashboardView(),
                'raise-ticket': () => this.getRaiseTicketView(),
                'my-tickets': () => this.getMyTicketsView(),
                notifications: () => this.getNotificationsView(),
                profile: () => this.getProfileView()
            },
            staff: {
                dashboard: () => this.getDashboardView(),
                'assigned-tickets': () => this.getAssignedTicketsView(),
                notifications: () => this.getNotificationsView(),
                profile: () => this.getProfileView()
            },
            admin: {
                dashboard: () => this.getDashboardView(),
                'all-tickets': () => this.getAllTicketsView(),
                'assign-tickets': () => this.getAssignTicketsView(),
                'manage-staff': () => this.getManageStaffView(),
                notifications: () => this.getNotificationsView(),
                profile: () => this.getProfileView()
            },
        };
    }

    handleRouteChange() {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        const role = this.auth.getCurrentRole();
        const roleRoutes = this.routes[role] || {};

        if (roleRoutes[hash]) {
            this.currentRoute = hash;
            document.getElementById('page-title').textContent = this.getTitleForRoute(hash);
            const content = roleRoutes[hash]();
            document.getElementById('main-content').innerHTML = content;
            this.attachEventListeners();
        } else {
            window.location.hash = '#dashboard';
        }
    }

    getTitleForRoute(route) {
        const titles = {
            dashboard: 'Dashboard',
            'raise-ticket': 'Raise Ticket',
            'my-tickets': 'My Tickets',
            'assigned-tickets': 'Assigned Tickets',
            'my-works': 'My Works',
            'all-tickets': 'All Tickets',
            'assign-tickets': 'Assign Tickets',
            'manage-staff': 'Manage Staff',
            notifications: 'Notifications',
            profile: 'Profile'
        };
        return titles[route] || 'Dashboard';
    }

    navigateTo(route) {
        window.location.hash = `#${route}`;
    }

    getDashboardView() {
        // Use dataService to compute stats and recent tickets
        const stats = this.dataService.getTicketStats();
        const role = this.auth.getCurrentRole();
        const recent = (this.dataService.getAllTickets() || []).slice(0, 6);

        const recentRows = recent.map(t => `
            <tr>
                <td>${t.id}</td>
                <td>${t.title}</td>
                <td><span class="badge badge-${(t.status || 'info').toLowerCase().replace(/ /g, '-')}">${t.status}</span></td>
                <td><span class="badge badge-${(t.priority || 'low').toLowerCase()}">${t.priority}</span></td>
                <td>${new Date(t.createdAt).toLocaleDateString()}</td>
            </tr>
        `).join('') || `
            <tr><td colspan="5" class="text-center text-muted">No recent tickets</td></tr>
        `;

        // Only include Quick Stats for admins
        const quickStatsHtml = (role === 'admin') ? `
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Quick Stats</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Resolution Rate</span>
                                    <span class="fw-600">${Math.round((stats.completed / Math.max(1, stats.total)) * 100)}%</span>
                                </div>
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar bg-success" style="width: ${Math.min(100, Math.round((stats.completed / Math.max(1, stats.total)) * 100))}%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Avg. Response Time</span>
                                    <span class="fw-600">2.5 hrs</span>
                                </div>
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar bg-primary" style="width: 60%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>` : '';

        return `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon bg-primary">
                            <i class="fas fa-ticket-alt"></i>
                        </div>
                        <div class="stat-content">
                            <h6 class="text-muted">Total Tickets</h6>
                            <h3 id="stat-total">${stats.total}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon bg-success">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h6 class="text-muted">Completed</h6>
                            <h3 id="stat-completed">${stats.completed}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon bg-warning">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <h6 class="text-muted">In Progress</h6>
                            <h3 id="stat-inprogress">${stats.inProgress}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon bg-danger">
                            <i class="fas fa-exclamation-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h6 class="text-muted">Pending</h6>
                            <h3 id="stat-pending" data-status="pending">${stats.pending}</h3>
                        </div>
                    </div>
                </div>
            
            </div>

            <div class="row">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Recent Tickets</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Title</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${recentRows}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                ${quickStatsHtml}
            </div>
        `;
    }

    getRaiseTicketView() {
        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0"><i class="fas fa-plus-circle me-2 text-primary"></i>Raise New Ticket</h5>
                </div>
                <div class="card-body">
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#raiseTicketModal">
                        <i class="fas fa-plus me-2"></i>Create New Ticket
                    </button>
                </div>
            </div>
        `;
    }

    getMyTicketsView() {
        // Render the tickets created by the current user
        const user = this.auth.getCurrentUser();
        let tickets = this.dataService.getUserTickets(user?.id);
        let appliedFilter = null;
        if (this.filterStatus) {
            appliedFilter = this.filterStatus;
            if (this.filterStatus.toLowerCase() === 'pending') {
                tickets = (tickets || []).filter(t => t.status === 'New' || t.status === 'Pending');
            } else {
                tickets = (tickets || []).filter(t => t.status === this.filterStatus);
            }
            this.filterStatus = null;
        }

        const rows = (tickets || []).map(t => {
            const createdAt = new Date(t.createdAt).toLocaleDateString();
            return `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.title}</td>
                    <td><span class="badge badge-${(t.status || 'info').toLowerCase().replace(/ /g, '-')}">${t.status}</span></td>
                    <td><span class="badge badge-${(t.priority || 'low').toLowerCase()}">${t.priority}</span></td>
                    <td>${createdAt}</td>
                </tr>
            `;
        }).join('') || `
            <tr>
                <td colspan="5" class="text-center text-muted">No tickets found</td>
            </tr>
        `;

        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">My Tickets</h5>
                    ${appliedFilter ? `<div class="filter-indicator small"><span class="badge bg-info me-2">Filter: ${appliedFilter}</span><button id="clear-filter-btn" class="btn btn-sm btn-outline-secondary">Clear</button></div>` : ''}
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    getAssignedTicketsView() {
        const user = this.auth.getCurrentUser();
        let tickets = this.dataService.getUserTickets(user?.id, 'assigned');
        let appliedFilter = null;
        if (this.filterStatus) {
            appliedFilter = this.filterStatus;
            if (this.filterStatus.toLowerCase() === 'pending') {
                tickets = (tickets || []).filter(t => t.status === 'New' || t.status === 'Pending');
            } else {
                tickets = (tickets || []).filter(t => t.status === this.filterStatus);
            }
            this.filterStatus = null;
        }

        const rowsHtml = (tickets || []).map(t => `
            <tr>
                <td>${t.id}</td>
                <td>${t.title}</td>
                <td><span class="badge badge-${(t.status || 'info').toLowerCase().replace(/ /g, '-')}">${t.status}</span></td>
                <td>${t.assignedByName || '-'}</td>
                <td>${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</td>
            </tr>
        `).join('') || '';

        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">Assigned Tickets</h5>
                    ${appliedFilter ? `<div class="filter-indicator small"><span class="badge bg-info me-2">Filter: ${appliedFilter}</span><button id="clear-filter-btn" class="btn btn-sm btn-outline-secondary">Clear</button></div>` : ''}
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Assigned By</th>
                                    <th>Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ rowsHtml || `<tr><td colspan="5" class="text-center text-muted">No assigned tickets</td></tr>` }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    getAllTicketsView() {
        let tickets = this.dataService.getAllTickets();
        let appliedFilter = null;
        if (this.filterStatus) {
            appliedFilter = this.filterStatus;
            if (this.filterStatus.toLowerCase() === 'pending') {
                tickets = (tickets || []).filter(t => t.status === 'New' || t.status === 'Pending');
            } else {
                tickets = (tickets || []).filter(t => t.status === this.filterStatus);
            }
            this.filterStatus = null;
        }

        const rows = (tickets || []).map(t => `
            <tr>
                <td>#${t.id}</td>
                <td>${t.title}</td>
                <td><span class="badge badge-${(t.status || 'info').toLowerCase().replace(/ /g, '-')}">${t.status}</span></td>
                <td>${t.priority}</td>
                <td>${t.raisedBy || 'N/A'}</td>
                <td>${new Date(t.createdAt).toLocaleDateString()}</td>
            </tr>
        `).join('') || `<tr><td colspan="6" class="text-center text-muted">No tickets found</td></tr>`;

        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">All Tickets</h5>
                    ${appliedFilter ? `<div class="filter-indicator small"><span class="badge bg-info me-2">Filter: ${appliedFilter}</span><button id="clear-filter-btn" class="btn btn-sm btn-outline-secondary">Clear</button></div>` : ''}
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Raised By</th>
                                    <th>Date Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    getMyWorksView() {
        const user = this.auth.getCurrentUser();
        // DataService returns tickets; ensure assignedTo is compared against user id
        const allAssigned = (this.dataService.getTickets() || []).filter(t => t.assignedTo === user?.id);

        const rows = (allAssigned || []).map(t => `
            <tr>
                <td>${t.id}</td>
                <td>${t.title}</td>
                <td><span class="badge badge-${(t.status || 'info').toLowerCase().replace(/ /g, '-')}">${t.status}</span></td>
                <td>${t.assignedByName || '-'}</td>
                <td>${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</td>
            </tr>
        `).join('') || `<tr><td colspan="5" class="text-center text-muted">No assigned tickets</td></tr>`;

        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Assigned Tickets</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Assigned By</th>
                                    <th>Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    getAssignTicketsView() {
        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Assign Tickets</h5>
                </div>
                <div class="card-body">
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#assignTicketModal">
                        <i class="fas fa-tasks me-2"></i>Assign Ticket
                    </button>
                </div>
            </div>
        `;
    }

    getManageStaffView() {
        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Manage Staff</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Position</th>
                                    <th>Department</th>
                                    <th>Active Tickets</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Sarah Wilson</td>
                                    <td>Maintenance Technician</td>
                                    <td>Facilities</td>
                                    <td><span class="badge badge-info">3</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    getNotificationsView() {
        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Notifications</h5>
                </div>
                <div class="card-body">
                    <div class="notification-item">
                        <div class="notification-icon bg-primary">
                            <i class="fas fa-bell"></i>
                        </div>
                        <div class="notification-content">
                            <h6>Ticket Status Updated</h6>
                            <p class="text-muted small">Your ticket #TK001 is now in progress</p>
                            <small class="text-muted">2 hours ago</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProfileView() {
        const user = this.auth.getCurrentUser();
        return `
            <div class="row">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Profile Information</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <p class="text-muted small mb-1">Full Name</p>
                                    <p class="fw-600">${user.name}</p>
                                </div>
                                <div class="col-md-6">
                                    <p class="text-muted small mb-1">Email</p>
                                    <p class="fw-600">${user.email}</p>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <p class="text-muted small mb-1">Phone</p>
                                    <p class="fw-600">${user.phone}</p>
                                </div>
                                <div class="col-md-6">
                                    <p class="text-muted small mb-1">Department</p>
                                    <p class="fw-600">${user.department}</p>
                                </div>
                            </div>
                            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#editProfileModal">
                                <i class="fas fa-edit me-2"></i>Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card text-center">
                        <div class="card-body">
                            <img src="${user.avatar}" alt="${user.name}" class="rounded-circle mb-3" width="100" height="100">
                            <h6>${user.name}</h6>
                            <p class="text-muted small">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Attach event listeners for dynamic content
        const current = this.currentRoute;
        if (current === 'dashboard') {
            const role = this.auth.getCurrentRole();

            const statTotal = document.getElementById('stat-total');
            if (statTotal) {
                statTotal.style.cursor = 'pointer';
                statTotal.addEventListener('click', () => {
                    if (role === 'admin') this.navigateTo('all-tickets');
                    else this.navigateTo(role === 'staff' ? 'assigned-tickets' : 'my-tickets');
                });
            }

            const statCompleted = document.getElementById('stat-completed');
            if (statCompleted) {
                statCompleted.style.cursor = 'pointer';
                statCompleted.addEventListener('click', () => {
                    this.filterStatus = 'Completed';
                    if (role === 'admin') this.navigateTo('all-tickets');
                    else this.navigateTo(role === 'staff' ? 'assigned-tickets' : 'my-tickets');
                });
            }

            const statInProgress = document.getElementById('stat-inprogress');
            if (statInProgress) {
                statInProgress.style.cursor = 'pointer';
                statInProgress.addEventListener('click', () => {
                    this.filterStatus = 'In Progress';
                    if (role === 'admin') this.navigateTo('all-tickets');
                    else this.navigateTo(role === 'staff' ? 'assigned-tickets' : 'my-tickets');
                });
            }

            const statPending = document.getElementById('stat-pending');
            if (statPending) {
                statPending.style.cursor = 'pointer';
                statPending.addEventListener('click', () => {
                    this.filterStatus = statPending.getAttribute('data-status') || 'pending';
                    if (role === 'admin') this.navigateTo('all-tickets');
                    else this.navigateTo(role === 'staff' ? 'assigned-tickets' : 'my-tickets');
                });
            }
        }
        // Attach clear-filter button handlers for ticket views
        if (['my-tickets', 'assigned-tickets', 'all-tickets'].includes(current)) {
            const clearBtn = document.getElementById('clear-filter-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    this.filterStatus = null;
                    // navigate to the same view to reload without filter
                    this.navigateTo(this.currentRoute);
                });
            }
        }
    }
}
