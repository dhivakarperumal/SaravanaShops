const pool = require('./db');

async function initializeDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();

    // ── Users table ──────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // ── Categories table ─────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        catId VARCHAR(20) NOT NULL UNIQUE,
        cname VARCHAR(255) NOT NULL,
        cdescription TEXT,
        cimgs LONGTEXT,
        subcategories TEXT,
        productType VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // ── Products table ───────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        productId VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        notes TEXT,
        mrp DECIMAL(10,2),
        offer DECIMAL(10,2),
        sellingprice DECIMAL(10,2),
        sellingpriceManually BOOLEAN DEFAULT false,
        rating DECIMAL(3,1) DEFAULT 0.0,
        category VARCHAR(100),
        subcategory VARCHAR(100),
        productType VARCHAR(50) NOT NULL,
        count VARCHAR(50),
        stock INT,
        colors LONGTEXT,
        images LONGTEXT,
        fabricdetails LONGTEXT,
        list_of_items LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // ── Razorpay Keys table ──────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS razorpay_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        key_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // ── Reviews table ───────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        category VARCHAR(255),
        user VARCHAR(255),
        rating DECIMAL(3,1) DEFAULT 0.0,
        reviews INT DEFAULT 0,
        rate DECIMAL(3,1) DEFAULT 0.0,
        ` + "`desc`" + ` TEXT,
        image LONGTEXT,
        tick BOOLEAN DEFAULT FALSE,
        date VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // ── Orders table ──────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderId VARCHAR(50) NOT NULL UNIQUE,
        subtotal DECIMAL(10,2) DEFAULT 0.0,
        shippingCost DECIMAL(10,2) DEFAULT 0.0,
        total DECIMAL(10,2) DEFAULT 0.0,
        status VARCHAR(50) DEFAULT 'Pending',
        ordertype VARCHAR(50) DEFAULT 'Shop',
        shipping_name VARCHAR(255),
        shipping_email VARCHAR(255),
        shipping_phone VARCHAR(20),
        shipping_address TEXT,
        shipping_city VARCHAR(100),
        shipping_state VARCHAR(100),
        shipping_zip VARCHAR(20),
        shipping_country VARCHAR(100),
        clientCreatedAt DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // ── Order Items table ─────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        product_id VARCHAR(50),
        product_name VARCHAR(255),
        category VARCHAR(100),
        subcategory VARCHAR(100),
        size VARCHAR(50),
        color VARCHAR(50),
        image TEXT,
        mrp DECIMAL(10,2),
        price DECIMAL(10,2),
        quantity INT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // ── Invoices table ────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoiceNo VARCHAR(100) NOT NULL,
        invoiceDate DATE,
        invoiceValue DECIMAL(12,2),
        invoiceGSTValue DECIMAL(12,2),
        invoiceTotalValue DECIMAL(12,2),
        transportAmount DECIMAL(12,2),
        billPdfBase64 LONGTEXT,
        billPdfName VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // ── Dealers table ─────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS dealers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dealerId VARCHAR(50) NOT NULL,
        dealerName VARCHAR(255) NOT NULL,
        gstNumber VARCHAR(100),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        invoiceNumber VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database initialized: users, categories, products, razorpay_keys, orders, invoices & dealers tables created/verified');
  } catch (error) {
    console.error('Database initialization error:', error.message);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { initializeDatabase };
