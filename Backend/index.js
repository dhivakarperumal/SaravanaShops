const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Fix for Plesk/Nginx/IIS rewriting API requests to /index.html
app.use((req, res, next) => {
  const originalUrl = req.headers['x-original-uri'] || req.headers['x-rewrite-url'] || req.headers['x-original-url'];
  if (originalUrl && req.url === '/index.html') {
    req.url = originalUrl;
    req.originalUrl = originalUrl;
  }
  next();
});

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
const videoRoutes = require("./src/routers/videoRouter");
const userRouter = require('./src/routers/userRouter');
const ordersRouter = require('./src/routers/orderRouter');
const invoiceRouter = require('./src/routers/invoiceRouter');
const dealerRouter = require('./src/routers/dealerRouter');
const dashboardRouter = require('./src/routers/dashboardRouter');
const addressRouter = require('./src/routers/addressRouter');
const cartRoutes = require("./src/routers/cartRoutes");
const wishlistRouter = require("./src/routers/wishlistRouter");

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

// Video routes
app.use("/api/videos", videoRoutes);
app.use('/api/orders', ordersRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/dealers', dealerRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/addresses', addressRouter);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Default root route for Plesk health checks
app.get('/', (req, res) => {
  res.status(200).send('<h1>Backend is running!</h1>');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route not found: ${req.originalUrl}. Did you forget the /api prefix?` 
  });
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
