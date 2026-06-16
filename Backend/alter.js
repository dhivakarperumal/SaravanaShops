const pool = require('./src/config/db');

async function run() {
  try {
    await pool.query('ALTER TABLE categories ADD COLUMN productType VARCHAR(50)');
    console.log('ALTER TABLE SUCCESS');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists, ignoring.');
    } else {
      console.error(err);
    }
  } finally {
    process.exit();
  }
}

run();
