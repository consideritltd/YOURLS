# zipl.uk — Custom URL Shortener

## Overview

Replace YOURLS with a minimal custom Node.js URL shortener. Branded for Consider IT, hosted on Railway with existing MySQL database. Custom domain zipl.uk with SSL already working.

## Stack

- Node.js + Express
- mysql2 (existing Railway MySQL service)
- Server-rendered HTML (no build step, no frontend framework)
- Dockerfile for Railway deployment

## Data Model

### `links`

| Column       | Type         | Notes                          |
|-------------|-------------|--------------------------------|
| id          | INT AUTO_INCREMENT | Primary key               |
| slug        | CHAR(5)     | Unique, A-Z0-9                 |
| url         | TEXT         | Target URL                     |
| created_at  | DATETIME    | Default CURRENT_TIMESTAMP      |
| expires_at  | DATETIME    | created_at + 24 hours          |

### `clicks`

| Column       | Type         | Notes                          |
|-------------|-------------|--------------------------------|
| id          | INT AUTO_INCREMENT | Primary key               |
| link_id     | INT         | FK to links.id                  |
| clicked_at  | DATETIME    | Default CURRENT_TIMESTAMP      |
| referrer    | TEXT        | Request referrer, nullable      |
| country     | CHAR(2)     | From CF-IPCountry header, nullable |
| user_agent  | TEXT        | Request user-agent, nullable    |

## Routes

- `GET /` — Branded landing page with URL shortening form and recent links table
- `POST /shorten` — Accepts URL, generates 5-char slug, returns short link
- `GET /:slug` — Looks up slug, logs click, 301 redirects. Returns 404 if not found or expired.

## Slug Generation

- 5 characters from `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789` (36^5 = ~60M combinations)
- Generated with `crypto.randomBytes`, mapped to charset
- Unique constraint on `slug` column; retry on collision (INSERT fails → regenerate)

## Link Expiry

- Links expire 24 hours after creation
- Redirect returns 404 for expired links
- Periodic cleanup deletes expired rows from `links` table only
- Click data in `clicks` table is retained indefinitely
- Cleanup runs via `setInterval` on app startup (e.g. every hour)

## Frontend

Single branded page at `/`:

- Reuses existing Consider IT branding: navy #0B1E3F, orange #F36C2C, Poppins font, CIT logo
- Navy gradient background, white card, centered layout
- URL input field + orange "Shorten" button
- On submit: POST to `/shorten`, short link appears below with "Copy" button
- Below form: table of recent links (slug, target URL, click count, time remaining)
- Clicking a row expands to show last 50 clicks (timestamp, referrer, country)
- No login, no auth, no separate admin page

## Country Detection

- Uses Cloudflare `CF-IPCountry` header (free, requires Cloudflare proxy)
- Falls back to null if header not present

## What's Excluded

- No authentication or login
- No API
- No custom slugs
- No link editing or deletion
- No QR codes

## Deployment

- Railway with existing MySQL service
- Port from `PORT` env var (default 8080)
- Dockerfile: `node:20-alpine`, `npm ci --production`, `CMD ["node", "server.js"]`
- Env vars: `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` (already configured on Railway)
- Auto-creates tables on startup if they don't exist

## Branding Assets

Reuse from existing `user/plugins/considerit-brand/assets/`:
- `logo.png` — CIT logo
- `favicon.ico`, `apple-touch-icon.png`, etc.
- Will be moved to a `public/` directory in the new structure
