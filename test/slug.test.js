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
