// Initialize users from API
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const API_CONFIG = {
            baseUrl: 'https://medicolegal.onrender.com/api',
            auth: {
                profile: '/auth/profile'
            },
            users: {
                getAll: '/users'
            }
        };
        
        // Load user profile from API
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.auth.profile}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const user = await response.json();
        // Store user profile in localStorage
        localStorage.setItem('userProfile', JSON.stringify(user));

        // Load all users from API
        const usersResponse = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.users.getAll}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!usersResponse.ok) {
            throw new Error('Failed to load users');
        }

        const users = await usersResponse.json();
        let needsUpdate = false;
        
        users.forEach(user => {
            if (typeof user.failedAttempts === 'undefined') {
                user.failedAttempts = 0;
                needsUpdate = true;
            }
            if (typeof user.accountLocked === 'undefined') {
                user.accountLocked = false;
                needsUpdate = true;
            }
        });
        
        if (needsUpdate) {
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    // Set up event listeners for login page elements if they exist
    const forgotCredentialsLink = document.getElementById('forgot-credentials');
    if (forgotCredentialsLink) {
        forgotCredentialsLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'forgot-credentials.html';
        });
    }
    
    const requestOtpLink = document.getElementById('request-otp');
    if (requestOtpLink) {
        requestOtpLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('OTP functionality will be implemented in a future update.');
        });
    }
});