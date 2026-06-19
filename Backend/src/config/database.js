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
        reviews LONGTEXT,
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

      // ── Product-specific reviews table ─────────────────────────
      await connection.query(`
        CREATE TABLE IF NOT EXISTS product_reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id VARCHAR(50) NOT NULL,
          user_id VARCHAR(255),
          userName VARCHAR(255),
          rating DECIMAL(3,1) DEFAULT 0.0,
          review TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

    // ── Videos table ───────────────────────────────────
    await connection.query(`
  CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    url LONGTEXT NOT NULL,
    file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);

    // ── Videos table ───────────────────────────────────
    await connection.query(`
  CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    url LONGTEXT NOT NULL,
    file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);

    // ── Orders table ──────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderId VARCHAR(50) NOT NULL UNIQUE,
        user_id VARCHAR(255),
        subtotal DECIMAL(10,2) DEFAULT 0.0,
        shippingCost DECIMAL(10,2) DEFAULT 0.0,
        total DECIMAL(10,2) DEFAULT 0.0,
        status VARCHAR(50) DEFAULT 'Pending',
        ordertype VARCHAR(50) DEFAULT 'Shop',
        docketNumber VARCHAR(255),
        qname VARCHAR(255),
        cancelReasons TEXT,
        cancelledAt DATETIME,
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

    // Safely add user_id to existing orders table if it doesn't exist
    try {
      await connection.query(`
        SELECT user_id FROM orders LIMIT 1;
      `);
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') {
        await connection.query(`ALTER TABLE orders ADD COLUMN user_id VARCHAR(255) AFTER orderId`);
      }
    }

    // Safely add courier and cancellation fields to existing orders table if they don't exist
    const safeAlterColumns = [
      { name: 'docketNumber', definition: 'VARCHAR(255)' },
      { name: 'qname', definition: 'VARCHAR(255)' },
      { name: 'cancelReasons', definition: 'TEXT' },
      { name: 'cancelledAt', definition: 'DATETIME' }
    ];

    for (const column of safeAlterColumns) {
      try {
        await connection.query(`SELECT ${column.name} FROM orders LIMIT 1`);
      } catch (e) {
        if (e.code === 'ER_BAD_FIELD_ERROR') {
          await connection.query(`ALTER TABLE orders ADD COLUMN ${column.name} ${column.definition}`);
        }
      }
    }

    try {
      await connection.query(`SELECT reviews FROM products LIMIT 1`);
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') {
        await connection.query(`ALTER TABLE products ADD COLUMN reviews LONGTEXT`);
      }
    }

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

    // ── Addresses table ─────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        firstname VARCHAR(100),
        lastname VARCHAR(100),
        contact VARCHAR(20),
        doorNumber VARCHAR(50),
        streetName VARCHAR(255),
        address TEXT,
        landmark VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        pin VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // ── Cart table ─────────────────────────────────────
    await connection.query(`
  CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(50) NOT NULL,

    product_name VARCHAR(255),
    image LONGTEXT,

    mrp DECIMAL(10,2) DEFAULT 0,
    sellingprice DECIMAL(10,2) DEFAULT 0,

    quantity INT DEFAULT 1,

    category VARCHAR(100),
    subcategory VARCHAR(100),

    size VARCHAR(50),
    color VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id)
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
