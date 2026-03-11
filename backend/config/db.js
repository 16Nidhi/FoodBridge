const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * If the connection fails, the process exits immediately
 * so the server does not start in a broken state.
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGO_URI || 'mongodb://localhost:27017/food_donation'
        );

        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);

        // Exit the process so the server does not run without a database
        process.exit(1);
    }
};

module.exports = connectDB;
