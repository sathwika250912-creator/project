export class DataService {
    constructor(auth) {
        this.auth = auth;
        this.initializeSampleData();
    }

    initializeSampleData() {
        // Initialize sample data if not exists
        if (!localStorage.getItem('tickets')) {
            const sampleTickets = [
                {
                    id: 'TK001',
                    title: 'Broken AC in Room 101',
                    description: 'Air conditioning not working properly',
                    category: 'HVAC',
                    priority: 'High',
                    location: 'Room 101',
                    status: 'In Progress',
                    createdBy: 'U1001',
                    createdAt: new Date().toISOString(),
                    assignedTo: 'E2001',
                    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'TK002',
                    title: 'Water leak in Bathroom',
                    description: 'Water dripping from ceiling in bathroom',
                    category: 'Plumbing',
                    priority: 'Critical',
                    location: 'Bathroom Floor 2',
                    status: 'Completed',
                    createdBy: 'U1001',
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    assignedTo: 'E2001',
                    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
            localStorage.setItem('tickets', JSON.stringify(sampleTickets));
        }

        if (!localStorage.getItem('users')) {
            const sampleUsers = [
                {
                    id: 'U1001',
                    name: 'Alex Johnson',
                    email: 'alex.johnson@example.com',
                    role: 'student'
                },
                {
                    id: 'E2001',
                    name: 'Sarah Wilson',
                    email: 'sarah.wilson@example.com',
                    role: 'staff'
                },
                {
                    id: 'A3001',
                    name: 'Admin User',
                    email: 'admin@campus.edu',
                    role: 'admin'
                }
            ];
            localStorage.setItem('users', JSON.stringify(sampleUsers));
        }
    }

    // Ticket operations
    createTicket(ticket) {
        const tickets = this.getTickets();
        tickets.push(ticket);
        localStorage.setItem('tickets', JSON.stringify(tickets));
        return ticket;
    }

    getTickets(filter = {}) {
        const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
        
        if (filter.status) {
            return tickets.filter(t => t.status === filter.status);
        }
        if (filter.priority) {
            return tickets.filter(t => t.priority === filter.priority);
        }
        if (filter.createdBy) {
            return tickets.filter(t => t.createdBy === filter.createdBy);
        }
        if (filter.assignedTo) {
            return tickets.filter(t => t.assignedTo === filter.assignedTo);
        }
        
        return tickets;
    }

    getTicketById(id) {
        const tickets = this.getTickets();
        return tickets.find(t => t.id === id);
    }

    updateTicket(id, updates) {
        const tickets = this.getTickets();
        const index = tickets.findIndex(t => t.id === id);
        
        if (index !== -1) {
            tickets[index] = { ...tickets[index], ...updates };
            localStorage.setItem('tickets', JSON.stringify(tickets));
            return tickets[index];
        }
        return null;
    }

    deleteTicket(id) {
        const tickets = this.getTickets();
        const filtered = tickets.filter(t => t.id !== id);
        localStorage.setItem('tickets', JSON.stringify(filtered));
        return true;
    }

    assignTicket(ticketId, assignmentData) {
        return this.updateTicket(ticketId, {
            assignedTo: assignmentData.assignedTo,
            dueDate: assignmentData.dueDate,
            priority: assignmentData.priority,
            status: 'Assigned'
        });
    }

    // User operations
    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }

    getUserById(id) {
        const users = this.getUsers();
        return users.find(u => u.id === id);
    }

    getStaffMembers() {
        const users = this.getUsers();
        return users.filter(u => u.role === 'staff');
    }

    // Statistics
    getTicketStats() {
        const tickets = this.getTickets();
        return {
            total: tickets.length,
            completed: tickets.filter(t => t.status === 'Completed').length,
            inProgress: tickets.filter(t => t.status === 'In Progress').length,
            pending: tickets.filter(t => t.status === 'Open' || t.status === 'Pending').length
        };
    }

    getUserTickets(userId, type = 'my') {
        if (type === 'my') {
            return this.getTickets({ createdBy: userId });
        } else if (type === 'assigned') {
            return this.getTickets({ assignedTo: userId });
        }
        return [];
    }

    getAllTickets() {
        return this.getTickets();
    }
}
