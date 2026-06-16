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

    console.log('✅ Database initialized: users, categories & products tables created/verified');
  } catch (error) {
    console.error('Database initialization error:', error.message);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { initializeDatabase };
