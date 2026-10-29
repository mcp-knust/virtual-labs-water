/* Session 06 — Rapid sand filtration: clean-bed head loss, run time and breakthrough. */
(function () {
  "use strict";

  var W = 560, H = 360;
  var G = 9.81, RHO = 998, MU = 1.002e-3, POROSITY = 0.42;
  var H_TERMINAL = 2.0, TURB_LIMIT = 1.0;

  function $(id) { return document.getElementById(id); }

  var s = { d: 0.7e-3, L: 0.8, rate: 10, cin: 5, t: 0, h0: 0, k: 0, tb: 40, tHead: 40, tRun: 40, h: 0, eff: 0.15 };

  var c = Lab.ctx2d($("s6-canvas"), W, H);

  function label(text, x, y, size, color, align, weight) {
    c.font = (weight || 500) + " " + (size || 11) + "px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = color || "#3d464e";
    c.textAlign = align || "left";
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }

  function recompute() {
    var v = s.rate / 3600;
    s.h0 = (180 * MU * v * Math.pow(1 - POROSITY, 2) / (RHO * G * s.d * s.d * Math.pow(POROSITY, 3))) * s.L;
    s.k = 0.045 * Math.pow(s.cin / 5, 0.7) * Math.pow(s.rate / 10, 0.5) * (0.8 / s.L);
    s.tb = 40 * Math.pow(s.L / 0.8, 1.2) * Math.pow(10 / s.rate, 0.6) * Math.pow(5 / s.cin, 0.35);
    s.tHead = s.h0 < H_TERMINAL ? (H_TERMINAL - s.h0) / s.k : 0;
    s.tRun = Math.min(s.tHead, s.tb);

    s.h = Math.min(3.2, s.h0 + s.k * s.t);
    s.eff = 0.15 + 0.85 * Math.pow(Math.min(1.35, s.t / s.tb), 8);
  }

  /* ---------------- drawing ---------------- */

  var fx = 70, fw = 200, ftop = 56, fbot = 300;

  function draw() {
    c.clearRect(0, 0, W, H);

    c.fillStyle = "#efece6";
    c.fillRect(0, 320, W, H - 320);
    c.strokeStyle = "#d8d3ca";
    c.beginPath(); c.moveTo(0, 320); c.lineTo(W, 320); c.stroke();

    var bedTop = ftop + 86;
    var bedH = Math.min(110, 40 + s.L * 80);
    var bedBot = bedTop + bedH;

    // filter box
    c.fillStyle = "#f4f8fa";
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 2;
    c.beginPath();
    c.rect(fx, ftop, fw, fbot - ftop);
    c.fill();
    c.stroke();

    // supernatant water
    c.fillStyle = "rgba(150,200,220,0.30)";
    c.fillRect(fx + 2, ftop + 2, fw - 4, bedTop - ftop - 2);

    // inlet
    c.strokeStyle = "#5b9fc0";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(fx - 30, ftop + 16);
    c.lineTo(fx + 2, ftop + 16);
    c.stroke();
    label("influent", fx - 28, ftop + 4, 9, "#0b5c8a");
    label(s.cin.toFixed(1) + " NTU", fx - 28, ftop + 30, 9, "#6b757e");

    // sand bed with deposit
    var deposit = Math.min(1, s.t / Math.max(1, s.tRun));
    c.save();
    c.beginPath();
    c.rect(fx + 2, bedTop, fw - 4, bedH);
    c.clip();
    c.fillStyle = "rgba(214,196,158,0.55)";
    c.fillRect(fx + 2, bedTop, fw - 4, bedH);
    // grains
    var rnd = mulberry(7);
    var grains = 260;
    for (var i = 0; i < grains; i++) {
      var gx = fx + 4 + rnd() * (fw - 8);
      var gy = bedTop + rnd() * bedH;
      var depthFrac = (gy - bedTop) / bedH;
      var gr = 1.1 + rnd() * 1.6;
      c.beginPath();
      c.arc(gx, gy, gr, 0, Math.PI * 2);
      c.fillStyle = "rgba(168,144,102," + (0.45 + 0.4 * (1 - depthFrac)).toFixed(2) + ")";
      c.fill();
    }
    // deposit band at the top, thickening with run time
    var bandH = 4 + deposit * bedH * 0.42;
    c.fillStyle = "rgba(120,96,60," + (0.18 + 0.4 * deposit).toFixed(2) + ")";
    c.fillRect(fx + 2, bedTop, fw - 4, bandH);
    c.restore();

    c.strokeStyle = "#9b8b6b";
    c.lineWidth = 1;
    c.strokeRect(fx + 2, bedTop, fw - 4, bedH);

    // gravel support
    c.fillStyle = "#cfc6b4";
    c.fillRect(fx + 2, bedBot, fw - 4, 26);
    var rnd2 = mulberry(21);
    for (var g = 0; g < 60; g++) {
      c.beginPath();
      c.arc(fx + 6 + rnd2() * (fw - 12), bedBot + 4 + rnd2() * 18, 2.2 + rnd2() * 2, 0, Math.PI * 2);
      c.fillStyle = "rgba(150,140,120,0.75)";
      c.fill();
    }

    // underdrain
    c.fillStyle = "#e2ddd3";
    c.fillRect(fx + 2, bedBot + 26, fw - 4, 12);
    c.strokeStyle = "#8fa0ab";
    c.strokeRect(fx + 2, bedBot + 26, fw - 4, 12);

    // outlet
    c.strokeStyle = "#5b9fc0";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(fx + fw / 2, bedBot + 38);
    c.lineTo(fx + fw / 2, fbot + 14);
    c.lineTo(fx + fw / 2 + 52, fbot + 14);
    c.stroke();

    var effTint = Math.min(1, s.eff / 3);
    c.fillStyle = "rgba(" + Math.round(214 - 70 * effTint) + "," + Math.round(206 - 70 * effTint) + "," + Math.round(170 - 60 * effTint) + ",0.85)";
    c.fillRect(fx + fw / 2 + 20, fbot + 9, 32, 10);
    label("effluent " + s.eff.toFixed(2) + " NTU", fx + fw / 2 + 20, fbot + 30, 9.5, s.eff <= TURB_LIMIT ? "#16603f" : "#8d2020");

    // media labels
    label("sand d₁₀ " + (s.d * 1000).toFixed(2) + " mm", fx + 6, bedTop + bedH / 2, 9.5, "#5b4f36");
    label("L = " + s.L.toFixed(2) + " m", fx + 6, bedTop + bedH / 2 + 13, 9.5, "#5b4f35");
    label("gravel", fx + 6, bedBot + 13, 9, "#5c666f");

    /* ---- manometer ---- */
    var mx = 360, mtop = 90, mbot = 250, mw = 26;
    var tapTop = bedTop + 6, tapBot = bedBot + 10;

    // connections
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(fx + fw, tapTop);
    c.lineTo(mx - 6, tapTop);
    c.lineTo(mx - 6, mtop + 20);
    c.stroke();
    c.beginPath();
    c.moveTo(fx + fw, tapBot);
    c.lineTo(mx + 62, tapBot);
    c.lineTo(mx + 62, mtop + 20);
    c.stroke();

    // two limbs
    [mx - 6, mx + 62].forEach(function (x) {
      c.fillStyle = "#f4f8fa";
      c.strokeStyle = "#8fa0ab";
      c.lineWidth = 1.6;
      c.beginPath();
      c.rect(x, mtop, mw, mbot - mtop);
      c.fill();
      c.stroke();
    });

    var scale = 46; // px per metre of head
    var baseLevel = mtop + 96;
    var leftLevel = baseLevel;
    var rightLevel = baseLevel + Math.min(2.2, s.h) * scale;

    function limb(x, level) {
      c.save();
      c.beginPath();
      c.rect(x + 1.5, mtop + 1.5, mw - 3, mbot - mtop - 3);
      c.clip();
      c.fillStyle = "rgba(150,200,220,0.55)";
      c.fillRect(x + 1.5, level, mw - 3, mbot - level);
      c.restore();
      c.beginPath();
      c.ellipse(x + mw / 2, level, mw / 2 - 2, 2.6, 0, 0, Math.PI * 2);
      c.fillStyle = "#8fc3d8";
      c.fill();
    }
    limb(mx - 6, leftLevel);
    limb(mx + 62, rightLevel);

    // head loss bracket
    c.strokeStyle = "#8a4a12";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(mx + 30, leftLevel);
    c.lineTo(mx + 36, leftLevel);
    c.moveTo(mx + 30, rightLevel);
    c.lineTo(mx + 36, rightLevel);
    c.moveTo(mx + 33, leftLevel);
    c.lineTo(mx + 33, rightLevel);
    c.stroke();

    c.font = "600 11px ui-monospace, Menlo, Consolas, monospace";
    c.fillStyle = "#8a4a12";
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText("h = " + s.h.toFixed(2) + " m", mx + 40, (leftLevel + rightLevel) / 2);

    label("MANOMETER", mx + 36, mtop - 16, 9, "#6b757e", "center", 700);
    label("above bed", mx + 7, mbot + 12, 8.5, "#6b757e", "center");
    label("below bed", mx + 75, mbot + 12, 8.5, "#6b757e", "center");

    /* ---- run status ---- */
    var statusY = 296;
    label("RUN STATUS", mx - 6, statusY - 14, 9, "#6b757e", "left", 700);
    var over = s.t > s.tRun + 0.01;
    var status = over ? "run exceeded" : s.t >= s.tRun * 0.98 ? "run ending" : "in service";
    c.font = "600 13px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = over ? "#8d2020" : s.t >= s.tRun * 0.98 ? "#8a4a12" : "#16603f";
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText(status, mx - 6, statusY);
    label("hour " + s.t.toFixed(0) + " of " + s.tRun.toFixed(0), mx - 6, statusY + 16, 10, "#3d464e");
    label("limit: " + (s.tHead < s.tb ? "head loss" : "breakthrough"), mx - 6, statusY + 31, 10, "#6b757e");
  }

  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------------- sync ---------------- */

  function sync() {
    s.d = Number($("s6-d").value) / 100000; // slider is d10 in hundredths of a millimetre
    s.L = Number($("s6-l").value) / 100;
    s.rate = Number($("s6-rate").value) / 10;
    s.cin = Number($("s6-tin").value) / 10;
    s.t = Number($("s6-t").value);

    recompute();

    $("s6-d-v").textContent = (s.d * 1000).toFixed(2) + " mm";
    $("s6-l-v").textContent = s.L.toFixed(2) + " m";
    $("s6-rate-v").textContent = s.rate.toFixed(1) + " m/h";
    $("s6-tin-v").textContent = s.cin.toFixed(1) + " NTU";
    $("s6-t-v").textContent = s.t + " h";

    $("s6-h").innerHTML = s.h.toFixed(2) + " <small>m</small>";
    $("s6-h0").textContent = s.h0.toFixed(2) + " m";
    $("s6-eff").textContent = s.eff.toFixed(2) + " NTU";
    $("s6-ld").textContent = Math.round(s.L / s.d);
    $("s6-run").textContent = s.tRun.toFixed(0) + " h";
    $("s6-limit").textContent = s.tHead < s.tb ? "Head loss" : "Breakthrough";
    $("s6-vol").textContent = (s.rate * s.tRun).toFixed(0) + " m³/m²";

    var ld = s.L / s.d;
    if (ld < 1000) {
      $("s6-ld").className = "chip warn";
    }

    draw();
    drawCharts();
  }

  function drawCharts() {
    var maxT = Math.max(10, Math.ceil((s.tRun * 1.3) / 5) * 5);
    var hpts = [], epts = [];
    for (var i = 0; i <= 100; i++) {
      var t = (i / 100) * maxT;
      hpts.push([t, Math.min(3.0, s.h0 + s.k * t)]);
      epts.push([t, Math.min(6, 0.15 + 0.85 * Math.pow(Math.min(1.35, t / s.tb), 8))]);
    }

    Lab.chart($("s6-curve"), {
      height: 230,
      x: { min: 0, max: maxT, label: "Run time (h)" },
      y: { min: 0, max: 3, label: "Head loss (m)" },
      series: [
        { pts: hpts, color: "#0b5c8a", width: 2 },
        { pts: [[0, H_TERMINAL], [maxT, H_TERMINAL]], color: "#8d2020", dash: [5, 4], width: 1.2 }
      ],
      marker: { x: s.t, y: Math.min(3, s.h), label: s.h.toFixed(2) + " m" }
    });

    Lab.chart($("s6-curve2"), {
      height: 210,
      x: { min: 0, max: maxT, label: "Run time (h)" },
      y: { min: 0, max: 4, label: "Effluent turbidity (NTU)" },
      series: [
        { pts: epts, color: "#8a4a12", width: 2 },
        { pts: [[0, TURB_LIMIT], [maxT, TURB_LIMIT]], color: "#8d2020", dash: [5, 4], width: 1.2 }
      ],
      marker: { x: s.t, y: Math.min(4, s.eff), label: s.eff.toFixed(2) + " NTU" }
    });
  }

  /* ---------------- actions ---------------- */

  var run = 0;

  function record() {
    run++;
    Lab.addRow("s6-table", [
      run,
      (s.d * 1000).toFixed(2),
      s.L.toFixed(2),
      s.rate.toFixed(1),
      s.t,
      s.h.toFixed(2),
      s.eff.toFixed(2)
    ]);
  }

  function report() {
    Lab.report({
      slug: "session-06-filtration",
      title: "Session 06 — Rapid Sand Filtration",
      session: "06",
      tableId: "s6-table",
      values: [
        ["Media d₁₀", (s.d * 1000).toFixed(2) + " mm"],
        ["Bed depth", s.L.toFixed(2) + " m"],
        ["L/d ratio", Math.round(s.L / s.d) + (s.L / s.d < 1000 ? " (below 1000)" : "")],
        ["Filtration rate", s.rate.toFixed(1) + " m/h"],
        ["Influent turbidity", s.cin.toFixed(1) + " NTU"],
        ["Clean-bed head loss", s.h0.toFixed(2) + " m"],
        ["Predicted run time", s.tRun.toFixed(0) + " h"],
        ["Run limited by", s.tHead < s.tb ? "head loss" : "breakthrough"],
        ["Unit run volume", (s.rate * s.tRun).toFixed(0) + " m³/m²"]
      ],
      notes:
        "Clean-bed head loss from Carman–Kozeny: h0/L = 180μv(1−e)²/(ρgd²e³), with e = 0.42. Head loss " +
        "growth taken as linear in deposited solids, h = h0 + kt, with k calibrated to 0.045 m/h at 5 NTU " +
        "and 10 m/h. Run time is the lesser of the head-limited and breakthrough times."
    });
  }

  function advance() {
    var target = Math.min(60, s.tRun + 2);
    var start = s.t;
    var t0 = performance.now();
    var dur = 2400;
    function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      var t = start + (target - start) * k;
      $("s6-t").value = String(Math.round(t));
      sync();
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  $("s6-d").addEventListener("input", sync);
  $("s6-l").addEventListener("input", sync);
  $("s6-rate").addEventListener("input", sync);
  $("s6-tin").addEventListener("input", sync);
  $("s6-t").addEventListener("input", sync);
  $("s6-record").addEventListener("click", record);
  $("s6-advance").addEventListener("click", advance);
  $("s6-report").addEventListener("click", report);

  sync();
})();
