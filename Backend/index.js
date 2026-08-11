const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { initializeDatabase } = require("./src/config/database");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "127.0.0.1";

const startServer = async (requestedPort, host) => {
  return await new Promise((resolve, reject) => {
    const server = app.listen(requestedPort, host, () => {
      resolve(server);
    });

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        reject(new Error(`Port ${requestedPort} is already in use. Stop the process using it or change PORT in .env.`));
      } else {
        reject(error);
      }
    });
  });
};

const requiredEnv = [
  'JWT_SECRET',
  'DB_USER',
  'DB_NAME',
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  console.error('Missing required environment variables:', missingEnv.join(', '));
  process.exit(1);
}

console.log('WhatsApp provider:', process.env.WHATSAPP_PROVIDER || 'meta');
console.log('WhatsApp provider config loaded:', {
  WHATSAPP_PHONE_NUMBER_ID: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_API_TOKEN: !!process.env.WHATSAPP_API_TOKEN,
  WHATSAPP_MESSAGE_TEMPLATE_ID: !!process.env.WHATSAPP_MESSAGE_TEMPLATE_ID,
  WHATSAPP_ACCESS_TOKEN: !!process.env.WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_ALLOWED_RECIPIENTS: process.env.WHATSAPP_ALLOWED_RECIPIENTS || '(blank)'
});

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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
  console.error('Unhandled error:', err?.stack || err);
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

(async () => {
  try {
    await initializeDatabase();
    const server = await startServer(PORT, HOST);
    const actualPort = server.address().port;
    process.env.PORT = String(actualPort);

    console.log(`Server running on ${HOST}:${actualPort}`);

    server.on("error", (error) => {
      console.error("Server error during startup:", error);
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${actualPort} is already in use. Use a different PORT or stop the process using that port.`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
})();

