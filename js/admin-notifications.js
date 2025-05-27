document.addEventListener('DOMContentLoaded', function() {
    // Generate and load notifications
    generateNotifications();
    loadNotifications();
    
    // Set up filter buttons
    setupFilterButtons();
});

function generateNotifications() {
    // Check if we already have notifications
    let notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    
    // If no notifications exist, generate them based on user data
    if (notifications.length === 0) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        notifications = [];
        
        // Add notifications for pending users
        const pendingUsers = users.filter(user => 
            user.approvalStatus === 'pending' || 
            (user.approved === false && user.approvalStatus !== 'rejected')
        );
        
        pendingUsers.forEach(user => {
            notifications.push({
                id: generateId(),
                type: 'user',
                title: 'New User Registration',
                message: `${user.name || user.id} has registered as a ${user.userType} and is awaiting approval.`,
                timestamp: user.registrationDate || new Date().toISOString(),
                read: false,
                userId: user.id
            });
        });
        
        // Add notifications for recently approved users
        const recentlyApprovedUsers = users.filter(user => 
            (user.approvalStatus === 'approved' || user.approved === true) &&
            user.registrationDate && 
            (new Date() - new Date(user.registrationDate)) < 7 * 24 * 60 * 60 * 1000 // Within last 7 days
        );
        
        recentlyApprovedUsers.forEach(user => {
            notifications.push({
                id: generateId(),
                type: 'user',
                title: 'User Approved',
                message: `${user.name || user.id} (${user.userType}) has been approved and can now access the system.`,
                timestamp: user.registrationDate || new Date().toISOString(),
                read: true,
                userId: user.id
            });
        });
        
        // Add system notifications
        notifications.push({
            id: generateId(),
            type: 'system',
            title: 'System Update',
            message: 'The system has been updated to the latest version. New features include improved user management and enhanced security.',
            timestamp: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            read: false
        });
        
        // Add alert notifications
        notifications.push({
            id: generateId(),
            type: 'alert',
            title: 'Security Alert',
            message: 'Multiple failed login attempts detected for user account "admin". Please review the access logs.',
            timestamp: new Date(new Date().getTime() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
            read: false,
            alertId: 'SEC-001'
        });
        
        // Save notifications to localStorage
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
    }
}

function loadNotifications() {
    const notificationList = document.getElementById('notification-list');
    let notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    
    // Display notifications
    if (notifications.length > 0) {
        notificationList.innerHTML = '';
        
        // Sort by timestamp (newest first)
        notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Update notification badge count
        updateNotificationBadge(notifications.filter(n => !n.read).length);
        
        notifications.forEach(notification => {
            const notificationItem = createNotificationItem(notification);
            notificationList.appendChild(notificationItem);
        });
    }
}

function createNotificationItem(notification) {
    const notificationItem = document.createElement('div');
    notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
    notificationItem.setAttribute('data-id', notification.id);
    notificationItem.setAttribute('data-type', notification.type);
    
    // Format timestamp
    const timestamp = new Date(notification.timestamp);
    const formattedTime = formatTimeAgo(timestamp);
    
    // Determine icon based on notification type
    let iconClass = 'fa-bell';
    let notificationType = 'system';
    
    if (notification.type === 'user') {
        iconClass = 'fa-user';
        notificationType = 'user';
    } else if (notification.type === 'alert') {
        iconClass = 'fa-exclamation-triangle';
        notificationType = 'alert';
    } else if (notification.type === 'access_request') {
        iconClass = 'fa-file-signature';
        notificationType = 'access-request';
    }
    
    // Create notification content
    let actionsHtml = '';
    
    // Add specific actions based on notification type
    if (notification.type === 'user' && notification.userId) {
        // For pending users, add approve/reject buttons
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.id === notification.userId);
        
        if (user && (user.approvalStatus === 'pending' || (user.approved === false && user.approvalStatus !== 'rejected'))) {
            actionsHtml = `
                <div class="notification-actions">
                    <button class="notification-btn approve-btn" data-user-id="${notification.userId}">Approve</button>
                    <button class="notification-btn reject-btn" data-user-id="${notification.userId}">Reject</button>
                    <button class="notification-btn mark-read-btn" data-notification-id="${notification.id}">${notification.read ? 'Mark as Unread' : 'Mark as Read'}</button>
                </div>
            `;
        } else {
            actionsHtml = `
                <div class="notification-actions">
                    <button class="notification-btn view-btn" data-user-id="${notification.userId}">View User</button>
                    <button class="notification-btn mark-read-btn" data-notification-id="${notification.id}">${notification.read ? 'Mark as Unread' : 'Mark as Read'}</button>
                </div>
            `;
        }
    } else if (notification.type === 'alert' && notification.alertId) {
        actionsHtml = `
            <div class="notification-actions">
                <button class="notification-btn view-btn" data-alert-id="${notification.alertId}">View Alert</button>
                <button class="notification-btn mark-read-btn" data-notification-id="${notification.id}">${notification.read ? 'Mark as Unread' : 'Mark as Read'}</button>
            </div>
        `;
    } else {
        actionsHtml = `
            <div class="notification-actions">
                <button class="notification-btn mark-read-btn" data-notification-id="${notification.id}">${notification.read ? 'Mark as Unread' : 'Mark as Read'}</button>
            </div>
        `;
    }
    
    notificationItem.innerHTML = `
        <div class="notification-icon ${notificationType}">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${formattedTime}</div>
            ${actionsHtml}
        </div>
    `;
    
    // Add event listeners for action buttons
    setTimeout(() => {
        const markReadBtn = notificationItem.querySelector('.mark-read-btn');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleReadStatus(notification.id);
            });
        }
        
        const viewBtn = notificationItem.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (notification.type === 'user') {
                    viewUserDetails(notification.userId);
                } else if (notification.type === 'alert') {
                    viewAlertDetails(notification.alertId);
                }
            });
        }
        
        const approveBtn = notificationItem.querySelector('.approve-btn');
        if (approveBtn) {
            approveBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                approveUser(notification.userId, notification.id);
            });
        }
        
        const rejectBtn = notificationItem.querySelector('.reject-btn');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                rejectUser(notification.userId, notification.id);
            });
        }
    }, 0);
    
    return notificationItem;
}

function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Apply filter
            const filter = this.getAttribute('data-filter');
            filterNotifications(filter);
        });
    });
}

function filterNotifications(filter) {
    const notificationItems = document.querySelectorAll('.notification-item');
    
    notificationItems.forEach(item => {
        if (filter === 'all') {
            item.style.display = 'flex';
        } else if (filter === 'unread') {
            item.style.display = item.classList.contains('unread') ? 'flex' : 'none';
        } else {
            item.style.display = item.getAttribute('data-type') === filter ? 'flex' : 'none';
        }
    });
    
    // Show empty state if no notifications match the filter
    const visibleItems = Array.from(notificationItems).filter(item => item.style.display !== 'none');
    const notificationList = document.getElementById('notification-list');
    
    if (visibleItems.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-bell-slash"></i>
            <p>No ${filter === 'all' ? '' : filter} notifications to display</p>
        `;
        
        // Remove any existing empty state
        const existingEmptyState = notificationList.querySelector('.empty-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }
        
        notificationList.appendChild(emptyState);
    } else {
        // Remove empty state if there are visible items
        const existingEmptyState = notificationList.querySelector('.empty-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }
    }
}

function toggleReadStatus(notificationId) {
    const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex !== -1) {
        notifications[notificationIndex].read = !notifications[notificationIndex].read;
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
        
        // Update UI
        const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (notificationItem) {
            if (notifications[notificationIndex].read) {
                notificationItem.classList.remove('unread');
            } else {
                notificationItem.classList.add('unread');
            }
            
            const markReadBtn = notificationItem.querySelector('.mark-read-btn');
            if (markReadBtn) {
                markReadBtn.textContent = notifications[notificationIndex].read ? 'Mark as Unread' : 'Mark as Read';
            }
        }
        
        // Update notification badge count
        updateNotificationBadge(notifications.filter(n => !n.read).length);
    }
}

function approveUser(userId, notificationId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        // Update user status
        users[userIndex].approvalStatus = 'approved';
        users[userIndex].approved = true;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Mark notification as read
        const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        const notificationIndex = notifications.findIndex(n => n.id === notificationId);
        
        if (notificationIndex !== -1) {
            notifications[notificationIndex].read = true;
            notifications[notificationIndex].message = `${users[userIndex].name || users[userIndex].id} has been approved as a ${users[userIndex].userType}.`;
            localStorage.setItem('adminNotifications', JSON.stringify(notifications));
        }
        
        // Add a new notification for the approval
        const newNotification = {
            id: generateId(),
            type: 'user',
            title: 'User Approved',
            message: `You have approved ${users[userIndex].name || users[userIndex].id} (${users[userIndex].userType}).`,
            timestamp: new Date().toISOString(),
            read: false,
            userId: userId
        };
        
        notifications.push(newNotification);
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
        
        // Reload notifications
        loadNotifications();
    }
}

function rejectUser(userId, notificationId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        // Update user status
        users[userIndex].approvalStatus = 'rejected';
        users[userIndex].approved = false;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Mark notification as read
        const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        const notificationIndex = notifications.findIndex(n => n.id === notificationId);
        
        if (notificationIndex !== -1) {
            notifications[notificationIndex].read = true;
            notifications[notificationIndex].message = `${users[userIndex].name || users[userIndex].id}'s registration has been rejected.`;
            localStorage.setItem('adminNotifications', JSON.stringify(notifications));
        }
        
        // Add a new notification for the rejection
        const newNotification = {
            id: generateId(),
            type: 'user',
            title: 'User Rejected',
            message: `You have rejected ${users[userIndex].name || users[userIndex].id}'s (${users[userIndex].userType}) registration.`,
            timestamp: new Date().toISOString(),
            read: false,
            userId: userId
        };
        
        notifications.push(newNotification);
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
        
        // Reload notifications
        loadNotifications();
    }
}

function viewUserDetails(userId) {
    // Navigate to the user details page
    window.location.href = `admin-users.html?user=${userId}`;
}

function viewAlertDetails(alertId) {
    // Navigate to the alert details page
    window.location.href = `admin-logs.html?alert=${alertId}`;
}

function updateNotificationBadge(count) {
    const badges = document.querySelectorAll('.badge');
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline' : 'none';
    });
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

function generateId() {
    return 'notif-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}