export class DataService {
    constructor(auth) {
        this.auth = auth;
        this.initializeSampleData();
    }

    initializeSampleData() {
        // Initialize sample data if it doesn't exist
        if (!localStorage.getItem('tickets')) {
            const sampleTickets = this.generateSampleTickets();
            localStorage.setItem('tickets', JSON.stringify(sampleTickets));
        }

        if (!localStorage.getItem('users')) {
            const sampleUsers = this.generateSampleUsers();
            localStorage.setItem('users', JSON.stringify(sampleUsers));
        }

        if (!localStorage.getItem('notifications')) {
            const sampleNotifications = this.generateSampleNotifications();
            localStorage.setItem('notifications', JSON.stringify(sampleNotifications));
        }
    }

    // Ticket-related methods
    async getTickets(filters = {}) {
        try {
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            return this.filterTickets(tickets, filters);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            return [];
        }
    }

    async getUserTickets(type = 'my') {
        try {
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            const currentUser = this.auth.getCurrentUser();
            
            if (type === 'my') {
                // Return tickets created by the current user
                return tickets.filter(t => t.createdBy === currentUser.id);
            } else if (type === 'assigned') {
                // Return tickets assigned to the current user
                return tickets.filter(t => t.assignedTo === currentUser.id);
            }
            
            return tickets;
        } catch (error) {
            console.error('Error fetching user tickets:', error);
            return [];
        }
    }

    async getAllTickets(filters = {}) {
        try {
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            return this.filterTickets(tickets, filters);
        } catch (error) {
            console.error('Error fetching all tickets:', error);
            return [];
        }
    }

    async getTicketById(id) {
        try {
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            return tickets.find(ticket => ticket.id === id) || null;
        } catch (error) {
            console.error('Error fetching ticket:', error);
            return null;
        }
    }

    async createTicket(ticketData) {
        try {
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            const newTicket = {
                id: `T${Date.now()}`,
                status: 'Not Assigned',
                createdAt: new Date().toISOString(),
                createdBy: this.auth.getCurrentUser().id,
                ...ticketData
            };
            
            tickets.push(newTicket);
            localStorage.setItem('tickets', JSON.stringify(tickets));
            
            // Create a notification
            await this.createNotification({
                type: 'ticket_created',
                title: 'New Ticket Created',
                message: `Ticket #${newTicket.id}: ${newTicket.title}`,
                userId: this.auth.getCurrentUser().id,
                relatedId: newTicket.id,
                read: false
            });
            
            return newTicket;
        } catch (error) {
            console.error('Error creating ticket:', error);
            throw error;
        }
    }

    async updateTicket(id, updates) {
        try {
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            const index = tickets.findIndex(t => t.id === id);
            
            if (index === -1) {
                throw new Error('Ticket not found');
            }
            
            const updatedTicket = {
                ...tickets[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            tickets[index] = updatedTicket;
            localStorage.setItem('tickets', JSON.stringify(tickets));
            
            // Create a notification if status changed
            if (updates.status && updates.status !== tickets[index].status) {
                await this.createNotification({
                    type: 'ticket_updated',
                    title: `Ticket ${updates.status}`,
                    message: `Ticket #${id} has been marked as ${updates.status}`,
                    userId: this.auth.getCurrentUser().id,
                    relatedId: id,
                    read: false
                });
            }
            
            return updatedTicket;
        } catch (error) {
            console.error('Error updating ticket:', error);
            throw error;
        }
    }

    // User-related methods
    async getUsers(filters = {}) {
        try {
            let users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Apply filters
            if (filters.role) {
                users = users.filter(user => user.role === filters.role);
            }
            
            if (filters.department) {
                users = users.filter(user => user.department === filters.department);
            }
            
            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }

    async getUserById(id) {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            return users.find(user => user.id === id) || null;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }

    // Notification-related methods
    async getNotifications(filters = {}) {
        try {
            let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
            
            // Filter by user ID if provided
            if (filters.userId) {
                notifications = notifications.filter(n => n.userId === filters.userId);
            }
            
            // Filter by read status if provided
            if (filters.read !== undefined) {
                notifications = notifications.filter(n => n.read === filters.read);
            }
            
            // Sort by date (newest first)
            notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Apply limit if provided
            if (filters.limit) {
                notifications = notifications.slice(0, filters.limit);
            }
            
            return notifications;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    }

    async createNotification(notificationData) {
        try {
            const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
            const newNotification = {
                id: `N${Date.now()}`,
                createdAt: new Date().toISOString(),
                read: false,
                ...notificationData
            };
            
            notifications.unshift(newNotification);
            localStorage.setItem('notifications', JSON.stringify(notifications));
            
            return newNotification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
            const index = notifications.findIndex(n => n.id === notificationId);
            
            if (index !== -1) {
                notifications[index] = {
                    ...notifications[index],
                    read: true,
                    readAt: new Date().toISOString()
                };
                
                localStorage.setItem('notifications', JSON.stringify(notifications));
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    // Dashboard statistics
    async getDashboardStats() {
        try {
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            const stats = {
                totalTickets: tickets.length,
                openTickets: tickets.filter(t => t.status === 'Not Assigned').length,
                inProgressTickets: tickets.filter(t => t.status === 'in-progress').length,
                completedTickets: tickets.filter(t => t.status === 'completed').length,
                activeStaff: users.filter(u => u.role === 'staff' && u.status === 'active').length,
                resolutionRate: tickets.length > 0 
                    ? Math.round((tickets.filter(t => t.status === 'completed').length / tickets.length) * 100) 
                    : 0,
                averageResponseTime: this.calculateAverageResponseTime(tickets),
                recentActivity: []
            };
            
            return stats;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return {};
        }
    }

    // Helper methods
    filterTickets(tickets, filters) {
        let filteredTickets = [...tickets];
        
        if (filters.status) {
            filteredTickets = filteredTickets.filter(ticket => ticket.status === filters.status);
        }
        
        if (filters.priority) {
            filteredTickets = filteredTickets.filter(ticket => ticket.priority === filters.priority);
        }
        
        if (filters.category) {
            filteredTickets = filteredTickets.filter(ticket => ticket.category === filters.category);
        }
        
        if (filters.assignedTo) {
            filteredTickets = filteredTickets.filter(ticket => ticket.assignedTo === filters.assignedTo);
        }
        
        if (filters.createdBy) {
            filteredTickets = filteredTickets.filter(ticket => ticket.createdBy === filters.createdBy);
        }
        
        // Sort by date (newest first)
        filteredTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Apply limit if provided
        if (filters.limit) {
            filteredTickets = filteredTickets.slice(0, filters.limit);
        }
        
        return filteredTickets;
    }

    calculateAverageResponseTime(tickets) {
        const completedTickets = tickets.filter(t => t.status === 'completed' && t.completedAt && t.createdAt);
        
        if (completedTickets.length === 0) return 'N/A';
        
        const totalResponseTime = completedTickets.reduce((total, ticket) => {
            const createdAt = new Date(ticket.createdAt);
            const completedAt = new Date(ticket.completedAt);
            return total + (completedAt - createdAt);
        }, 0);
        
        const avgResponseTimeMs = totalResponseTime / completedTickets.length;
        const avgResponseTimeHours = avgResponseTimeMs / (1000 * 60 * 60);
        
        return avgResponseTimeHours.toFixed(1);
    }

    // Sample data generation
    generateSampleTickets() {
        const categories = ['Electrical', 'Plumbing', 'HVAC', 'Carpentry', 'Cleaning', 'Other'];
        const priorities = ['low', 'medium', 'high', 'critical'];
        const statuses = ['Not Assigned', 'in-progress', 'completed'];
        const locations = ['Main Building', 'Science Wing', 'Library', 'Dormitory A', 'Dormitory B', 'Cafeteria'];
        const userIds = ['U1001', 'U1002', 'U1003', 'E2001', 'E2002', 'A3001'];
        
        const tickets = [];
        const now = new Date();
        
        for (let i = 1; i <= 20; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const priority = priorities[Math.floor(Math.random() * priorities.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const createdAt = new Date(now - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
            const updatedAt = new Date(createdAt.getTime() + Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000);
            const completedAt = status === 'completed' 
                ? new Date(updatedAt.getTime() + Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000)
                : null;
            
            tickets.push({
                id: `T${1000 + i}`,
                title: `Issue with ${category.toLowerCase()} in ${locations[Math.floor(Math.random() * locations.length)]}`,
                description: `This is a sample description for ticket #${1000 + i}. The issue needs to be addressed as soon as possible.`,
                category,
                priority,
                status,
                location: locations[Math.floor(Math.random() * locations.length)],
                createdBy: userIds[Math.floor(Math.random() * userIds.length)],
                assignedTo: status !== 'Not Assigned' ? 'E200' + (Math.floor(Math.random() * 2) + 1) : null,
                createdAt: createdAt.toISOString(),
                updatedAt: updatedAt.toISOString(),
                completedAt: completedAt ? completedAt.toISOString() : null
            });
        }
        
        return tickets;
    }

    generateSampleUsers() {
        return [
            {
                id: 'U1001',
                name: 'Alex Johnson',
                email: 'alex.johnson@example.com',
                role: 'student',
                department: 'Computer Science',
                idNumber: 'S12345678',
                phone: '+1 (555) 123-4567',
                joinDate: '2023-09-01',
                status: 'active',
                avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=random'
            },
            {
                id: 'U1002',
                name: 'Maria Garcia',
                email: 'maria.garcia@example.com',
                role: 'student',
                department: 'Engineering',
                idNumber: 'S23456789',
                phone: '+1 (555) 234-5678',
                joinDate: '2023-09-01',
                status: 'active',
                avatar: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=random'
            },
            {
                id: 'U1003',
                name: 'James Wilson',
                email: 'james.wilson@example.com',
                role: 'student',
                department: 'Business',
                idNumber: 'S34567890',
                phone: '+1 (555) 345-6789',
                joinDate: '2023-09-01',
                status: 'active',
                avatar: 'https://ui-avatars.com/api/?name=James+Wilson&background=random'
            },
            {
                id: 'E2001',
                name: 'Sarah Wilson',
                email: 'sarah.wilson@example.com',
                role: 'staff',
                department: 'Facilities',
                position: 'Maintenance Technician',
                phone: '+1 (555) 987-6543',
                joinDate: '2022-01-15',
                status: 'active',
                skills: ['Electrical', 'Plumbing'],
                avatar: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=random'
            },
            {
                id: 'E2002',
                name: 'Robert Brown',
                email: 'robert.brown@example.com',
                role: 'staff',
                department: 'Facilities',
                position: 'HVAC Specialist',
                phone: '+1 (555) 876-5432',
                joinDate: '2021-11-20',
                status: 'active',
                skills: ['HVAC', 'Electrical'],
                avatar: 'https://ui-avatars.com/api/?name=Robert+Brown&background=random'
            },
            {
                id: 'A3001',
                name: 'Admin User',
                email: 'admin@campus.edu',
                role: 'admin',
                department: 'Administration',
                position: 'System Administrator',
                phone: '+1 (555) 555-1234',
                joinDate: '2020-05-10',
                status: 'active',
                avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=random'
            }
        ];
    }

    generateSampleNotifications() {
        const now = new Date();
        return [
            {
                id: 'N1001',
                type: 'ticket_assigned',
                title: 'New Ticket Assigned',
                message: 'You have been assigned to ticket #T1001',
                userId: 'E2001',
                relatedId: 'T1001',
                read: false,
                createdAt: new Date(now - 3600000).toISOString() // 1 hour ago
            },
            {
                id: 'N1002',
                type: 'ticket_updated',
                title: 'Ticket Status Updated',
                message: 'Ticket #T1002 has been marked as in-progress',
                userId: 'U1001',
                relatedId: 'T1002',
                read: false,
                createdAt: new Date(now - 86400000).toISOString() // 1 day ago
            },
            {
                id: 'N1003',
                type: 'announcement',
                title: 'System Maintenance',
                message: 'Scheduled maintenance this weekend',
                userId: 'A3001',
                relatedId: null,
                read: true,
                createdAt: new Date(now - 172800000).toISOString() // 2 days ago
            }
        ];
    }
}
