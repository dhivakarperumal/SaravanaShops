const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const envPathCandidates = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
];

const envPath = envPathCandidates.find((candidate) => fs.existsSync(candidate));
if (envPath) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const host = process.env.DB_HOST || 'localhost';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'saravanshop_db';
const port = Number(process.env.DB_PORT || 3306);

const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.config = { host, user, password, database, port };

module.exports = pool;