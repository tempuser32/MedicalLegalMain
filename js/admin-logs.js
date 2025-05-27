document.addEventListener('DOMContentLoaded', function() {
    // Load activity logs from localStorage or create sample data if none exists
    loadActivityLogs();
    
    // Set up event listeners
    setupEventListeners();
});

function loadActivityLogs() {
    // Try to get logs from localStorage
    let activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    
    // If no logs exist, create sample data
    if (activityLogs.length === 0) {
        activityLogs = generateSampleLogs();
        localStorage.setItem('activityLogs', JSON.stringify(activityLogs));
    }
    
    // Display logs in the table
    displayLogs(activityLogs);
}

function displayLogs(logs) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';
    
    if (logs.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6">No activity logs found</td>';
        tbody.appendChild(tr);
        return;
    }
    
    // Sort logs by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    logs.forEach(log => {
        const tr = document.createElement('tr');
        tr.setAttribute('tabindex', '0');
        tr.setAttribute('data-log-type', log.activityType);
        tr.setAttribute('data-user', log.userName);
        tr.setAttribute('data-date', new Date(log.timestamp).toISOString().split('T')[0]);
        
        tr.innerHTML = `
            <td>${formatDateTime(log.timestamp)}</td>
            <td>${log.userName}</td>
            <td>${log.userType}</td>
            <td>${log.activityType}</td>
            <td>${log.details}</td>
            <td>${log.ipAddress}</td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Update pagination info
    document.querySelector('.page-info').textContent = `Page 1 of ${Math.ceil(logs.length / 10)}`;
}

function setupEventListeners() {
    // Filter button
    document.querySelector('.btn.filter').addEventListener('click', function() {
        const logType = document.getElementById('logType').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const userFilter = document.getElementById('userFilter').value.toLowerCase();
        
        filterLogs(logType, dateFilter, userFilter);
    });
    
    // Pagination buttons
    document.querySelector('.btn.page-prev').addEventListener('click', function() {
        // Implement pagination logic here
        alert('Previous page functionality will be implemented');
    });
    
    document.querySelector('.btn.page-next').addEventListener('click', function() {
        // Implement pagination logic here
        alert('Next page functionality will be implemented');
    });
    
    // Export button
    document.querySelector('.btn.export').addEventListener('click', function() {
        exportLogs();
    });
}

function filterLogs(logType, dateFilter, userFilter) {
    const rows = document.querySelectorAll('table tbody tr');
    
    rows.forEach(row => {
        const rowLogType = row.getAttribute('data-log-type');
        const rowUser = row.getAttribute('data-user').toLowerCase();
        const rowDate = row.getAttribute('data-date');
        
        const matchesType = logType === 'all' || rowLogType === logType;
        const matchesDate = !dateFilter || rowDate === dateFilter;
        const matchesUser = !userFilter || rowUser.includes(userFilter);
        
        if (matchesType && matchesDate && matchesUser) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function exportLogs() {
    const table = document.querySelector('table');
    const rows = Array.from(table.querySelectorAll('tbody tr')).filter(row => row.style.display !== 'none');
    
    if (rows.length === 0) {
        alert('No logs to export');
        return;
    }
    
    let csv = 'Timestamp,User,User Type,Activity,Details,IP Address\n';
    
    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        const rowData = cells.map(cell => `"${cell.textContent.replace(/"/g, '""')}"`).join(',');
        csv += rowData + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity_logs.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

function generateSampleLogs() {
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // If no users, create some sample users for the logs
    const sampleUsers = users.length > 0 ? users : [
        { name: 'John Smith', userType: 'Legal', id: 'L001' },
        { name: 'Sarah Johnson', userType: 'Medical', id: 'M001' },
        { name: 'Admin User', userType: 'Admin', id: 'A001' },
        { name: 'Michael Brown', userType: 'Patient', id: 'P001' },
        { name: 'Lisa Davis', userType: 'Legal', id: 'L002' }
    ];
    
    const activityTypes = ['Login', 'Logout', 'Record Access', 'Record Upload', 'User Management', 'Permission Change'];
    const ipAddresses = ['192.168.1.105', '192.168.1.87', '192.168.1.10', '192.168.1.201', '192.168.1.156'];
    
    const logs = [];
    const now = new Date();
    
    // Generate 50 sample logs
    for (let i = 0; i < 50; i++) {
        const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
        const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        const ipAddress = ipAddresses[Math.floor(Math.random() * ipAddresses.length)];
        
        // Generate a random timestamp within the last 30 days
        const timestamp = new Date(now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
        
        // Generate details based on activity type
        let details = '';
        switch (activityType) {
            case 'Login':
                details = 'Successful login';
                break;
            case 'Logout':
                details = 'User logged out';
                break;
            case 'Record Access':
                details = `Viewed medical record MLC-${Math.floor(1000 + Math.random() * 9000)}`;
                break;
            case 'Record Upload':
                details = `Uploaded new medical document for patient P-${Math.floor(1000 + Math.random() * 9000)}`;
                break;
            case 'User Management':
                details = `${['Created', 'Updated', 'Deleted'][Math.floor(Math.random() * 3)]} user account for ${['Dr.', 'Adv.', 'Mr.', 'Ms.'][Math.floor(Math.random() * 4)]} ${['Williams', 'Johnson', 'Smith', 'Davis'][Math.floor(Math.random() * 4)]}`;
                break;
            case 'Permission Change':
                details = `${['Granted', 'Revoked', 'Requested'][Math.floor(Math.random() * 3)]} access to patient record P-${Math.floor(1000 + Math.random() * 9000)}`;
                break;
        }
        
        logs.push({
            timestamp: timestamp.toISOString(),
            userName: user.name,
            userType: user.userType,
            userId: user.id,
            activityType,
            details,
            ipAddress
        });
    }
    
    // Add real user activity if available
    if (users.length > 0) {
        // Add registration events for each user
        users.forEach(user => {
            if (user.registrationDate) {
                logs.push({
                    timestamp: user.registrationDate,
                    userName: user.name || 'Unknown User',
                    userType: user.userType || 'Unknown',
                    userId: user.id,
                    activityType: 'Registration',
                    details: 'User account created',
                    ipAddress: ipAddresses[Math.floor(Math.random() * ipAddresses.length)]
                });
            }
        });
    }
    
    return logs;
}