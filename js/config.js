// API Configuration
const API_CONFIG = {
    // Use Render backend URL
    baseUrl: 'https://medicolegal.onrender.com/api',
    
    // API endpoints
    auth: {
        login: '/auth/login',
        profile: '/auth/profile',
        register: '/auth/register'
    },
    medical: {
        profile: '/medical/profile',
        cases: '/medical/cases'
    }
};

export default API_CONFIG;
