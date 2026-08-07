const pool = require('./src/config/db');

async function createOtpsTable() {
  try {
    const connection = await pool.getConnection();
    
    // Create otps table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.query(createTableQuery);
    console.log('Successfully created otps table.');
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
}

createOtpsTable();
