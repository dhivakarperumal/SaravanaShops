const pool = require('./db');

// Create users table with UUID and status fields
async function initializeDatabase() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

    const connection = await pool.getConnection();
    await connection.query(createTableQuery);
    connection.release();
    
    console.log('✅ Database initialized: users table created/verified');
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }
}

module.exports = { initializeDatabase };
