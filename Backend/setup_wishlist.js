const pool = require('./src/config/db');

const sql = `
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255),
  image LONGTEXT,
  mrp DECIMAL(10,2) DEFAULT 0.00,
  sellingprice DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY user_product (user_id, product_id)
)
`;

pool.query(sql)
  .then(() => {
    console.log('Wishlist table created');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
