(function () {
  // Keep page content clear of the fixed header and footer
  var hdr = document.querySelector('header.top'), ftr = document.querySelector('footer');
  function fit() {
    var r = document.documentElement.style;
    if (hdr) r.setProperty('--header-h', hdr.offsetHeight + 'px');
    if (ftr) r.setProperty('--footer-h', ftr.offsetHeight + 'px');
  }
  fit(); window.addEventListener('resize', fit);
  if (window.ResizeObserver) { var ro = new ResizeObserver(fit); if (hdr) ro.observe(hdr); if (ftr) ro.observe(ftr); }

  // Copy email
  var btn = document.getElementById('copy');
  var email = document.getElementById('email');
  if (btn && email) btn.addEventListener('click', function () {
    var text = email.textContent.trim();
    function selectIt() {
      var r = document.createRange(); r.selectNodeContents(email);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      btn.textContent = 'Selected';
    }
    try {
      navigator.clipboard.writeText(text).then(function () { btn.textContent = 'Copied'; }, selectIt);
    } catch (e) { selectIt(); }
    setTimeout(function () { btn.textContent = 'Copy'; }, 2200);
  });

  // Office clocks (Intl handles daylight saving automatically)
  var clocks = document.querySelectorAll('.clock');
  function tick() {
    clocks.forEach(function (el) {
      try { el.textContent = new Date().toLocaleTimeString('en-US', { timeZone: el.dataset.tz, hour: 'numeric', minute: '2-digit' }); } catch (e) {}
    });
  }
  tick(); setInterval(tick, 30000);

  // Star chart
  var c = document.getElementById('sky');
  if (!c) return;
  var ctx = c.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W, H, dpr, stars = [], pole, R;
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  // A small invented constellation, in polar coords around the pole
  var figure = [[0.42, 3.55], [0.55, 3.75], [0.63, 3.62], [0.74, 3.86], [0.66, 4.05], [0.55, 3.75]];

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = c.clientWidth; H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var narrow = W < 700;
    pole = { x: narrow ? W * 0.85 : W * 0.76, y: narrow ? H * 0.2 : H * 0.36 };
    R = Math.max(W, H) * (narrow ? 0.7 : 0.55);
    seed = 7; stars = [];
    var n = Math.round(W * H / 2600);
    for (var i = 0; i < n; i++) {
      var d = Math.sqrt(rnd()) * Math.hypot(W, H);
      stars.push({ r: d, a: rnd() * Math.PI * 2, s: rnd() < 0.06 ? 1.4 + rnd() : 0.4 + rnd() * 0.8, tw: rnd() * 6.28, b: 0.35 + rnd() * 0.65 });
    }
  }

  function draw(t) {
    var rot = reduce ? 0 : t * 0.000018;
    ctx.clearRect(0, 0, W, H);

    // Chart rings and ticks
    ctx.save();
    ctx.translate(pole.x, pole.y);
    ctx.strokeStyle = 'rgba(200,165,104,0.20)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach(function (k) { ctx.beginPath(); ctx.arc(0, 0, R * k, 0, Math.PI * 2); ctx.stroke(); });
    ctx.rotate(rot);
    for (var i = 0; i < 360; i += 2) {
      var a = i * Math.PI / 180, len = i % 30 === 0 ? 14 : (i % 10 === 0 ? 8 : 4);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5);
      ctx.lineTo(Math.cos(a) * (R * 0.5 - len), Math.sin(a) * (R * 0.5 - len));
      ctx.strokeStyle = i % 30 === 0 ? 'rgba(200,165,104,0.55)' : 'rgba(200,165,104,0.25)';
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(200,165,104,0.10)';
    for (var h = 0; h < 12; h++) {
      var b = h * Math.PI / 6;
      ctx.beginPath(); ctx.moveTo(Math.cos(b) * R * 0.25, Math.sin(b) * R * 0.25); ctx.lineTo(Math.cos(b) * R, Math.sin(b) * R); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(200,165,104,0.6)';
    ctx.font = '10px Verdana, Arial, sans-serif';
    for (var hr = 0; hr < 24; hr += 3) {
      var ang = hr * Math.PI / 12;
      ctx.fillText(hr + 'h', Math.cos(ang) * (R * 0.5 + 8) - 6, Math.sin(ang) * (R * 0.5 + 8) + 3);
    }
    // Constellation
    ctx.strokeStyle = 'rgba(236,229,211,0.35)';
    ctx.beginPath();
    figure.forEach(function (p, j) {
      var x = Math.cos(p[1]) * R * p[0], y = Math.sin(p[1]) * R * p[0];
      j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    figure.forEach(function (p) {
      ctx.beginPath(); ctx.arc(Math.cos(p[1]) * R * p[0], Math.sin(p[1]) * R * p[0], 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ece5d3'; ctx.fill();
    });
    ctx.restore();

    // Stars rotating about the pole
    for (var k = 0; k < stars.length; k++) {
      var s = stars[k];
      var a2 = s.a + rot * 1.0;
      var x = pole.x + Math.cos(a2) * s.r, y = pole.y + Math.sin(a2) * s.r;
      if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
      var tw = reduce ? 1 : 0.75 + 0.25 * Math.sin(t * 0.0015 + s.tw);
      ctx.globalAlpha = s.b * tw;
      ctx.fillStyle = s.s > 1.3 ? '#f3e7c8' : '#ece5d3';
      ctx.beginPath(); ctx.arc(x, y, s.s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Pole star
    ctx.beginPath(); ctx.arc(pole.x, pole.y, 3, 0, Math.PI * 2); ctx.fillStyle = '#c8a568'; ctx.fill();

    // Fade toward the text side so copy stays legible
    var g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(10,13,23,0.85)'); g.addColorStop(0.5, 'rgba(10,13,23,0.35)'); g.addColorStop(1, 'rgba(10,13,23,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var g2 = ctx.createLinearGradient(0, H * 0.75, 0, H);
    g2.addColorStop(0, 'rgba(10,13,23,0)'); g2.addColorStop(1, 'rgba(10,13,23,1)');
    ctx.fillStyle = g2; ctx.fillRect(0, H * 0.75, W, H * 0.25);

    if (!reduce) requestAnimationFrame(draw);
  }

  build();
  requestAnimationFrame(draw);
  var to;
  window.addEventListener('resize', function () { clearTimeout(to); to = setTimeout(function () { build(); if (reduce) draw(0); }, 120); });
})();
