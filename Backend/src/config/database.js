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

    console.log('✅ Database initialized: users & categories tables created/verified');
  } catch (error) {
    console.error('Database initialization error:', error.message);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { initializeDatabase };
