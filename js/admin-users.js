document.addEventListener('DOMContentLoaded', function() {
    // Load all users from localStorage
    loadUsers();
    
    // Add search functionality
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'user-search';
    searchInput.placeholder = 'Search users...';
    searchInput.style.padding = '8px';
    searchInput.style.marginBottom = '20px';
    searchInput.style.width = '100%';
    searchInput.style.borderRadius = '5px';
    searchInput.style.border = '1px solid #ccc';
    
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(searchInput, document.querySelector('.users'));
    
    searchInput.addEventListener('input', function() {
        filterUsers(this.value);
    });
});

function loadUsers() {
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Get the table body
    const tableBody = document.querySelector('.users table tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4">No users found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    // Sort users: admins first, then by user type
    users.sort((a, b) => {
        // Sort by user type (admin first)
        if (a.userType === 'admin' && b.userType !== 'admin') return -1;
        if (a.userType !== 'admin' && b.userType === 'admin') return 1;
        
        // Then by super admin status
        if (a.isSuperAdmin && !b.isSuperAdmin) return -1;
        if (!a.isSuperAdmin && b.isSuperAdmin) return 1;
        
        // Then by name
        return (a.name || '').localeCompare(b.name || '');
    });
    
    // Add users to the table
    users.forEach(user => {
        const row = document.createElement('tr');
        row.setAttribute('data-user-id', user.id);
        row.setAttribute('data-user-type', user.userType);
        row.setAttribute('data-user-name', user.name || '');
        row.setAttribute('data-user-email', user.email || '');
        
        // Determine status
        let statusClass = 'pending';
        let statusText = 'Pending';
        
        if (user.approvalStatus === 'approved' || user.approved === true) {
            statusClass = 'active';
            statusText = 'Active';
        } else if (user.approvalStatus === 'rejected') {
            statusClass = 'rejected';
            statusText = 'Rejected';
        }
        
        // Check if account is locked
        if (user.accountLocked) {
            statusClass = 'locked';
            statusText = 'Locked';
        }
        
        // Create user type display
        let userTypeDisplay = user.userType || 'Unknown';
        if (user.userType === 'admin' && user.isSuperAdmin) {
            userTypeDisplay = 'Super Admin';
        }
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${userTypeDisplay}</td>
            <td>${statusText}</td>
            <td>
                <button class="btn-small view" data-user-id="${user.id}"><i class="fas fa-eye"></i> View</button>
                ${statusClass === 'active' ? 
                    `<button class="btn-small deactivate" data-user-id="${user.id}"><i class="fas fa-user-slash"></i> Deactivate</button>` : 
                    `<button class="btn-small activate" data-user-id="${user.id}"><i class="fas fa-user-check"></i> Activate</button>`
                }
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    addButtonEventListeners();
}

function addButtonEventListeners() {
    // View button
    document.querySelectorAll('.btn-small.view').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            viewUser(userId);
        });
    });
    
    // Activate button
    document.querySelectorAll('.btn-small.activate').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            toggleUserStatus(userId, true);
        });
    });
    
    // Deactivate button
    document.querySelectorAll('.btn-small.deactivate').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            toggleUserStatus(userId, false);
        });
    });
}

function filterUsers(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    const rows = document.querySelectorAll('.users table tbody tr');
    
    rows.forEach(row => {
        const userId = row.getAttribute('data-user-id') || '';
        const userName = row.getAttribute('data-user-name') || '';
        const userType = row.getAttribute('data-user-type') || '';
        const userEmail = row.getAttribute('data-user-email') || '';
        
        if (userId.toLowerCase().includes(searchTerm) || 
            userName.toLowerCase().includes(searchTerm) || 
            userType.toLowerCase().includes(searchTerm) ||
            userEmail.toLowerCase().includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function viewUser(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
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
            <p><strong>Status:</strong> ${user.approvalStatus || (user.approved ? 'Approved' : 'Pending')}</p>
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
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex !== -1) {
                users[userIndex].accountLocked = false;
                users[userIndex].failedAttempts = 0;
                delete users[userIndex].lockTime;
                
                localStorage.setItem('users', JSON.stringify(users));
                alert(`Account for ${user.name} has been unlocked.`);
                document.body.removeChild(modal);
                loadUsers();
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
                const userIndex = users.findIndex(u => u.id === userId);
                
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

function toggleUserStatus(userId, activate) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        users[userIndex].approvalStatus = activate ? 'approved' : 'rejected';
        users[userIndex].approved = activate;
        
        localStorage.setItem('users', JSON.stringify(users));
        alert(`User ${activate ? 'activated' : 'deactivated'} successfully!`);
        loadUsers();
    }
}