const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const clientOptions = { 
    serverApi: { 
        version: '1', 
        strict: true, 
        deprecationErrors: true 
    },
    useNewUrlParser: true,
    useUnifiedTopology: true
};

const connectDB = async () => {
    try {
        await mongoose.connect(uri, clientOptions);
        console.log('MongoDB connected successfully');
        // Test connection
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
