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
    
    // Filter admin users
    const adminUsers = users.filter(user => user.userType === 'admin');
    const otherUsers = users.filter(user => user.userType !== 'admin');
    
    // Combine with admin users first
    const sortedUsers = [...adminUsers, ...otherUsers];
    
    // Take only the first 5 users
    const recentUsers = sortedUsers.slice(0, 5);
    
    // Update total users count
    const userCountElement = document.querySelector('.stat-card:nth-child(1) .stat-value');
    if (userCountElement) {
        userCountElement.textContent = users.length;
    }
    
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
        
        if (user.approvalStatus === 'approved' || user.approved === true) {
            statusClass = 'active';
            statusText = 'Active';
        } else if (user.approvalStatus === 'rejected') {
            statusClass = 'inactive';
            statusText = 'Rejected';
        }
        
        // Check if account is locked
        if (user.accountLocked) {
            statusClass = 'inactive';
            statusText = 'Locked';
        }
        
        // Highlight admin users
        const isAdmin = user.userType === 'admin';
        const isSuperAdmin = user.isSuperAdmin === true;
        const userTypeDisplay = isAdmin ? 
            (isSuperAdmin ? '<strong style="color:#fbbf24">Super Admin</strong>' : '<strong>Admin</strong>') : 
            user.userType || 'Unknown';
        
        row.innerHTML = `
            <td>${user.name || 'Unknown'}</td>
            <td>${userTypeDisplay}</td>
            <td>${user.email || 'Unknown'}</td>
            <td>${registrationDate}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" data-user-id="${user.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${!isSuperAdmin ? `
                    <button class="action-btn delete-btn" data-user-id="${user.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        userTableBody.appendChild(row);
        
        // Add click event to show user details
        row.style.cursor = 'pointer';
        row.addEventListener('click', (e) => {
            // Don't show details if clicking on buttons
            if (e.target.closest('.action-buttons')) return;
            showUserDetails(user);
        });
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const userId = this.getAttribute('data-user-id');
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.id === userId);
            if (user) {
                showEditUserModal(user);
            }
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
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

function showUserDetails(user) {
    // Create modal for user details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.style.position = 'fixed';
    modal.style.zIndex = '1000';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.overflow = 'auto';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    
    // Format date
    const registrationDate = user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown';
    
    // Determine status
    let statusClass = 'pending';
    let statusText = 'Pending';
    
    if (user.approvalStatus === 'approved' || user.approved === true) {
        statusClass = 'active';
        statusText = 'Active';
    } else if (user.approvalStatus === 'rejected') {
        statusClass = 'inactive';
        statusText = 'Rejected';
    }
    
    // Check if account is locked
    if (user.accountLocked) {
        statusClass = 'inactive';
        statusText = 'Locked';
    }
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#1e293b';
    modalContent.style.margin = '10% auto';
    modalContent.style.padding = '20px';
    modalContent.style.border = '1px solid rgba(148, 163, 184, 0.2)';
    modalContent.style.borderRadius = '15px';
    modalContent.style.width = '60%';
    modalContent.style.color = 'white';
    
    modalContent.innerHTML = `
        <span class="close" style="color: white; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
        <h2>User Details</h2>
        <div style="margin-top: 20px;">
            <p><strong>ID:</strong> ${user.id || 'Unknown'}</p>
            <p><strong>Name:</strong> ${user.name || 'Unknown'}</p>
            <p><strong>User Type:</strong> ${user.userType || 'Unknown'} ${user.isSuperAdmin ? '(Super Admin)' : ''}</p>
            <p><strong>Email:</strong> ${user.email || 'Unknown'}</p>
            <p><strong>Phone:</strong> ${user.phone || 'Unknown'}</p>
            <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
            <p><strong>Registered On:</strong> ${registrationDate}</p>
            <p><strong>Failed Login Attempts:</strong> ${user.failedAttempts || 0}</p>
            <p><strong>Account Locked:</strong> ${user.accountLocked ? 'Yes' : 'No'}</p>
            ${user.lockTime ? `<p><strong>Locked Since:</strong> ${new Date(user.lockTime).toLocaleString()}</p>` : ''}
        </div>
        <div style="margin-top: 20px; text-align: right;">
            <button id="unlock-account-btn" style="padding: 8px 16px; background-color: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; display: ${user.accountLocked ? 'inline-block' : 'none'}">Unlock Account</button>
            <button id="reset-password-btn" style="padding: 8px 16px; background-color: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">Reset Password</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking on X
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Add unlock account functionality
    const unlockBtn = modal.querySelector('#unlock-account-btn');
    if (unlockBtn) {
        unlockBtn.addEventListener('click', () => {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === user.id);
            
            if (userIndex !== -1) {
                users[userIndex].accountLocked = false;
                users[userIndex].failedAttempts = 0;
                delete users[userIndex].lockTime;
                
                localStorage.setItem('users', JSON.stringify(users));
                alert(`Account for ${user.name} has been unlocked.`);
                document.body.removeChild(modal);
                location.reload();
            }
        });
    }
    
    // Add reset password functionality
    const resetPasswordBtn = modal.querySelector('#reset-password-btn');
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', () => {
            const newPassword = prompt('Enter new password for this user:');
            if (newPassword) {
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const userIndex = users.findIndex(u => u.id === user.id);
                
                if (userIndex !== -1) {
                    users[userIndex].password = newPassword;
                    users[userIndex].accountLocked = false;
                    users[userIndex].failedAttempts = 0;
                    delete users[userIndex].lockTime;
                    
                    localStorage.setItem('users', JSON.stringify(users));
                    alert(`Password for ${user.name} has been reset.`);
                    document.body.removeChild(modal);
                }
            }
        });
    }
}

function showEditUserModal(user) {
    // Create modal for editing user
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.style.position = 'fixed';
    modal.style.zIndex = '1000';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.overflow = 'auto';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#1e293b';
    modalContent.style.margin = '10% auto';
    modalContent.style.padding = '20px';
    modalContent.style.border = '1px solid rgba(148, 163, 184, 0.2)';
    modalContent.style.borderRadius = '15px';
    modalContent.style.width = '60%';
    modalContent.style.color = 'white';
    
    modalContent.innerHTML = `
        <span class="close" style="color: white; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
        <h2>Edit User</h2>
        <form id="edit-user-form" style="margin-top: 20px;">
            <div style="margin-bottom: 15px;">
                <label for="edit-name" style="display: block; margin-bottom: 5px;">Name:</label>
                <input type="text" id="edit-name" value="${user.name || ''}" style="width: 100%; padding: 8px; border-radius: 5px; background: rgba(30, 41, 59, 0.8); color: white; border: 1px solid rgba(148, 163, 184, 0.2);">
            </div>
            <div style="margin-bottom: 15px;">
                <label for="edit-email" style="display: block; margin-bottom: 5px;">Email:</label>
                <input type="email" id="edit-email" value="${user.email || ''}" style="width: 100%; padding: 8px; border-radius: 5px; background: rgba(30, 41, 59, 0.8); color: white; border: 1px solid rgba(148, 163, 184, 0.2);">
            </div>
            <div style="margin-bottom: 15px;">
                <label for="edit-phone" style="display: block; margin-bottom: 5px;">Phone:</label>
                <input type="text" id="edit-phone" value="${user.phone || ''}" style="width: 100%; padding: 8px; border-radius: 5px; background: rgba(30, 41, 59, 0.8); color: white; border: 1px solid rgba(148, 163, 184, 0.2);">
            </div>
            <div style="margin-bottom: 15px;">
                <label for="edit-status" style="display: block; margin-bottom: 5px;">Status:</label>
                <select id="edit-status" style="width: 100%; padding: 8px; border-radius: 5px; background: rgba(30, 41, 59, 0.8); color: white; border: 1px solid rgba(148, 163, 184, 0.2);">
                    <option value="approved" ${(user.approvalStatus === 'approved' || user.approved === true) ? 'selected' : ''}>Active</option>
                    <option value="pending" ${user.approvalStatus === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="rejected" ${user.approvalStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            </div>
            ${user.userType === 'admin' && !user.isSuperAdmin ? `
            <div style="margin-bottom: 15px;">
                <label for="edit-admin-type" style="display: block; margin-bottom: 5px;">Admin Type:</label>
                <select id="edit-admin-type" style="width: 100%; padding: 8px; border-radius: 5px; background: rgba(30, 41, 59, 0.8); color: white; border: 1px solid rgba(148, 163, 184, 0.2);">
                    <option value="regular" ${!user.isSuperAdmin ? 'selected' : ''}>Regular Admin</option>
                    <option value="super" ${user.isSuperAdmin ? 'selected' : ''}>Super Admin</option>
                </select>
            </div>
            ` : ''}
            <div style="text-align: right; margin-top: 20px;">
                <button type="submit" style="padding: 8px 16px; background-color: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer;">Save Changes</button>
            </div>
        </form>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking on X
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Handle form submission
    const form = modal.querySelector('#edit-user-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('edit-name').value;
        const email = document.getElementById('edit-email').value;
        const phone = document.getElementById('edit-phone').value;
        const status = document.getElementById('edit-status').value;
        const adminType = document.getElementById('edit-admin-type')?.value;
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex !== -1) {
            users[userIndex].name = name;
            users[userIndex].email = email;
            users[userIndex].phone = phone;
            users[userIndex].approvalStatus = status;
            users[userIndex].approved = status === 'approved';
            
            if (adminType) {
                users[userIndex].isSuperAdmin = adminType === 'super';
            }
            
            localStorage.setItem('users', JSON.stringify(users));
            alert('User updated successfully!');
            document.body.removeChild(modal);
            location.reload();
        }
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
    const requestCountElement = document.querySelector('.stat-card:nth-child(3) .stat-value');
    if (requestCountElement) {
        requestCountElement.textContent = accessRequests.length;
    }
    
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
        } else if (request.status === 'revoked') {
            statusClass = 'inactive';
            statusText = 'Revoked';
        }
        
        // Get case details
        const caseType = request.caseType || 'Unknown';
        const caseId = request.caseId || 'Unknown';
        
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
    
    // Add view details functionality
    requestTableBody.querySelectorAll('tr').forEach((row, index) => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => {
            if (index < recentRequests.length) {
                const request = recentRequests[index];
                showRequestDetails(request);
            }
        });
    });
}

function showRequestDetails(request) {
    // Create modal for request details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.style.position = 'fixed';
    modal.style.zIndex = '1000';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.overflow = 'auto';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    
    // Format date
    const requestDate = request.timestamp ? new Date(request.timestamp).toLocaleString() : 'Unknown';
    
    // Determine status
    let statusClass = 'pending';
    let statusText = 'Pending';
    
    if (request.status === 'approved') {
        statusClass = 'active';
        statusText = 'Approved';
    } else if (request.status === 'rejected') {
        statusClass = 'inactive';
        statusText = 'Rejected';
    } else if (request.status === 'revoked') {
        statusClass = 'inactive';
        statusText = 'Revoked';
    }
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#1e293b';
    modalContent.style.margin = '10% auto';
    modalContent.style.padding = '20px';
    modalContent.style.border = '1px solid rgba(148, 163, 184, 0.2)';
    modalContent.style.borderRadius = '15px';
    modalContent.style.width = '60%';
    modalContent.style.color = 'white';
    
    modalContent.innerHTML = `
        <span class="close" style="color: white; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
        <h2>Access Request Details</h2>
        <div style="margin-top: 20px;">
            <p><strong>Request ID:</strong> ${request.id || 'Unknown'}</p>
            <p><strong>Legal Professional:</strong> ${request.legalProfessionalName || 'Unknown'}</p>
            <p><strong>Patient:</strong> ${request.patientName || 'Unknown'}</p>
            <p><strong>Hospital:</strong> ${request.hospital || 'Unknown'}</p>
            <p><strong>Case ID:</strong> ${request.caseId || 'Unknown'}</p>
            <p><strong>Case Type:</strong> ${request.caseType || 'Unknown'}</p>
            <p><strong>Reason:</strong> ${request.reason || 'Unknown'}</p>
            <p><strong>Date Range:</strong> ${request.startDate || 'Unknown'} to ${request.endDate || 'Unknown'}</p>
            <p><strong>Urgency:</strong> ${request.urgency || 'Normal'}</p>
            <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
            <p><strong>Requested On:</strong> ${requestDate}</p>
            ${request.additionalInfo ? `<p><strong>Additional Info:</strong> ${request.additionalInfo}</p>` : ''}
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking on X
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function loadAuditLogs() {
    // Create a new section for audit logs
    const mainContent = document.querySelector('.main-content');
    const auditSection = document.createElement('div');
    auditSection.className = 'admin-section';
    
    // Create audit logs from various activities
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    const patientActivities = JSON.parse(localStorage.getItem('patientActivities') || '[]');
    const medicalNotifications = JSON.parse(localStorage.getItem('medicalNotifications') || '[]');
    const legalNotifications = JSON.parse(localStorage.getItem('legalNotifications') || '[]');
    
    // Get login attempts from users
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const loginAttempts = [];
    users.forEach(user => {
        if (user.lastLogin) {
            loginAttempts.push({
                id: `LOGIN-${Date.now()}-${user.id}`,
                type: 'Login',
                user: user.name,
                userType: user.userType,
                action: 'Logged into the system',
                timestamp: user.lastLogin
            });
        }
        if (user.failedAttempts > 0) {
            loginAttempts.push({
                id: `FAILED-${Date.now()}-${user.id}`,
                type: 'Failed Login',
                user: user.name,
                userType: user.userType,
                action: `Failed login attempt (${user.failedAttempts} attempts)`,
                timestamp: user.lockTime || new Date().toISOString()
            });
        }
    });
    
    // Combine all activities
    const auditLogs = [
        ...accessRequests.map(req => ({
            id: req.id,
            type: 'Access Request',
            user: req.legalProfessionalName,
            userType: 'legal',
            action: `Requested access to ${req.patientName}'s records`,
            timestamp: req.timestamp,
            details: req
        })),
        ...patientActivities.map(act => ({
            id: act.id,
            type: 'Patient Activity',
            user: act.patientName,
            userType: 'patient',
            action: act.description,
            timestamp: act.timestamp,
            details: act
        })),
        ...medicalNotifications.filter(n => n.type === 'system').map(notif => ({
            id: notif.id,
            type: 'Medical Staff',
            user: 'System',
            userType: 'medical',
            action: notif.message,
            timestamp: notif.timestamp,
            details: notif
        })),
        ...legalNotifications.filter(n => n.type === 'system').map(notif => ({
            id: notif.id,
            type: 'Legal Professional',
            user: 'System',
            userType: 'legal',
            action: notif.message,
            timestamp: notif.timestamp,
            details: notif
        })),
        ...loginAttempts
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
            <tbody id="audit-logs-tbody">
                ${auditLogs.length > 0 ? auditLogs.slice(0, 10).map(log => {
                    const logDate = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown';
                    
                    // Color-code user types
                    let userTypeStyle = '';
                    if (log.userType === 'admin') userTypeStyle = 'color: #818cf8;';
                    else if (log.userType === 'medical') userTypeStyle = 'color: #34d399;';
                    else if (log.userType === 'legal') userTypeStyle = 'color: #f59e0b;';
                    else if (log.userType === 'patient') userTypeStyle = 'color: #60a5fa;';
                    
                    // Color-code log types
                    let typeStyle = '';
                    if (log.type === 'Failed Login') typeStyle = 'color: #f87171;';
                    else if (log.type === 'Access Request') typeStyle = 'color: #f59e0b;';
                    
                    return `
                        <tr class="audit-log-row" data-log-id="${log.id}">
                            <td>${log.id || 'Unknown'}</td>
                            <td style="${typeStyle}">${log.type || 'Unknown'}</td>
                            <td style="${userTypeStyle}">${log.user || 'Unknown'}</td>
                            <td>${log.action || 'Unknown'}</td>
                            <td>${logDate}</td>
                        </tr>
                    `;
                }).join('') : '<tr><td colspan="5">No audit logs found</td></tr>'}
            </tbody>
        </table>
    `;
    
    // Append to main content
    mainContent.appendChild(auditSection);
    
    // Add click event to show log details
    setTimeout(() => {
        const logRows = document.querySelectorAll('.audit-log-row');
        logRows.forEach((row, index) => {
            if (index < auditLogs.length) {
                row.style.cursor = 'pointer';
                row.addEventListener('click', () => {
                    const logId = row.getAttribute('data-log-id');
                    const log = auditLogs.find(l => l.id === logId);
                    if (log) {
                        showLogDetails(log);
                    }
                });
            }
        });
    }, 100);
}

function showLogDetails(log) {
    // Create modal for log details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.style.position = 'fixed';
    modal.style.zIndex = '1000';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.overflow = 'auto';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    
    // Format date
    const logDate = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#1e293b';
    modalContent.style.margin = '10% auto';
    modalContent.style.padding = '20px';
    modalContent.style.border = '1px solid rgba(148, 163, 184, 0.2)';
    modalContent.style.borderRadius = '15px';
    modalContent.style.width = '60%';
    modalContent.style.color = 'white';
    
    // Generate details based on log type
    let detailsHTML = '';
    
    if (log.type === 'Access Request' && log.details) {
        const req = log.details;
        detailsHTML = `
            <p><strong>Request ID:</strong> ${req.id || 'Unknown'}</p>
            <p><strong>Legal Professional:</strong> ${req.legalProfessionalName || 'Unknown'}</p>
            <p><strong>Patient:</strong> ${req.patientName || 'Unknown'}</p>
            <p><strong>Hospital:</strong> ${req.hospital || 'Unknown'}</p>
            <p><strong>Case ID:</strong> ${req.caseId || 'Unknown'}</p>
            <p><strong>Case Type:</strong> ${req.caseType || 'Unknown'}</p>
            <p><strong>Status:</strong> ${req.status || 'Unknown'}</p>
            <p><strong>Reason:</strong> ${req.reason || 'Unknown'}</p>
        `;
    } else if (log.type === 'Patient Activity' && log.details) {
        const act = log.details;
        detailsHTML = `
            <p><strong>Activity ID:</strong> ${act.id || 'Unknown'}</p>
            <p><strong>Patient:</strong> ${act.patientName || 'Unknown'}</p>
            <p><strong>Activity Type:</strong> ${act.type || 'Unknown'}</p>
            <p><strong>Title:</strong> ${act.title || 'Unknown'}</p>
            <p><strong>Description:</strong> ${act.description || 'Unknown'}</p>
        `;
    } else if ((log.type === 'Medical Staff' || log.type === 'Legal Professional') && log.details) {
        const notif = log.details;
        detailsHTML = `
            <p><strong>Notification ID:</strong> ${notif.id || 'Unknown'}</p>
            <p><strong>Title:</strong> ${notif.title || 'Unknown'}</p>
            <p><strong>Message:</strong> ${notif.message || 'Unknown'}</p>
            <p><strong>Request ID:</strong> ${notif.requestId || 'N/A'}</p>
            <p><strong>Read:</strong> ${notif.read ? 'Yes' : 'No'}</p>
        `;
    } else if (log.type === 'Login' || log.type === 'Failed Login') {
        detailsHTML = `
            <p><strong>User:</strong> ${log.user || 'Unknown'}</p>
            <p><strong>User Type:</strong> ${log.userType || 'Unknown'}</p>
            <p><strong>Action:</strong> ${log.action || 'Unknown'}</p>
        `;
    }
    
    modalContent.innerHTML = `
        <span class="close" style="color: white; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
        <h2>Log Details</h2>
        <div style="margin-top: 20px;">
            <p><strong>Log ID:</strong> ${log.id || 'Unknown'}</p>
            <p><strong>Type:</strong> ${log.type || 'Unknown'}</p>
            <p><strong>User:</strong> ${log.user || 'Unknown'}</p>
            <p><strong>Action:</strong> ${log.action || 'Unknown'}</p>
            <p><strong>Date & Time:</strong> ${logDate}</p>
            <hr style="border-color: rgba(255, 255, 255, 0.1); margin: 15px 0;">
            <h3>Additional Details</h3>
            ${detailsHTML}
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking on X
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
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