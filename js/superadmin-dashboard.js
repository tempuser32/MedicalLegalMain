document.addEventListener('DOMContentLoaded', function() {
    // Load registered users
    loadRegisteredUsers();
    
    // Load recent document requests
    loadRecentDocumentRequests();
    
    // Load audit logs
    loadAuditLogs();
    
    // Remove reports and analytics section
    removeReportsAndAnalytics();
    
    // Remove manage hospitals section
    removeManageHospitals();
});

function loadRegisteredUsers() {
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Sort users by registration date (newest first)
    users.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
    });
    
    // Get the recent users table body
    const userTableBody = document.querySelector('.admin-section:nth-child(3) .admin-table tbody');
    if (!userTableBody) return;
    
    // Clear existing rows
    userTableBody.innerHTML = '';
    
    // Take only the first 5 users
    const recentUsers = users.slice(0, 5);
    
    // Update total users count
    document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = users.length;
    
    if (recentUsers.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6">No registered users found</td>';
        userTableBody.appendChild(row);
        return;
    }
    
    // Add users to the table
    recentUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // Format date
        const registrationDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Unknown';
        
        // Determine status
        let statusClass = 'pending';
        let statusText = 'Pending';
        
        if (user.approvalStatus === 'approved') {
            statusClass = 'active';
            statusText = 'Active';
        } else if (user.approvalStatus === 'rejected') {
            statusClass = 'inactive';
            statusText = 'Rejected';
        }
        
        row.innerHTML = `
            <td>${user.name || 'Unknown'}</td>
            <td>${user.userType || 'Unknown'}</td>
            <td>${user.email || 'Unknown'}</td>
            <td>${registrationDate}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" data-user-id="${user.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete-btn" data-user-id="${user.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        
        userTableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            alert(`Edit user with ID: ${userId}`);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            if (confirm(`Are you sure you want to delete user with ID: ${userId}?`)) {
                // Delete user logic
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const updatedUsers = users.filter(user => user.id !== userId);
                localStorage.setItem('users', JSON.stringify(updatedUsers));
                
                // Reload the page
                location.reload();
            }
        });
    });
}

function loadRecentDocumentRequests() {
    // Get access requests from localStorage
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Sort requests by date (newest first)
    accessRequests.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB - dateA;
    });
    
    // Get the recent requests table body
    const requestTableBody = document.querySelector('.admin-section:nth-child(4) .admin-table tbody');
    if (!requestTableBody) return;
    
    // Clear existing rows
    requestTableBody.innerHTML = '';
    
    // Take only the first 5 requests
    const recentRequests = accessRequests.slice(0, 5);
    
    // Update total requests count
    document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = accessRequests.length;
    
    if (recentRequests.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6">No document requests found</td>';
        requestTableBody.appendChild(row);
        return;
    }
    
    // Add requests to the table
    recentRequests.forEach(request => {
        const row = document.createElement('tr');
        
        // Format date
        const requestDate = request.timestamp ? new Date(request.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Unknown';
        
        // Determine status
        let statusClass = 'pending';
        let statusText = 'Pending';
        
        if (request.status === 'approved') {
            statusClass = 'active';
            statusText = 'Approved';
        } else if (request.status === 'rejected') {
            statusClass = 'inactive';
            statusText = 'Rejected';
        }
        
        row.innerHTML = `
            <td>${request.id || 'Unknown'}</td>
            <td>${request.legalProfessionalName || 'Unknown'}</td>
            <td>${request.patientName || 'Unknown'}</td>
            <td>${request.hospital || 'Unknown'}</td>
            <td>${requestDate}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        `;
        
        requestTableBody.appendChild(row);
    });
}

function loadAuditLogs() {
    // Create a new section for audit logs
    const mainContent = document.querySelector('.main-content');
    const auditSection = document.createElement('div');
    auditSection.className = 'admin-section';
    
    // Create audit logs from access requests and user activities
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    const patientActivities = JSON.parse(localStorage.getItem('patientActivities') || '[]');
    
    // Combine and sort by timestamp
    const auditLogs = [
        ...accessRequests.map(req => ({
            id: req.id,
            type: 'Access Request',
            user: req.legalProfessionalName,
            action: `Requested access to ${req.patientName}'s records`,
            timestamp: req.timestamp
        })),
        ...patientActivities.map(act => ({
            id: act.id,
            type: 'Patient Activity',
            user: act.patientName,
            action: act.description,
            timestamp: act.timestamp
        }))
    ];
    
    // Sort by timestamp (newest first)
    auditLogs.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB - dateA;
    });
    
    // Create the section HTML
    auditSection.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">Audit Logs</h2>
            <a href="admin-logs.html" class="section-action">
                View All <i class="fas fa-arrow-right"></i>
            </a>
        </div>
        
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Log ID</th>
                    <th>Type</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Date & Time</th>
                </tr>
            </thead>
            <tbody>
                ${auditLogs.slice(0, 5).map(log => {
                    const logDate = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown';
                    return `
                        <tr>
                            <td>${log.id || 'Unknown'}</td>
                            <td>${log.type || 'Unknown'}</td>
                            <td>${log.user || 'Unknown'}</td>
                            <td>${log.action || 'Unknown'}</td>
                            <td>${logDate}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    // Append to main content
    mainContent.appendChild(auditSection);
}

function removeReportsAndAnalytics() {
    // Remove reports and analytics from sidebar
    const reportsLink = document.querySelector('.sidebar ul li a[href="admin-reports.html"]');
    if (reportsLink) {
        reportsLink.parentElement.remove();
    }
    
    // Remove reports card from stats
    const reportsCard = document.querySelector('.stat-card:nth-child(4)');
    if (reportsCard) {
        reportsCard.remove();
    }
    
    // Remove reports action card
    const reportsActionCard = document.querySelector('.action-card:nth-child(3)');
    if (reportsActionCard) {
        reportsActionCard.remove();
    }
}

function removeManageHospitals() {
    // Remove manage hospitals from sidebar
    const hospitalsLink = document.querySelector('.sidebar ul li a[href="admin-hospitals.html"]');
    if (hospitalsLink) {
        hospitalsLink.parentElement.remove();
    }
    
    // Remove hospitals card from stats
    const hospitalsCard = document.querySelector('.stat-card:nth-child(2)');
    if (hospitalsCard) {
        hospitalsCard.remove();
    }
    
    // Remove add hospital action card
    const hospitalActionCard = document.querySelector('.action-card:nth-child(2)');
    if (hospitalActionCard) {
        hospitalActionCard.remove();
    }
}