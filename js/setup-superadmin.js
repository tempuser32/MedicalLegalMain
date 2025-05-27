// Script to set up superadmin user in localStorage
function setupSuperadmin() {
    // Get existing users or create empty array
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if superadmin already exists
    const superadminExists = users.some(user => 
        user.id === 'superadmin' && user.userType === 'admin'
    );
    
    if (!superadminExists) {
        // Create superadmin user
        const superadmin = {
            id: 'superadmin',
            password: 'superadmin123',
            name: 'Super Administrator',
            email: 'superadmin@medlegal.com',
            phone: '1234567890',
            userType: 'admin',
            isSuperAdmin: true,
            approved: true,
            approvalStatus: 'approved',
            failedAttempts: 0,
            accountLocked: false
        };
        
        // Add to users array
        users.push(superadmin);
        
        // Save back to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        console.log('Superadmin user created successfully!');
        alert('Superadmin user created successfully! You can now log in with ID: superadmin and password: superadmin123');
    } else {
        console.log('Superadmin user already exists');
        alert('Superadmin user already exists. You can log in with ID: superadmin and password: superadmin123');
    }
}

// Run setup when the script loads
setupSuperadmin();