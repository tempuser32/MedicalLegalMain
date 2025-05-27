document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../index.html';
            return;
        }

        // Display admin name
        const userName = localStorage.getItem('userName');
        if (userName) {
            document.getElementById('admin-name').textContent = userName;
        }

        // Load user statistics and pending users
        loadUserStatistics();
        loadPendingUsers();

        // Set up event listeners
        document.getElementById('refresh-pending').addEventListener('click', loadPendingUsers);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
});

function loadUserStatistics() {
    try {
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Calculate statistics
        const totalUsers = users.length;
        const pendingUsers = users.filter(user => 
            user.approvalStatus === 'pending' || 
            (user.approved === false && user.approvalStatus !== 'rejected')
        ).length;
        const approvedUsers = users.filter(user => 
            user.approvalStatus === 'approved' || 
            user.approved === true
        ).length;
        
        // Update the UI
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('pending-users').textContent = pendingUsers;
        document.getElementById('approved-users').textContent = approvedUsers;
        
        // Update pending count in sidebar if it exists
        const pendingCountElement = document.querySelector('.pending-count');
        if (pendingCountElement) {
            pendingCountElement.textContent = pendingUsers;
        }
    } catch (error) {
        console.error('Error loading user statistics:', error);
    }
}

function loadPendingUsers() {
    try {
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Filter pending users
        const pendingUsers = users.filter(user => 
            user.approvalStatus === 'pending' || 
            (user.approved === false && user.approvalStatus !== 'rejected')
        );
        
        // Get the container
        const pendingUsersContainer = document.getElementById('pending-users-list');
        pendingUsersContainer.innerHTML = '';
        
        if (pendingUsers.length === 0) {
            pendingUsersContainer.innerHTML = '<p class="no-data">No pending users found</p>';
            return;
        }
        
        // Create a card for each pending user
        pendingUsers.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            
            // Format registration date
            const registrationDate = user.registrationDate ? 
                new Date(user.registrationDate).toLocaleDateString() : 'Unknown';
            
            userCard.innerHTML = `
                <div class="user-info">
                    <h3>${user.name || 'Unknown'}</h3>
                    <p><strong>ID:</strong> ${user.id}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>User Type:</strong> ${user.userType}</p>
                    <p><strong>Registered:</strong> ${registrationDate}</p>
                </div>
                <div class="user-actions">
                    <button class="approve-btn" data-user-id="${user.id}">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="reject-btn" data-user-id="${user.id}">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            `;
            
            pendingUsersContainer.appendChild(userCard);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.approve-btn').forEach(button => {
            button.addEventListener('click', function() {
                approveUser(this.getAttribute('data-user-id'));
            });
        });
        
        document.querySelectorAll('.reject-btn').forEach(button => {
            button.addEventListener('click', function() {
                rejectUser(this.getAttribute('data-user-id'));
            });
        });
    } catch (error) {
        console.error('Error loading pending users:', error);
    }
}

function approveUser(userId) {
    try {
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Find the user
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            // Update user status
            users[userIndex].approvalStatus = 'approved';
            users[userIndex].approved = true;
            
            // Save back to localStorage
            localStorage.setItem('users', JSON.stringify(users));
            
            // Show success message
            alert(`User ${users[userIndex].name || userId} has been approved.`);
            
            // Refresh the dashboard
            loadUserStatistics();
            loadPendingUsers();
        }
    } catch (error) {
        console.error('Error approving user:', error);
    }
}

function rejectUser(userId) {
    try {
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Find the user
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            // Update user status
            users[userIndex].approvalStatus = 'rejected';
            users[userIndex].approved = false;
            
            // Save back to localStorage
            localStorage.setItem('users', JSON.stringify(users));
            
            // Show success message
            alert(`User ${users[userIndex].name || userId} has been rejected.`);
            
            // Refresh the dashboard
            loadUserStatistics();
            loadPendingUsers();
        }
    } catch (error) {
        console.error('Error rejecting user:', error);
    }
}