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
