const express = require('express');
const rateLimit = require('express-rate-limit');
const { initTables } = require('./db');
const { createLink, getLink, recordClick, cleanupExpired } = require('./links');
const { renderPage, renderRedirect } = require('./views');

const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

const shortenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many links created, try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (req, res) => {
  res.send('ok');
});

app.get('/', async (req, res) => {
  res.send(renderPage({}));
});

app.post('/shorten', shortenLimiter, async (req, res) => {
  const token = req.body['cf-turnstile-response'];
  if (process.env.TURNSTILE_SECRET) {
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET, response: token }),
    });
    const result = await verify.json();
    if (!result.success) {
      const links = await getRecentLinks();
      return res.status(403).send(renderPage({ links, message: 'Verification failed' }));
    }
  }

  const url = req.body.url;
  if (!url) {
    return res.status(400).send(renderPage({ message: 'URL is required' }));
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).send(renderPage({ message: 'Invalid URL' }));
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).send(renderPage({ message: 'Only http and https URLs are allowed' }));
  }

  try {
    const slug = await createLink(url);
    const shortUrl = `https://zipl.uk/${slug}`;
    res.send(renderPage({ shortUrl }));
  } catch (err) {
    console.error('POST /shorten error:', err);
    res.status(500).send(renderPage({ message: 'Failed to create link' }));
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

    res.send(renderRedirect({ url: link.url, slug: link.slug }));
  } catch (err) {
    console.error('GET /:slug error:', err);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 8080;

async function start() {
  app.listen(PORT, () => console.log(`zipl.uk listening on port ${PORT}`));

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
}

start().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});
