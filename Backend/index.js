const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Database
require("./src/config/database").initializeDatabase();

// Routes
app.use("/api/auth", require("./src/routers/authRouter"));
app.use("/api/categories", require("./src/routers/categoryRouter"));
app.use("/api/products", require("./src/routers/productRouter"));
app.use("/api/razorpay", require("./src/routers/razorpayRouter"));
app.use("/api/users", require("./src/routers/userRouter"));
app.use("/api/reviews", require("./src/routers/reviewRoutes"));
app.use("/api/videos", require("./src/routers/videoRouter"));
app.use("/api/orders", require("./src/routers/orderRouter"));
app.use("/api/invoices", require("./src/routers/invoiceRouter"));
app.use("/api/dealers", require("./src/routers/dealerRouter"));
app.use("/api/dashboard", require("./src/routers/dashboardRouter"));
app.use("/api/addresses", require("./src/routers/addressRouter"));
app.use("/api/cart", require("./src/routers/cartRoutes"));
app.use("/api/wishlist", require("./src/routers/wishlistRouter"));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend Running Successfully"
  });
});

// Root Route
app.get("/", (req, res) => {
  res.send("Sri Saravana Shop Backend Running");
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;