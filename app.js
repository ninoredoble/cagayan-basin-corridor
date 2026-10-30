// Draws the plate and wires the controls. The model itself lives in runoff.js.
(function () {
  'use strict';
  var R = window.Runoff;
  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  var STATE = {
    rain: 120,
    wetness: 'average',
    mix: { forest: 30, grass: 25, crops: 35, town: 10 }
  };
  var COLORS = { forest: '#3a6b45', grass: '#8fa85a', crops: '#c09a45', town: '#7b7f83' };

  // ---------- small helpers ----------
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function fmt(n, d) { return n.toFixed(d === undefined ? 0 : d); }
  function mixColor(a, b, t) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); });
    var pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return 'rgb(' + pa.map(function (v, i) { return Math.round(v + (pb[i] - v) * t); }).join(',') + ')';
  }

  // ---------- plate geometry ----------
  // The slope runs from the ridge (x = 0) to the river mouth (x = 700).
  function ground(x) {
    if (x <= 640) {
      var t = x / 640;
      return 150 + 215 * (1 - Math.pow(1 - t, 2.4));
    }
    return 365 + (7 * (x - 640)) / 60;
  }
  function samples(a, b, step) {
    var pts = [];
    for (var x = a; x < b; x += step) pts.push(x);
    pts.push(b);
    return pts;
  }
  function slopePoints(a, b, dy) {
    return samples(a, b, 8).map(function (x) { return [x, ground(x) + (dy || 0)]; });
  }
  function poly(pts) { return pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L'); }

  function buildStatic() {
    var surface = slopePoints(0, 700, 0);
    // Above-ground clip for the rain.
    var above = [[0, 0], [860, 0], [860, 372], [700, 372]].concat(surface.slice().reverse());
    $('above-ground-path').setAttribute('d', 'M' + poly(above) + ' Z');
    // Earth body.
    var earth = surface.concat([[700, 480], [0, 480]]);
    var d = 'M' + poly(earth) + ' Z';
    $('earth').setAttribute('d', d);
    $('soil-clip-path').setAttribute('d', d);
  }

  // ---------- land cover ----------
  function renderCover() {
    var bands = $('cover-bands'), glyphs = $('cover-glyphs');
    clear(bands); clear(glyphs);
    var x0 = 0;
    R.COVERS.forEach(function (c, ci) {
      var w = (STATE.mix[c.id] / 100) * 700;
      if (w <= 0.5) return;
      var x1 = Math.min(700, x0 + w);
      var top = slopePoints(x0, x1, 0);
      var bottom = slopePoints(x0, x1, 22).reverse();
      el('path', { d: 'M' + poly(top.concat(bottom)) + ' Z', fill: COLORS[c.id] }, bands);
      var rand = rng(11 + ci * 97);
      drawGlyphs(c.id, x0, x1, rand, glyphs);
      x0 = x1;
    });
  }

  function drawGlyphs(id, a, b, rand, parent) {
    var step = { forest: 12, grass: 9, crops: 11, town: 17 }[id];
    for (var x = a + step / 2; x < b - 2; x += step) {
      var jx = x + (rand() - 0.5) * step * 0.5;
      var y = ground(jx);
      if (id === 'forest') {
        var r = 6 + rand() * 5;
        el('rect', { x: jx - 1.2, y: y - r * 0.7, width: 2.4, height: r * 0.9 + 3, fill: '#2a3f2d' }, parent);
        el('circle', { cx: jx, cy: y - r - 3, r: r, fill: rand() > 0.5 ? '#2c5a38' : '#285032' }, parent);
      } else if (id === 'grass') {
        var h = 6 + rand() * 4;
        el('path', { d: 'M' + (jx - 3) + ' ' + y + ' l3 -' + h + ' l3 ' + h + ' M' + jx + ' ' + y + ' l0 -' + (h + 3), stroke: '#5f7a34', 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, parent);
      } else if (id === 'crops') {
        el('ellipse', { cx: jx, cy: y - 4, rx: 3.2, ry: 4.8, fill: '#9c7424' }, parent);
        el('path', { d: 'M' + (jx - 3) + ' ' + (y - 8) + ' l3 -5 l3 5 M' + jx + ' ' + (y - 8) + ' l0 -7', stroke: '#4d6b2a', 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round' }, parent);
      } else {
        var big = rand() > 0.75;
        var bw = big ? 14 : 9, bh = big ? 14 : 8;
        var tone = rand() > 0.5 ? '#5c6165' : '#9a9ea2';
        el('rect', { x: jx - bw / 2, y: y - bh, width: bw, height: bh + 2, fill: tone }, parent);
        el('path', { d: 'M' + (jx - bw / 2 - 1.5) + ' ' + (y - bh) + ' L' + jx + ' ' + (y - bh - 5) + ' L' + (jx + bw / 2 + 1.5) + ' ' + (y - bh) + ' Z', fill: '#4a4e52' }, parent);
      }
    }
  }

  // ---------- rain, flow, soak ----------
  var RAIN_COUNT = 90, rainLines = [];
  function buildRain() {
    var g = $('rain');
    for (var i = 0; i < RAIN_COUNT; i++) {
      var x = ((i * 0.6180339887) % 1) * 900 - 20;
      var line = el('line', { x1: x, y1: 40 + (i % 7) * 4, x2: x - 70, y2: 480 }, g);
      line.setAttribute('class', 'rain-line');
      line.style.animationDelay = -((i * 137) % 900) / 1000 + 's';
      rainLines.push(line);
    }
  }
  function renderRain(sim) {
    var p = sim.rain;
    var n = p <= 0 ? 0 : Math.round(14 + (RAIN_COUNT - 14) * Math.min(1, p / 220));
    var dash = Math.round(10 + 14 * Math.min(1, p / 200));
    rainLines.forEach(function (l, i) {
      l.style.display = i < n ? '' : 'none';
      l.setAttribute('stroke-width', (1.2 + 1.2 * Math.min(1, p / 200)).toFixed(2));
      l.setAttribute('stroke-dasharray', dash + ' ' + (44 - dash));
      l.setAttribute('stroke-opacity', (0.5 + 0.4 * Math.min(1, p / 150)).toFixed(2));
    });
    $('plate').style.setProperty('--cloud', mixColor('#a9b9bf', '#66797f', Math.min(1, p / 250)));
  }

  var flowLines = [];
  function buildFlow() {
    var g = $('flow');
    var pts = slopePoints(0, 700, -3);
    var d = 'M' + poly(pts);
    [0, 1].forEach(function (i) {
      var path = el('path', { d: d, 'stroke-dasharray': '9 17' }, g);
      path.setAttribute('class', 'flow-line');
      if (i === 1) { path.style.animationDelay = '-0.7s'; path.setAttribute('transform', 'translate(0 -3)'); }
      flowLines.push(path);
    });
  }
  function renderFlow(sim) {
    var strength = Math.min(1, sim.runoff / 120);
    flowLines.forEach(function (l, i) {
      l.setAttribute('stroke-width', (1.2 + 6 * strength * (i ? 0.7 : 1)).toFixed(2));
      l.setAttribute('stroke-opacity', sim.runoff < 0.5 ? 0 : (0.55 + 0.4 * strength).toFixed(2));
    });
  }

  var soakDrops = [];
  function buildSoak() {
    var g = $('soak');
    var rand = rng(5);
    for (var i = 0; i < 46; i++) {
      var x = 8 + ((i * 0.6180339887) % 1) * 684;
      var y = ground(x) + 32 + rand() * 46;
      var d = el('line', { x1: x, y1: y, x2: x, y2: y + 7, 'stroke-width': 2 }, g);
      d.setAttribute('class', 'soak-drop');
      d.style.animationDelay = -rand() * 2.4 + 's';
      soakDrops.push(d);
    }
  }
  function renderSoak(sim) {
    var share = sim.rain > 0 ? sim.kept / sim.rain : 0;
    var n = Math.round(soakDrops.length * Math.min(1, share * Math.min(1, sim.rain / 60)));
    soakDrops.forEach(function (d, i) { d.style.display = i < n ? '' : 'none'; });
  }

  // ---------- river, plume, gauges ----------
  function renderRiver(sim) {
    var k = Math.min(1, sim.runoff / 150);
    var thick = 3 + 9 * k;
    var pts = samples(606, 700, 8).map(function (x) { return [x, ground(x) + 14 - thick]; });
    var base = samples(606, 700, 8).map(function (x) { return [x, ground(x) + 15]; }).reverse();
    var river = $('river');
    river.setAttribute('d', 'M' + poly(pts.concat(base)) + ' Z');
    river.setAttribute('fill', mixColor('#3f7fa9', '#b0743a', Math.min(1, sim.runoff / 90)));
    var plume = $('plume');
    plume.setAttribute('rx', (8 + 78 * k).toFixed(1));
    plume.setAttribute('ry', (5 + 38 * k).toFixed(1));
    plume.setAttribute('fill-opacity', sim.runoff < 0.5 ? 0 : (0.3 + 0.5 * k).toFixed(2));
  }

  var TUBE = { top: 96, bottom: 366, max: 300 };
  var gaugeFills = {};
  function buildGauges() {
    var g = $('gauges');
    var h = TUBE.bottom - TUBE.top;
    [{ id: 'rain', x: 716, color: '#3f7fa9' }, { id: 'runoff', x: 764, color: '#8a4e24' }].forEach(function (t) {
      el('rect', { x: t.x - 5, y: TUBE.bottom, width: 38, height: 6, fill: '#15211c' }, g);
      el('rect', { x: t.x, y: TUBE.top, width: 28, height: h, fill: '#f1f5ee' }, g);
      gaugeFills[t.id] = el('rect', { x: t.x, y: TUBE.bottom, width: 28, height: 0, fill: t.color }, g);
      for (var mm = 50; mm < TUBE.max; mm += 50) {
        var y = TUBE.bottom - (mm / TUBE.max) * h;
        el('rect', { x: t.x, y: y - 1, width: mm % 100 === 0 ? 14 : 8, height: 2, fill: '#15211c', 'fill-opacity': 0.7 }, g);
      }
    });
  }
  function renderGauges(sim) {
    var h = TUBE.bottom - TUBE.top;
    [['rain', sim.rain], ['runoff', sim.runoff]].forEach(function (pair) {
      var fh = Math.min(1, pair[1] / TUBE.max) * h;
      gaugeFills[pair[0]].setAttribute('y', (TUBE.bottom - fh).toFixed(1));
      gaugeFills[pair[0]].setAttribute('height', fh.toFixed(1));
    });
  }

  // ---------- readouts ----------
  var srLive, srTimer;
  function sentence(sim) {
    if (sim.rain <= 0) return 'No rain yet. Move the rainfall slider to start a storm.';
    if (sim.runoff < 0.5) return 'Of ' + sim.rain + ' mm of rain, almost none runs off. The ground takes it all.';
    return 'Of ' + sim.rain + ' mm of rain, about ' + fmt(sim.runoff) + ' mm runs off (' + fmt(sim.fraction * 100) + '%). The rest stays on the land.';
  }
  function renderReadouts(sim) {
    var text = sentence(sim);
    $('plate-note').textContent = text;
    $('split-run').style.width = fmt(sim.fraction * 100, 1) + '%';
    $('split-kept').style.width = sim.rain > 0 ? fmt(100 - sim.fraction * 100, 1) + '%' : '0%';
    $('fig-runoff').innerHTML = fmt(sim.runoff) + '<small> mm</small>';
    $('fig-share').textContent = sim.rain > 0 ? fmt(sim.fraction * 100) + '% of the rain' : 'No rain';
    $('fig-kept').innerHTML = fmt(sim.kept) + '<small> mm</small>';
    $('fig-volume').innerHTML = fmt(sim.volumeMillionM3, sim.volumeMillionM3 < 10 ? 1 : 0) + '<small> million m&sup3;</small>';
    clearTimeout(srTimer);
    srTimer = setTimeout(function () { srLive.textContent = text; }, 600);
  }

  function renderBars(sim) {
    var rows = R.COVERS.map(function (c) {
      var mix = {}; R.COVERS.forEach(function (o) { mix[o.id] = o.id === c.id ? 100 : 0; });
      var s = R.simulate(STATE.rain, STATE.wetness, mix);
      return { id: c.id, label: 'All ' + c.name.toLowerCase(), q: s.runoff, mine: false };
    });
    rows.push({ id: 'mine', label: 'Your mix', q: sim.runoff, mine: true });
    var nodes = $('bars').children;
    rows.forEach(function (r, i) {
      var row = nodes[i];
      var pct = STATE.rain > 0 ? (r.q / STATE.rain) * 100 : 0;
      row.querySelector('.bar-fill').style.width = pct.toFixed(1) + '%';
      row.querySelector('small').textContent = STATE.rain > 0 ? fmt(r.q, 1) + ' mm of ' + STATE.rain + ' mm (' + fmt(pct) + '%)' : 'No rain';
    });
  }
  function buildBars() {
    var host = $('bars');
    R.COVERS.concat([{ id: 'mine', name: 'Your mix' }]).forEach(function (c) {
      var row = document.createElement('div');
      row.className = 'bar-row' + (c.id === 'mine' ? ' mine' : '');
      row.setAttribute('role', 'listitem');
      row.innerHTML = '<div class="bar-label"><span></span><small></small></div><div class="bar-track"><div class="bar-fill"></div></div>';
      row.querySelector('.bar-label span').textContent = c.id === 'mine' ? 'Your mix' : 'All ' + c.name.toLowerCase();
      host.appendChild(row);
    });
  }

  function renderSlip(sim) {
    var wet = R.WETNESS[STATE.wetness].toLowerCase();
    $('slip-title').textContent = 'Your storm: ' + STATE.rain + ' mm, ' + wet + ' soil';
    var host = $('slip-rows');
    clear(host);
    sim.rows.forEach(function (r) {
      var li = document.createElement('li');
      var cn = r.cn === Math.round(r.cnAdjusted) ? 'CN ' + r.cn : 'CN ' + r.cn + ' to ' + fmt(r.cnAdjusted);
      li.innerHTML = '<span class="r-name"></span><span class="r-dots" aria-hidden="true"></span><span class="r-val"></span>';
      li.querySelector('.r-name').innerHTML = r.name + '<em>' + r.share + '% of basin &middot; ' + cn + ' &middot; S ' + fmt(r.s) + ' mm &middot; loses ' + fmt(r.ia) + ' mm first</em>';
      li.querySelector('.r-val').textContent = fmt(r.q, 1) + ' mm';
      host.appendChild(li);
    });
    $('slip-total').textContent = fmt(sim.runoff, 1) + ' mm';
  }

  // ---------- controls ----------
  var coverInputs = {}, coverOuts = {};
  function buildCoverSliders() {
    var host = $('cover-sliders');
    R.COVERS.forEach(function (c) {
      var row = document.createElement('div');
      row.className = 'cover-row';
      var id = 'cover-' + c.id;
      row.innerHTML =
        '<div class="slider-row"><label for="' + id + '" class="name"><span class="swatch" style="background:' + COLORS[c.id] + '"></span>' + c.name + ' <span class="cn">CN ' + c.cn + '</span></label><output for="' + id + '"></output></div>' +
        '<input type="range" id="' + id + '" min="0" max="100" step="1">';
      host.appendChild(row);
      coverInputs[c.id] = row.querySelector('input');
      coverOuts[c.id] = row.querySelector('output');
      coverInputs[c.id].addEventListener('input', function () {
        STATE.mix = R.rebalance(STATE.mix, c.id, Number(this.value));
        update('mix');
      });
    });
  }

  function syncControls() {
    $('rain-input').value = STATE.rain;
    $('rain-out').textContent = STATE.rain + ' mm';
    R.COVERS.forEach(function (c) {
      coverInputs[c.id].value = STATE.mix[c.id];
      coverOuts[c.id].textContent = STATE.mix[c.id] + '%';
    });
    document.querySelectorAll('[data-rain]').forEach(function (b) {
      b.classList.toggle('on', Number(b.dataset.rain) === STATE.rain);
    });
    document.querySelectorAll('[data-mix]').forEach(function (b) {
      var m = b.dataset.mix.split(',').map(Number);
      var same = R.COVERS.every(function (c, i) { return STATE.mix[c.id] === m[i]; });
      b.classList.toggle('on', same);
    });
  }

  var lastMixKey = '';
  function update() {
    var sim = R.simulate(STATE.rain, STATE.wetness, STATE.mix);
    var key = JSON.stringify(STATE.mix);
    if (key !== lastMixKey) { renderCover(); lastMixKey = key; }
    renderRain(sim); renderFlow(sim); renderSoak(sim); renderRiver(sim); renderGauges(sim);
    renderReadouts(sim); renderBars(sim); renderSlip(sim);
    syncControls();
  }

  function wire() {
    $('rain-input').addEventListener('input', function () {
      STATE.rain = Number(this.value);
      update('rain-drag');
    });
    document.querySelectorAll('[data-rain]').forEach(function (b) {
      b.addEventListener('click', function () { STATE.rain = Number(b.dataset.rain); update('preset'); });
    });
    document.querySelectorAll('[data-mix]').forEach(function (b) {
      b.addEventListener('click', function () {
        var m = b.dataset.mix.split(',').map(Number);
        STATE.mix = {};
        R.COVERS.forEach(function (c, i) { STATE.mix[c.id] = m[i]; });
        update('preset');
      });
    });
    document.querySelectorAll('input[name=wet]').forEach(function (r) {
      r.addEventListener('change', function () { STATE.wetness = this.value; update('wet'); });
    });
  }

  // ---------- zigzag and scallop edges ----------
  function drawEdges() {
    var slip = document.querySelector('.slip');
    var edge = slip.querySelector('.edge');
    if (!edge) {
      edge = el('svg', { class: 'edge', viewBox: '0 0 480 18', preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' });
      el('path', { d: '' }, edge);
      slip.appendChild(edge);
      edge.setAttribute('class', 'edge');
    }
    var pts = [[0, 0], [480, 0]];
    for (var i = 20; i >= 0; i--) pts.push([i * 24, i % 2 === 0 ? 18 : 0]);
    edge.firstChild.setAttribute('d', 'M' + poly(pts) + ' Z');

    var n = window.innerWidth < 640 ? 6 : 12, w = 1200 / n, d = 'M0 28';
    for (var j = 0; j < n; j++) d += ' A' + (w / 2) + ' 28 0 0 1 ' + ((j + 1) * w) + ' 28';
    $('scallop-path').setAttribute('d', d + ' Z');
  }

  // ---------- entrances ----------
  function reveal() {
    var groups = [
      ['.cover h1, .cover .statement, .cover .tag, .cover .button', 90],
      ['.study-head > *', 90],
      ['.controls', 0], ['.figures', 0],
      ['.ground-head > *', 90], ['.bar-row', 60],
      ['.method-text > *', 70], ['.slip', 0],
      ['.walk h2, .walk-lead', 90], ['.plate-photo', 80],
      ['.limits h2, .limits-lead', 90], ['.limits-list li', 70], ['.limits-care', 0],
      ['.back-card', 0]
    ];
    var items = [];
    groups.forEach(function (g) {
      document.querySelectorAll(g[0]).forEach(function (n, i) {
        n.classList.add('reveal');
        n.style.setProperty('--d', i * g[1] + 'ms');
        items.push(n);
      });
    });
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (n) { io.observe(n); });
  }

  // ---------- go ----------
  srLive = document.createElement('div');
  srLive.setAttribute('role', 'status');
  srLive.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
  document.body.appendChild(srLive);

  buildStatic(); buildRain(); buildSoak(); buildFlow(); buildGauges();
  buildBars(); buildCoverSliders(); wire(); drawEdges();
  update('init');
  reveal();
  window.addEventListener('resize', drawEdges);
})();
