// The whole model, in one small file with no dependencies.
// SCS curve-number method (USDA TR-55), run per land cover for one day of rain.
(function (root) {
  var BASIN_KM2 = 1370; // approximate drainage area of the Cagayan de Oro river basin

  // Curve numbers for "good condition" ground on medium-draining (group B) soil.
  var COVERS = [
    { id: 'forest', name: 'Forest', cn: 55 },
    { id: 'grass', name: 'Grass and pasture', cn: 61 },
    { id: 'crops', name: 'Row crops', cn: 78 },
    { id: 'town', name: 'Town, roads and paving', cn: 92 }
  ];

  var WETNESS = {
    dry: 'Dry',
    average: 'Average',
    soaked: 'Soaked'
  };

  // Antecedent moisture: shift the average-condition curve number.
  function adjustCN(cn, wetness) {
    if (wetness === 'dry') return (4.2 * cn) / (10 - 0.058 * cn);
    if (wetness === 'soaked') return (23 * cn) / (10 + 0.13 * cn);
    return cn;
  }

  // Potential retention S in mm: how much the ground can hold once saturated.
  function retention(cn) {
    return 25400 / cn - 254;
  }

  // Runoff depth Q in mm for rain P in mm.
  function runoffDepth(p, cn) {
    var s = retention(cn);
    var ia = 0.2 * s;
    if (p <= ia) return 0;
    return Math.pow(p - ia, 2) / (p + 0.8 * s);
  }

  // mix: percentages that sum to 100, keyed by cover id.
  function simulate(p, wetness, mix) {
    var rows = COVERS.map(function (c) {
      var cn = adjustCN(c.cn, wetness);
      var s = retention(cn);
      return {
        id: c.id,
        name: c.name,
        share: mix[c.id],
        cn: c.cn,
        cnAdjusted: cn,
        s: s,
        ia: 0.2 * s,
        q: runoffDepth(p, cn)
      };
    });
    var q = rows.reduce(function (sum, r) { return sum + (r.share / 100) * r.q; }, 0);
    return {
      rain: p,
      runoff: q,
      kept: p - q,
      fraction: p > 0 ? q / p : 0,
      volumeMillionM3: (q * BASIN_KM2) / 1000, // 1 mm over 1 km2 is 1,000 m3
      rows: rows
    };
  }

  // Change one cover's share and scale the others so the total stays 100.
  function rebalance(mix, id, value) {
    var v = Math.max(0, Math.min(100, Math.round(value)));
    var others = COVERS.filter(function (c) { return c.id !== id; });
    var rest = 100 - v;
    var restNow = others.reduce(function (sum, c) { return sum + mix[c.id]; }, 0);
    var raw = others.map(function (c) {
      return restNow > 0 ? (mix[c.id] / restNow) * rest : rest / others.length;
    });
    // Largest-remainder rounding so the shares are whole numbers that sum to 100.
    var floors = raw.map(Math.floor);
    var left = rest - floors.reduce(function (a, b) { return a + b; }, 0);
    raw
      .map(function (r, i) { return { i: i, frac: r - Math.floor(r) }; })
      .sort(function (a, b) { return b.frac - a.frac; })
      .slice(0, left)
      .forEach(function (o) { floors[o.i] += 1; });
    var next = {};
    next[id] = v;
    others.forEach(function (c, i) { next[c.id] = floors[i]; });
    return next;
  }

  var api = {
    BASIN_KM2: BASIN_KM2,
    COVERS: COVERS,
    WETNESS: WETNESS,
    adjustCN: adjustCN,
    retention: retention,
    runoffDepth: runoffDepth,
    simulate: simulate,
    rebalance: rebalance
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Runoff = api;
})(this);
