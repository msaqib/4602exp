const test = require('node:test');
const assert = require('node:assert/strict');
const { getMetadata, normalizeTags } = require('../todo-metadata.js');

test('normalizeTags preserves comma inside array entries when passed an array', () => {
  assert.deepEqual(
    normalizeTags(['last,first', 'other']),
    ['last,first', 'other']
  );
});

test('getMetadata preserves a stored tag that contains a comma', () => {
  assert.deepEqual(
    getMetadata({ tags: ['family,home'] }),
    { dueDate: '', tags: ['family,home'] }
  );
});
