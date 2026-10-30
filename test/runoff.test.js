const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../runoff.js');

const near = (a, b, eps = 0.05) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test('no runoff until the initial loss is filled', () => {
  assert.equal(R.runoffDepth(10, 55), 0);
  assert.ok(R.runoffDepth(60, 55) > 0);
});

test('matches a hand calculation for CN 78 and 120 mm', () => {
  // S = 71.6 mm, Ia = 14.3 mm, Q = 105.7^2 / 177.3
  near(R.runoffDepth(120, 78), 63.0, 0.1);
});

test('paved ground sheds more than forest in the same storm', () => {
  assert.ok(R.runoffDepth(120, 92) > R.runoffDepth(120, 55) * 3);
});

test('wetness moves the curve number the right way', () => {
  assert.ok(R.adjustCN(78, 'dry') < 78);
  assert.ok(R.adjustCN(78, 'soaked') > 78);
});

test('simulate is the share-weighted mean of the covers', () => {
  const mix = { forest: 30, grass: 25, crops: 35, town: 10 };
  const r = R.simulate(120, 'average', mix);
  near(r.runoff, 45.9, 0.2);
  near(r.volumeMillionM3, 62.9, 0.4);
  near(r.runoff + r.kept, 120, 1e-9);
});

test('rebalance always sums to 100 with whole numbers', () => {
  let mix = { forest: 30, grass: 25, crops: 35, town: 10 };
  for (const [id, v] of [['town', 63], ['forest', 100], ['crops', 0], ['grass', 41], ['forest', 7]]) {
    mix = R.rebalance(mix, id, v);
    const sum = Object.values(mix).reduce((a, b) => a + b, 0);
    assert.equal(sum, 100);
    assert.ok(Object.values(mix).every(Number.isInteger));
    assert.equal(mix[id], v);
  }
});
