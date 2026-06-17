function renderPage({ message = null, shortUrl = null }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>zipl.uk - URL Shortener by Consider IT</title>
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
      max-width: 780px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
    }
    @media (max-width: 480px) {
      body { padding: 12px; }
      .container { padding: 24px 16px; border-radius: 12px; }
      .brand { font-size: 28px; }
      .form-row { flex-direction: column; }
      .btn { width: 100%; }
      .result { flex-direction: column; text-align: center; }
      .result a { font-size: 15px; word-break: break-all; }
    }
    .logo { height: 72px; margin-bottom: 12px; }
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
    .footer { margin-top: 32px; font-size: 12px; color: #5A6678; }
    .footer a { color: #F36C2C; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
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
      <div class="cf-turnstile" data-sitekey="0x4AAAAAADkl2CT9RD6fUIb0" data-theme="light"></div>
    </form>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

    ${message ? `<div class="error">${escapeHtml(message)}</div>` : ''}

    ${shortUrl ? `
    <div class="result">
      <a href="${escapeHtml(shortUrl)}">${escapeHtml(shortUrl)}</a>
      <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(shortUrl)}');this.textContent='Copied!'">Copy</button>
    </div>` : ''}

    <div class="footer">A <a href="https://considerit.com">Consider IT</a> service</div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g, '&#39;');
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function renderRedirect({ url, slug }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>zipl.uk - Redirecting</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
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
    .logo { height: 72px; margin-bottom: 12px; }
    .brand { font-size: 36px; font-weight: 800; color: #0B1E3F; margin-bottom: 4px; letter-spacing: -1px; }
    .brand span { color: #F36C2C; }
    .label { color: #5A6678; font-size: 14px; margin-bottom: 12px; }
    .dest-url {
      background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;
      padding: 16px; margin-bottom: 24px; word-break: break-all;
      font-size: 14px; color: #0B1E3F; text-align: left;
    }
    .actions { display: flex; gap: 12px; justify-content: center; }
    .btn-continue {
      background: #F36C2C; color: #fff; border: none; font-weight: 600;
      padding: 12px 32px; border-radius: 8px; font-size: 15px; cursor: pointer;
      font-family: 'Poppins', sans-serif; text-decoration: none;
    }
    .btn-continue:hover { background: #FF7B33; }
    .btn-back {
      background: #E2E8F0; color: #0B1E3F; border: none; font-weight: 600;
      padding: 12px 32px; border-radius: 8px; font-size: 15px; cursor: pointer;
      font-family: 'Poppins', sans-serif; text-decoration: none;
    }
    .btn-back:hover { background: #CBD5E1; }
    .footer { margin-top: 32px; font-size: 12px; color: #5A6678; }
    .footer a { color: #F36C2C; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    @media (max-width: 480px) {
      body { padding: 12px; }
      .container { padding: 24px 16px; border-radius: 12px; }
      .brand { font-size: 28px; }
      .actions { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="/logo.png" alt="Consider IT" class="logo">
    <div class="brand">zipl<span>.</span>uk</div>
    <p class="label">You are about to be redirected to:</p>
    <div class="dest-url">${escapeHtml(url)}</div>
    <div class="actions">
      <a href="${escapeHtml(url)}" class="btn-continue" id="continue-btn">Continue</a>
      <a href="/" class="btn-back">Go back</a>
    </div>
    <div class="footer">A <a href="https://considerit.com">Consider IT</a> service</div>
  </div>
</body>
</html>`;
}

module.exports = { renderPage, renderRedirect };
