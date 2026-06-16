const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for Frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection
const pool = require('./src/config/db');
const { initializeDatabase } = require('./src/config/database');
const authRouter = require('./src/routers/authRouter');
const categoryRouter = require('./src/routers/categoryRouter');
const productRouter = require('./src/routers/productRouter');

// Initialize database
initializeDatabase();

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running', status: 'OK' });
});

// Auth routes
app.use('/api/auth', authRouter);

// Category routes
app.use('/api/categories', categoryRouter);

// Product routes
app.use('/api/products', productRouter);

// Other routes (to be added)
// const productsRouter = require('./src/routers/products');
// const ordersRouter = require('./src/routers/orders');
// app.use('/api/products', productsRouter);
// app.use('/api/orders', ordersRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
