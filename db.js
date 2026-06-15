const mysql = require('mysql2/promise');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQLHOST || 'localhost',
      port: parseInt(process.env.MYSQLPORT || '3306', 10),
      user: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD || '',
      database: process.env.MYSQLDATABASE || 'railway',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

async function initTables() {
  const p = getPool();
  await p.execute(`
    CREATE TABLE IF NOT EXISTS links (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug CHAR(5) NOT NULL UNIQUE,
      url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      hidden TINYINT(1) DEFAULT 0
    )
  `);
  await p.execute(`
    ALTER TABLE links ADD COLUMN hidden TINYINT(1) DEFAULT 0
  `).catch(err => {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err;
  });
  await p.execute(`
    CREATE TABLE IF NOT EXISTS clicks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      link_id INT NOT NULL,
      clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      referrer TEXT,
      country CHAR(2),
      user_agent TEXT,
      FOREIGN KEY (link_id) REFERENCES links(id)
    )
  `);
}

module.exports = { getPool, initTables };
