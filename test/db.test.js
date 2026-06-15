const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('db', () => {
  it('exports getPool and initTables functions', () => {
    const db = require('../db');
    assert.strictEqual(typeof db.getPool, 'function');
    assert.strictEqual(typeof db.initTables, 'function');
  });
});
