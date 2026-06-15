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
