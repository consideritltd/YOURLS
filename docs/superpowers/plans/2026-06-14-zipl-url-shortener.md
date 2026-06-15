# zipl.uk URL Shortener Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace YOURLS with a custom Node.js URL shortener at zipl.uk with Consider IT branding, 24-hour link expiry, and rich click tracking.

**Architecture:** Express app with mysql2 for database access. Server-rendered HTML with inline CSS (no build step). Auto-creates tables on startup. Single-page UI for link creation with expandable click details. Periodic cleanup of expired links.

**Tech Stack:** Node.js 20, Express, mysql2, crypto (stdlib)

---

### Task 1: Clean Out YOURLS and Scaffold Node.js Project

**Files:**
- Delete: all PHP files, `composer.*`, `phpunit.*`, `.htaccess`, `nginx.conf`, `start.sh`, `admin/`, `css/`, `images/`, `includes/`, `js/`, `tests/`, `user/` (except branding assets), `.github/`, sample files, `readme.html`, `CHANGELOG.md`, `.editorconfig`, `.gitattributes`, `.git-blame-ignore-revs`
- Keep: `Dockerfile`, `railway.toml`, `LICENSE`, `README.md`, `docs/`
- Create: `package.json`, `public/` (with branding assets moved in), `.gitignore`

- [ ] **Step 1: Copy branding assets out before cleanup**

```bash
mkdir -p /tmp/zipl-assets
cp user/plugins/considerit-brand/assets/* /tmp/zipl-assets/
```

- [ ] **Step 2: Delete all YOURLS files and directories**

```bash
# PHP files
rm -f index.php yourls-api.php yourls-go.php yourls-infos.php yourls-loader.php
rm -f composer.json composer.lock phpunit.xml.dist .htaccess nginx.conf start.sh
rm -f readme.html CHANGELOG.md .editorconfig .gitattributes .git-blame-ignore-revs
rm -f sample-public-api.txt sample-public-front-page.txt sample-remote-api-call.txt sample-robots.txt

# Directories
rm -rf admin/ css/ images/ includes/ js/ tests/ user/ .github/
```

- [ ] **Step 3: Create public directory with branding assets**

```bash
mkdir -p public
cp /tmp/zipl-assets/* public/
rm -rf /tmp/zipl-assets
```

- [ ] **Step 4: Create package.json**

```json
{
  "name": "zipl",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node server.js",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^4.21.0",
    "mysql2": "^3.11.0"
  }
}
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
.DS_Store
.env
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Remove YOURLS, scaffold Node.js project"
```

---

### Task 2: Database Module

**Files:**
- Create: `db.js`
- Create: `test/db.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/db.test.js`:

```js
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');

describe('db', () => {
  it('exports getPool and initTables functions', () => {
    const db = require('../db');
    assert.strictEqual(typeof db.getPool, 'function');
    assert.strictEqual(typeof db.initTables, 'function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../db'`

- [ ] **Step 3: Write db.js**

Create `db.js`:

```js
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
      expires_at DATETIME NOT NULL
    )
  `);
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add db.js test/db.test.js
git commit -m "Add database module with auto-creating tables"
```

---

### Task 3: Slug Generation

**Files:**
- Create: `slug.js`
- Create: `test/slug.test.js`

- [ ] **Step 1: Write the failing tests**

Create `test/slug.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { generateSlug } = require('../slug');

describe('generateSlug', () => {
  it('returns a 5-character string', () => {
    const slug = generateSlug();
    assert.strictEqual(slug.length, 5);
  });

  it('only contains A-Z and 0-9', () => {
    for (let i = 0; i < 100; i++) {
      const slug = generateSlug();
      assert.match(slug, /^[A-Z0-9]{5}$/);
    }
  });

  it('generates different slugs on successive calls', () => {
    const slugs = new Set();
    for (let i = 0; i < 50; i++) {
      slugs.add(generateSlug());
    }
    assert.ok(slugs.size > 45, `Expected >45 unique slugs, got ${slugs.size}`);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../slug'`

- [ ] **Step 3: Write slug.js**

Create `slug.js`:

```js
const crypto = require('node:crypto');

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateSlug() {
  const bytes = crypto.randomBytes(5);
  let slug = '';
  for (let i = 0; i < 5; i++) {
    slug += CHARSET[bytes[i] % CHARSET.length];
  }
  return slug;
}

module.exports = { generateSlug };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS (all 3 tests)

- [ ] **Step 5: Commit**

```bash
git add slug.js test/slug.test.js
git commit -m "Add slug generation with crypto.randomBytes"
```

---

### Task 4: Link Service (Create + Lookup + Cleanup)

**Files:**
- Create: `links.js`
- Create: `test/links.test.js`

- [ ] **Step 1: Write the failing tests**

Create `test/links.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('links module', () => {
  it('exports createLink, getLink, getRecentLinks, recordClick, getClicks, cleanupExpired', () => {
    const links = require('../links');
    assert.strictEqual(typeof links.createLink, 'function');
    assert.strictEqual(typeof links.getLink, 'function');
    assert.strictEqual(typeof links.getRecentLinks, 'function');
    assert.strictEqual(typeof links.recordClick, 'function');
    assert.strictEqual(typeof links.getClicks, 'function');
    assert.strictEqual(typeof links.cleanupExpired, 'function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../links'`

- [ ] **Step 3: Write links.js**

Create `links.js`:

```js
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
    LIMIT 50
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add links.js test/links.test.js
git commit -m "Add link service: create, lookup, clicks, cleanup"
```

---

### Task 5: HTML Template

**Files:**
- Create: `views.js`

- [ ] **Step 1: Create views.js**

This module exports a function that returns the full HTML page. No test needed — it's a template.

Create `views.js`:

```js
function renderPage({ links = [], message = null, shortUrl = null }) {
  const linkRows = links.map(l => {
    const expiresAt = new Date(l.expires_at);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.round((expiresAt - now) / 3600000));
    return `
      <tr class="link-row" data-link-id="${l.id}">
        <td class="slug-cell"><a href="/${l.slug}" target="_blank">${l.slug}</a></td>
        <td class="url-cell" title="${escapeHtml(l.url)}">${escapeHtml(truncate(l.url, 50))}</td>
        <td>${l.click_count}</td>
        <td>${hoursLeft}h</td>
      </tr>
      <tr class="click-detail-row" id="details-${l.id}" style="display:none">
        <td colspan="4"><div class="click-details">Loading...</div></td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>zipl.uk — URL Shortener by Consider IT</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #0B1E3F 0%, #0F2650 60%, #1a3a6a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0B1E3F;
      padding: 24px;
    }
    .container {
      background: #fff;
      border-radius: 16px;
      padding: 48px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
    }
    .logo { height: 48px; margin-bottom: 12px; }
    .brand { font-size: 36px; font-weight: 800; color: #0B1E3F; margin-bottom: 4px; letter-spacing: -1px; }
    .brand span { color: #F36C2C; }
    .tagline { color: #5A6678; font-size: 14px; margin-bottom: 32px; }
    .form-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .form-row input {
      flex: 1; padding: 12px 16px; border: 2px solid #E2E8F0; border-radius: 8px;
      font-family: 'Poppins', sans-serif; font-size: 15px; outline: none;
    }
    .form-row input:focus { border-color: #F36C2C; }
    .btn {
      background: #F36C2C; color: #fff; border: none; font-weight: 600;
      padding: 12px 24px; border-radius: 8px; font-size: 15px; cursor: pointer;
      font-family: 'Poppins', sans-serif; white-space: nowrap;
    }
    .btn:hover { background: #FF7B33; }
    .result {
      background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px;
      padding: 12px 16px; margin-bottom: 24px; display: flex; align-items: center;
      justify-content: space-between; gap: 12px;
    }
    .result a { color: #0B1E3F; font-weight: 600; font-size: 18px; text-decoration: none; }
    .copy-btn {
      background: #0B1E3F; color: #fff; border: none; padding: 8px 16px;
      border-radius: 6px; cursor: pointer; font-family: 'Poppins', sans-serif;
      font-size: 13px; font-weight: 600;
    }
    .copy-btn:hover { background: #1a3a6a; }
    .error { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 12px; margin-bottom: 16px; color: #991B1B; }
    table { width: 100%; border-collapse: collapse; text-align: left; margin-top: 24px; }
    th { font-size: 12px; text-transform: uppercase; color: #5A6678; padding: 8px 12px; border-bottom: 2px solid #E2E8F0; }
    td { padding: 10px 12px; border-bottom: 1px solid #F1F5F9; font-size: 14px; }
    .link-row { cursor: pointer; }
    .link-row:hover { background: #F8FAFC; }
    .slug-cell a { color: #F36C2C; font-weight: 600; text-decoration: none; }
    .url-cell { color: #5A6678; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .click-details { text-align: left; padding: 8px; font-size: 13px; color: #5A6678; }
    .click-details table { margin-top: 4px; }
    .click-details th { font-size: 11px; }
    .click-details td { font-size: 12px; padding: 4px 8px; }
    .footer { margin-top: 32px; font-size: 12px; color: #5A6678; }
    .footer a { color: #F36C2C; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .empty { color: #94A3B8; font-size: 14px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <img src="/logo.png" alt="Consider IT" class="logo">
    <div class="brand">zipl<span>.</span>uk</div>
    <p class="tagline">URL shortener by Consider IT</p>

    <form method="POST" action="/shorten">
      <div class="form-row">
        <input type="url" name="url" placeholder="Paste a long URL here..." required>
        <button type="submit" class="btn">Shorten</button>
      </div>
    </form>

    ${message ? `<div class="error">${escapeHtml(message)}</div>` : ''}

    ${shortUrl ? `
    <div class="result">
      <a href="${escapeHtml(shortUrl)}">${escapeHtml(shortUrl)}</a>
      <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(shortUrl)}');this.textContent='Copied!'">Copy</button>
    </div>` : ''}

    ${links.length > 0 ? `
    <table>
      <thead><tr><th>Short</th><th>Destination</th><th>Clicks</th><th>Expires</th></tr></thead>
      <tbody>${linkRows}</tbody>
    </table>` : '<p class="empty">No active links yet</p>'}

    <div class="footer">A <a href="https://considerit.com">Consider IT</a> service</div>
  </div>

  <script>
    document.querySelectorAll('.link-row').forEach(row => {
      row.addEventListener('click', async (e) => {
        if (e.target.tagName === 'A') return;
        const id = row.dataset.linkId;
        const detailRow = document.getElementById('details-' + id);
        if (detailRow.style.display !== 'none') {
          detailRow.style.display = 'none';
          return;
        }
        detailRow.style.display = '';
        const div = detailRow.querySelector('.click-details');
        try {
          const res = await fetch('/clicks/' + id);
          const clicks = await res.json();
          if (clicks.length === 0) {
            div.innerHTML = 'No clicks yet';
            return;
          }
          div.innerHTML = '<table><thead><tr><th>Time</th><th>Country</th><th>Referrer</th></tr></thead><tbody>'
            + clicks.map(c => '<tr><td>' + new Date(c.clicked_at).toLocaleString() + '</td><td>' + (c.country || '—') + '</td><td>' + (c.referrer || '—') + '</td></tr>').join('')
            + '</tbody></table>';
        } catch { div.innerHTML = 'Failed to load'; }
      });
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g, '&#39;');
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

module.exports = { renderPage };
```

- [ ] **Step 2: Commit**

```bash
git add views.js
git commit -m "Add HTML template with branded UI"
```

---

### Task 6: Express Server

**Files:**
- Create: `server.js`

- [ ] **Step 1: Create server.js**

Create `server.js`:

```js
const express = require('express');
const { getPool, initTables } = require('./db');
const { createLink, getLink, getRecentLinks, recordClick, getClicks, cleanupExpired } = require('./links');
const { renderPage } = require('./views');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/', async (req, res) => {
  try {
    const links = await getRecentLinks();
    res.send(renderPage({ links }));
  } catch (err) {
    console.error('GET / error:', err);
    res.status(500).send(renderPage({ message: 'Database error' }));
  }
});

app.post('/shorten', async (req, res) => {
  const url = req.body.url;
  if (!url) {
    const links = await getRecentLinks();
    return res.status(400).send(renderPage({ links, message: 'URL is required' }));
  }

  try {
    new URL(url);
  } catch {
    const links = await getRecentLinks();
    return res.status(400).send(renderPage({ links, message: 'Invalid URL' }));
  }

  try {
    const slug = await createLink(url);
    const shortUrl = `https://zipl.uk/${slug}`;
    const links = await getRecentLinks();
    res.send(renderPage({ links, shortUrl }));
  } catch (err) {
    console.error('POST /shorten error:', err);
    const links = await getRecentLinks();
    res.status(500).send(renderPage({ links, message: 'Failed to create link' }));
  }
});

app.get('/clicks/:id', async (req, res) => {
  try {
    const clicks = await getClicks(parseInt(req.params.id, 10));
    res.json(clicks);
  } catch (err) {
    console.error('GET /clicks error:', err);
    res.status(500).json([]);
  }
});

app.get('/:slug', async (req, res) => {
  const slug = req.params.slug.toUpperCase();
  if (!/^[A-Z0-9]{5}$/.test(slug)) return res.status(404).send('Not found');

  try {
    const link = await getLink(slug);
    if (!link) return res.status(404).send('Not found');

    recordClick(link.id, {
      referrer: req.get('referer') || null,
      country: req.get('cf-ipcountry') || null,
      userAgent: req.get('user-agent') || null,
    }).catch(err => console.error('Click tracking error:', err));

    res.redirect(301, link.url);
  } catch (err) {
    console.error('GET /:slug error:', err);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 8080;

async function start() {
  await initTables();
  console.log('Tables ready');

  setInterval(async () => {
    try {
      const deleted = await cleanupExpired();
      if (deleted > 0) console.log(`Cleaned up ${deleted} expired links`);
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  }, 3600000);

  app.listen(PORT, () => console.log(`zipl.uk listening on port ${PORT}`));
}

start().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add server.js
git commit -m "Add Express server with routes and cleanup"
```

---

### Task 7: Dockerfile and Railway Config

**Files:**
- Modify: `Dockerfile`
- Modify: `railway.toml`

- [ ] **Step 1: Update Dockerfile**

Replace `Dockerfile` contents:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
```

- [ ] **Step 2: Update railway.toml**

Replace `railway.toml` contents:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
healthcheckPath = "/"
healthcheckTimeout = 300
```

- [ ] **Step 3: Commit**

```bash
git add Dockerfile railway.toml
git commit -m "Update Dockerfile and railway.toml for Node.js"
```

---

### Task 8: Local Smoke Test and Deploy

- [ ] **Step 1: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 2: Test locally (without DB — just verify it starts and serves static assets)**

```bash
# Quick check that the module loads without syntax errors
node -e "require('./views'); require('./slug'); console.log('Modules OK')"
```

Expected: `Modules OK`

- [ ] **Step 3: Commit all remaining files and push**

```bash
git add -A
git status
git commit -m "Ready for deployment"
git push
```

Expected: Railway auto-deploys. Visit https://zipl.uk to verify the branded page loads, create a short link, and test the redirect.
