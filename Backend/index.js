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


app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


const pool = require('./src/config/db');
const { initializeDatabase } = require('./src/config/database');
const authRouter = require('./src/routers/authRouter');
const categoryRouter = require('./src/routers/categoryRouter');
const productRouter = require('./src/routers/productRouter');
const razorpayRouter = require('./src/routers/razorpayRouter');
const reviewRouter = require('./src/routers/reviewRoutes');
const userRouter = require('./src/routers/userRouter');
const ordersRouter = require('./src/routers/orderRouter');
const invoiceRouter = require('./src/routers/invoiceRouter');
const dealerRouter = require('./src/routers/dealerRouter');


initializeDatabase();

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running', status: 'OK' });
});


app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/razorpay', razorpayRouter);
app.use('/api/users', userRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/dealers', dealerRouter);

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

const http = require('http');

// Start server with explicit error handling to avoid unhandled EADDRINUSE crashes
const server = http.createServer(app);

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
