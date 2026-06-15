const { getPool } = require('./db');
const { generateSlug } = require('./slug');

async function createLink(url) {
  const pool = getPool();
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    const slug = generateSlug();
    try {
      await pool.execute(
        'INSERT INTO links (slug, url, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
        [slug, url]
      );
      return slug;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' && i < maxRetries - 1) continue;
      throw err;
    }
  }
}

async function getLink(slug) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM links WHERE slug = ? AND expires_at > NOW()',
    [slug]
  );
  return rows[0] || null;
}

async function getRecentLinks() {
  const pool = getPool();
  const [rows] = await pool.execute(`
    SELECT l.*, COUNT(c.id) AS click_count
    FROM links l
    LEFT JOIN clicks c ON c.link_id = l.id
    WHERE l.expires_at > NOW()
    GROUP BY l.id
    ORDER BY l.created_at DESC
    LIMIT 5
  `);
  return rows;
}

async function recordClick(linkId, { referrer, country, userAgent }) {
  const pool = getPool();
  await pool.execute(
    'INSERT INTO clicks (link_id, referrer, country, user_agent) VALUES (?, ?, ?, ?)',
    [linkId, referrer || null, country || null, userAgent || null]
  );
}

async function getClicks(linkId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT clicked_at, referrer, country, user_agent FROM clicks WHERE link_id = ? ORDER BY clicked_at DESC LIMIT 50',
    [linkId]
  );
  return rows;
}

async function cleanupExpired() {
  const pool = getPool();
  const [result] = await pool.execute('DELETE FROM links WHERE expires_at <= NOW()');
  return result.affectedRows;
}

module.exports = { createLink, getLink, getRecentLinks, recordClick, getClicks, cleanupExpired };
