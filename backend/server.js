const express = require('express');
const connectDB = require('./db/connection');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const medicalRoutes = require('./routes/medical');

const app = express();

// Logging
console.log('Starting server...');
console.log('Environment variables:', {
    MONGODB_URI: process.env.MONGODB_URI || 'Not set',
    PORT: process.env.PORT || 'Not set'
});

// Middleware
app.use(cors({
    origin: ['http://127.0.0.1:5503', 'http://localhost:5503', 'https://medicolegal.onrender.com'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medical', medicalRoutes);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve overview.html as default BEFORE express.static
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../html', 'overview.html'));
});

// Serve static files (general and medical-specific)
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/medical', express.static(path.join(__dirname, '../html/medical')));
app.use('/css/medical', express.static(path.join(__dirname, '../css/medical')));
app.use('/js/medical', express.static(path.join(__dirname, '../js/medical')));
app.use(express.static(path.join(__dirname, '../html'))); // Keep this last

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3002;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
