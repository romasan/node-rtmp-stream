const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });
const { findRepoRoot } = require('../repoRoot.ts');

test('finds the repository from source and compiled output locations', () => {
  const root = path.resolve(__dirname, '../../..');
  assert.equal(findRepoRoot(path.join(root, 'apps/server')), root);
  assert.equal(findRepoRoot(path.join(root, 'lib/utils')), root);
});
