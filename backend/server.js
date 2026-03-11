const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------------------
// Global Middleware
// ----------------------------

// Allow cross-origin requests (frontend on a different port)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ----------------------------
// API Routes
// ----------------------------

app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/donations',     require('./routes/donationRoutes'));
app.use('/api/verifications', require('./routes/verificationRoutes'));
app.use('/api/ratings',       require('./routes/ratingRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));

// Health-check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'FoodShare API is running.' });
});

// ----------------------------
// 404 Handler (unknown routes)
// ----------------------------

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// ----------------------------
// Global Error Handler
// ----------------------------

// Catches any errors passed via next(err) from controllers
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error.',
    });
});

// ----------------------------
// Start Server After DB Connects
// ----------------------------

// Connect to MongoDB first, then start listening for requests
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});
