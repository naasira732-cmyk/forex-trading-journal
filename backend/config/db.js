const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'forex_trading_journal',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
});

/**
 * Initialize database schema if database/tables don't exist
 */
async function initDatabase() {
  let initialConnection;
  try {
    // First connect without specifying database to ensure database exists
    initialConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      multipleStatements: true
    });

    const dbName = process.env.DB_NAME || 'forex_trading_journal';
    await initialConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await initialConnection.end();

    // Now verify connection to the target database and run schema script
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      const connection = await pool.getConnection();
      try {
        // Execute schema definitions
        const statements = schemaSql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));

        for (const statement of statements) {
          await connection.query(statement);
        }

        const [tradeImageColumn] = await connection.query("SHOW COLUMNS FROM trades LIKE 'image_data'");
        if (tradeImageColumn.length === 0) {
          await connection.query('ALTER TABLE trades ADD COLUMN image_data MEDIUMTEXT NULL AFTER notes');
        }

        console.log('✅ Database schema verified and tables ready.');
      } finally {
        connection.release();
      }
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  initDatabase
};
