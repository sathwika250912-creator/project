// Tickets data - in a real app, this would come from a backend
let tickets = [];

// DOM Elements
const ticketForm = document.getElementById('ticketForm');
const ticketList = document.getElementById('ticketList');
const dashboardTickets = document.getElementById('dashboardTickets');

// Initialize the app
function initApp() {
    loadTickets();
    setupEventListeners();
    updateDashboard();
}

// Load tickets from localStorage
function loadTickets() {
    const savedTickets = localStorage.getItem('tickets');
    if (savedTickets) {
        tickets = JSON.parse(savedTickets);
    }
}

// Save tickets to localStorage
function saveTickets() {
    localStorage.setItem('tickets', JSON.stringify(tickets));
}

// Setup event listeners
function setupEventListeners() {
    if (ticketForm) {
        ticketForm.addEventListener('submit', handleTicketSubmit);
    }
}

// Handle ticket submission
function handleTicketSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(ticketForm);
    const newTicket = {
        id: Date.now().toString(),
        title: formData.get('title'),
        category: formData.get('category'),
        priority: formData.get('priority'),
        status: 'Open',
        date: new Date().toISOString(),
        createdBy: 'Current User' // In a real app, this would be the logged-in user
    };
    
    // Add to tickets array
    tickets.unshift(newTicket);
    
    // Save to localStorage
    saveTickets();
    
    // Update UI
    if (ticketList) {
        renderTickets();
    }
    
    // Update dashboard
    updateDashboard();
    
    // Reset form
    ticketForm.reset();
    
    // Show success message
    alert('Ticket raised successfully!');
    
    // In a real app, you might want to redirect or show a success message
    window.location.href = 'mytickets.html';
}

// Render tickets in the mytickets page
function renderTickets() {
    if (!ticketList) return;
    
    if (tickets.length === 0) {
        ticketList.innerHTML = '<div class="alert alert-info">No tickets found.</div>';
        return;
    }
    
    ticketList.innerHTML = tickets.map(ticket => `
        <div class="ticket-card" data-id="${ticket.id}">
            <div class="ticket-header">
                <h5>${ticket.title}</h5>
                <span class="badge bg-${getPriorityBadgeClass(ticket.priority)}">${ticket.priority}</span>
                <span class="badge bg-${getStatusBadgeClass(ticket.status)}">${ticket.status}</span>
            </div>
                <div class="ticket-body">
                <div class="ticket-meta">
                    <span><i class="fas fa-tag"></i> ${ticket.category}</span>
                    <span><i class="far fa-calendar"></i> ${formatDate(ticket.date)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Update dashboard with ticket stats
function updateDashboard() {
    if (!dashboardTickets) return;
    
    const openTickets = tickets.filter(t => t.status === 'Open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;
    
    dashboardTickets.innerHTML = `
        <div class="col-md-4">
            <div class="card bg-primary text-white mb-4">
                <div class="card-body">
                    <h2>${tickets.length}</h2>
                    <p>Total Tickets</p>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card bg-warning text-white mb-4">
                <div class="card-body">
                    <h2>${openTickets}</h2>
                    <p>Open</p>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card bg-success text-white mb-4">
                <div class="card-body">
                    <h2>${resolvedTickets}</h2>
                    <p>Resolved</p>
                </div>
            </div>
        </div>
    `;
}

// Helper functions
function getPriorityBadgeClass(priority) {
    const classes = {
        'Low': 'info',
        'Medium': 'warning',
        'High': 'danger'
    };
    return classes[priority] || 'secondary';
}

function getStatusBadgeClass(status) {
    const classes = {
        'Open': 'primary',
        'In Progress': 'warning',
        'Resolved': 'success',
        'Closed': 'secondary'
    };
    return classes[status] || 'secondary';
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
