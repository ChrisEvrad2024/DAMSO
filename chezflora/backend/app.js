const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Create Express app
const app = express();

// Set security HTTP headers
app.use(helmet());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// HTTP request logger middleware
app.use(morgan('dev'));

// Serve static files from the 'public' directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Base route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to ChezFlora API' });
});

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
});

// Error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || 'Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

module.exports = app;