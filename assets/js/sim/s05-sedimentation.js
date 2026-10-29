/* Session 05 — Type I settling: Stokes to Schiller–Naumann, overflow rate and removal. */
(function () {
  "use strict";

  var W = 560, H = 380;
  var G = 9.81;
  var DEPTH = 2.0; // m

  var TS = [0, 5, 10, 15, 20, 25, 30, 35];
  var MU = [1.787e-3, 1.519e-3, 1.307e-3, 1.139e-3, 1.002e-3, 0.890e-3, 0.798e-3, 0.719e-3];
  var RHO = [999.84, 999.97, 999.70, 999.10, 998.21, 997.05, 995.68, 994.04];

  function $(id) { return document.getElementById(id); }

  function interp(arr, t) {
    if (t <= TS[0]) return arr[0];
    if (t >= TS[TS.length - 1]) return arr[arr.length - 1];
    for (var i = 0; i < TS.length - 1; i++) {
      if (t <= TS[i + 1]) {
        var k = (t - TS[i]) / (TS[i + 1] - TS[i]);
        return arr[i] + k * (arr[i + 1] - arr[i]);
      }
    }
    return arr[arr.length - 1];
  }

  function settlingVelocity(d, sg, temp) {
    var mu = interp(MU, temp);
    var rhow = interp(RHO, temp);
    var rhos = sg * 1000;
    if (rhos <= rhow) return 0;
    var v = (G * (rhos - rhow) * d * d) / (18 * mu);
    for (var i = 0; i < 80; i++) {
      var Re = (rhow * v * d) / mu;
      var ReSafe = Math.max(Re, 1e-6);
      var Cd = (24 / ReSafe) * (1 + 0.15 * Math.pow(ReSafe, 0.687));
      var vn = Math.sqrt((4 * G * d * (rhos - rhow)) / (3 * Cd * rhow));
      if (!isFinite(vn)) break;
      v = vn;
    }
    return v;
  }

  var s = { d: 0.0798, sg: 2.65, temp: 20, v0: 1.0, v: 0, re: 0, eff: 0, clock: 0, particles: [], last: 0 };

  var c = Lab.ctx2d($("s5-canvas"), W, H);

  function label(text, x, y, size, color, align, weight) {
    c.font = (weight || 500) + " " + (size || 11) + "px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = color || "#3d464e";
    c.textAlign = align || "left";
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }

  function diameterFromSlider(v) {
    return 0.005 * Math.pow(200, v / 100); // mm
  }

  /* ---------------- geometry ---------------- */

  var colX = 92, colW = 118, colTop = 44, colH = 250;

  function yOfDepth(depthM) {
    return colTop + (depthM / DEPTH) * colH;
  }

  function spawn(n) {
    s.particles = [];
    for (var i = 0; i < n; i++) {
      s.particles.push({
        x: 0.15 + Math.random() * 0.7,
        t0: Math.random() * 6,
        jitter: 0.6 + Math.random() * 0.8
      });
    }
  }

  /* ---------------- drawing ---------------- */

  function draw() {
    c.clearRect(0, 0, W, H);

    c.fillStyle = "#efece6";
    c.fillRect(0, 340, W, H - 340);
    c.strokeStyle = "#d8d3ca";
    c.beginPath(); c.moveTo(0, 340); c.lineTo(W, 340); c.stroke();

    // column body
    c.fillStyle = "#f4f8fa";
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 2;
    c.beginPath();
    c.rect(colX, colTop, colW, colH);
    c.fill();
    c.stroke();

    // water surface
    c.strokeStyle = "#5b9fc0";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(colX + 2, colTop + 6);
    c.bezierCurveTo(colX + 30, colTop + 2, colX + 60, colTop + 10, colX + colW - 2, colTop + 5);
    c.stroke();

    // depth scale
    c.font = "9px ui-monospace, Menlo, Consolas, monospace";
    c.fillStyle = "#6b757e";
    c.textAlign = "right";
    c.textBaseline = "middle";
    for (var m = 0; m <= 4; m++) {
      var depth = m * 0.5;
      var y = yOfDepth(depth);
      c.strokeStyle = "#c3bdb2";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(colX - 8, y);
      c.lineTo(colX, y);
      c.stroke();
      c.fillText(depth.toFixed(1) + " m", colX - 12, y);
      // port
      c.beginPath();
      c.moveTo(colX + colW, y);
      c.lineTo(colX + colW + 16, y);
      c.stroke();
      c.fillStyle = "#b9b3a8";
      c.beginPath();
      c.arc(colX + colW + 19, y, 4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#6b757e";
    }

    // particles
    s.particles.forEach(function (p) {
      var t = s.clock - p.t0;
      if (t < 0) return;
      var dist = Math.min(DEPTH, s.v * t * p.jitter);
      var y = colTop + (dist / DEPTH) * colH;
      var x = colX + 10 + p.x * (colW - 20);
      c.beginPath();
      c.arc(x, y, 2.4, 0, Math.PI * 2);
      c.fillStyle = "rgba(92,86,72,0.7)";
      c.fill();
    });

    // hopper
    c.beginPath();
    c.moveTo(colX, colTop + colH);
    c.lineTo(colX + 18, colTop + colH + 26);
    c.lineTo(colX + colW - 18, colTop + colH + 26);
    c.lineTo(colX + colW, colTop + colH);
    c.closePath();
    c.fillStyle = "#e8e4dc";
    c.fill();
    c.strokeStyle = "#8fa0ab";
    c.stroke();

    // labels
    label("SETTLING COLUMN", colX, 26, 9.5, "#6b757e", "left", 700);
    label("clock " + s.clock.toFixed(0) + " s", colX, 306, 10.5, "#3d464e", "left", 600);
    label("animation ×100", colX, 322, 9.5, "#8a939b", "left");

    /* ---- basin schematic ---- */
    var bx = 300, by = 60, bw = 210, bh = 96;
    label("IDEAL BASIN", bx, by - 18, 9.5, "#6b757e", "left", 700);
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.6;
    c.fillStyle = "#f4f8fa";
    c.beginPath();
    c.rect(bx, by, bw, bh);
    c.fill();
    c.stroke();

    // inflow
    c.strokeStyle = "#5b9fc0";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(bx - 26, by + 18);
    c.lineTo(bx, by + 18);
    c.stroke();
    label("Q", bx - 22, by + 8, 9.5, "#0b5c8a", "left", 600);

    // particle trajectory
    var v0ms = s.v0 / 3600;
    var travel = Math.min(1, s.v / (v0ms || 1e-9));
    c.strokeStyle = "#8a4a12";
    c.setLineDash([3, 3]);
    c.beginPath();
    c.moveTo(bx + 2, by + 8);
    c.lineTo(bx + bw - 2, by + 8 + (1 - Math.min(1, travel)) * bh * 0 + travel * bh - 8);
    c.stroke();
    c.setLineDash([]);

    // settled line
    c.fillStyle = "rgba(120,110,92,0.18)";
    c.fillRect(bx + 1, by + bh - 14, bw - 2, 13);

    label("A = " + bw + " m² equivalent", bx, by + bh + 20, 9.5, "#6b757e", "left");
    label("v₀ = Q/A = " + s.v0.toFixed(2) + " m/h", bx, by + bh + 38, 10.5, "#16191c", "left", 600);

    // efficiency bar
    var ebx = bx, eby = by + bh + 58, ebw = bw;
    label("REMOVAL", ebx, eby - 2, 8.5, "#6b757e", "left", 700);
    c.fillStyle = "#eae6de";
    c.fillRect(ebx, eby + 8, ebw, 12);
    c.fillStyle = s.eff >= 0.999 ? "#16603f" : s.eff > 0.5 ? "#0b5c8a" : "#8a4a12";
    c.fillRect(ebx, eby + 8, ebw * s.eff, 12);
    c.strokeStyle = "#b9b3a8";
    c.lineWidth = 1;
    c.strokeRect(ebx, eby + 8, ebw, 12);
    c.font = "10px ui-monospace, Menlo, Consolas, monospace";
    c.fillStyle = "#16191c";
    c.textAlign = "right";
    c.textBaseline = "middle";
    c.fillText((s.eff * 100).toFixed(0) + "%", ebx + ebw, eby + 34);

    // regime note
    var regime = s.re < 0.5 ? "Stokes regime" : s.re < 1000 ? "Transitional regime" : "Newton regime";
    label("Re = " + s.re.toFixed(2) + " · " + regime, bx, eby + 56, 10, "#3d464e");
    label("C_D correction applied", bx, eby + 72, 9.5, s.re < 0.5 ? "#8a939b" : "#8a4a12");
  }

  /* ---------------- sync ---------------- */

  function sync() {
    var dmm = diameterFromSlider(Number($("s5-d").value));
    s.d = dmm / 1000;
    s.sg = Number($("s5-sg").value) / 100;
    s.temp = Number($("s5-t").value);
    s.v0 = Number($("s5-v0").value) / 10;

    s.v = settlingVelocity(s.d, s.sg, s.temp);
    var mu = interp(MU, s.temp);
    var rhow = interp(RHO, s.temp);
    s.re = (rhow * s.v * s.d) / mu;
    var v0ms = s.v0 / 3600;
    s.eff = v0ms > 0 ? Math.min(1, s.v / v0ms) : 1;

    $("s5-d-v").textContent = dmm < 0.01
      ? (dmm * 1000).toFixed(1) + " µm"
      : dmm.toFixed(3) + " mm";
    $("s5-sg-v").textContent = s.sg.toFixed(2);
    $("s5-t-v").textContent = s.temp + " °C";
    $("s5-v0-v").textContent = s.v0.toFixed(1) + " m/h";

    $("s5-v").innerHTML = (s.v * 1000).toFixed(2) + " <small>mm/s</small>";
    $("s5-re").textContent = s.re < 0.01 ? s.re.toExponential(2) : s.re.toFixed(2);
    $("s5-regime").textContent = s.re < 0.5 ? "Stokes" : s.re < 1000 ? "Transitional" : "Newton";

    var tsec = s.v > 0 ? DEPTH / s.v : Infinity;
    $("s5-time").textContent = !isFinite(tsec)
      ? "never"
      : tsec < 90 ? tsec.toFixed(0) + " s" : (tsec / 60).toFixed(1) + " min";
    $("s5-v0").textContent = s.v0.toFixed(2) + " m/h";
    $("s5-eff").textContent = (s.eff * 100).toFixed(0) + " %";

    draw();
    drawCurve();
  }

  function drawCurve() {
    var pts = [];
    for (var i = 0; i <= 120; i++) {
      var v0 = 0.1 + (i / 120) * 9.9;
      var eff = Math.min(1, s.v / (v0 / 3600));
      pts.push([v0, eff * 100]);
    }
    Lab.chart($("s5-curve"), {
      height: 250,
      x: { min: 0, max: 10, label: "Overflow rate v₀ (m/h)" },
      y: { min: 0, max: 100, label: "Removal (%)" },
      series: [{ pts: pts, color: "#0b5c8a", width: 2 }],
      marker: { x: s.v0, y: s.eff * 100, label: (s.eff * 100).toFixed(0) + "%" }
    });
  }

  /* ---------------- animation ---------------- */

  function frame(now) {
    if (!s.last) s.last = now;
    var dt = Math.min(0.1, (now - s.last) / 1000);
    s.last = now;
    s.clock += dt * 100;
    draw();
    requestAnimationFrame(frame);
  }

  var run = 0;

  function record() {
    run++;
    Lab.addRow("s5-table", [
      run,
      (s.d * 1000).toFixed(3),
      s.sg.toFixed(2),
      s.temp,
      (s.v * 1000).toFixed(2),
      s.re < 0.01 ? s.re.toExponential(2) : s.re.toFixed(2),
      (s.eff * 100).toFixed(0)
    ]);
  }

  function report() {
    Lab.report({
      slug: "session-05-sedimentation",
      title: "Session 05 — Sedimentation: Type I Settling",
      session: "05",
      tableId: "s5-table",
      values: [
        ["Particle diameter", (s.d * 1000).toFixed(3) + " mm"],
        ["Specific gravity", s.sg.toFixed(2)],
        ["Water temperature", s.temp + " °C"],
        ["Settling velocity", (s.v * 1000).toFixed(2) + " mm/s"],
        ["Reynolds number", s.re.toFixed(3)],
        ["Flow regime", s.re < 0.5 ? "Stokes" : s.re < 1000 ? "Transitional" : "Newton"],
        ["Time to settle 2.0 m", isFinite(DEPTH / s.v) ? (DEPTH / s.v).toFixed(0) + " s" : "never"],
        ["Design overflow rate", s.v0.toFixed(2) + " m/h"],
        ["Removal efficiency", (s.eff * 100).toFixed(0) + " %"]
      ],
      notes:
        "Settling velocity solved with the Schiller–Naumann drag correlation, iterating " +
        "v = √(4gd(ρs−ρw)/(3Cdρw)) with Cd = (24/Re)(1+0.15Re^0.687). Removal taken as min(1, v_s/v_0) " +
        "for an ideal horizontal-flow basin, where v_0 = Q/A is the overflow rate."
    });
  }

  $("s5-d").addEventListener("input", sync);
  $("s5-sg").addEventListener("input", sync);
  $("s5-t").addEventListener("input", sync);
  $("s5-v0").addEventListener("input", sync);
  $("s5-record").addEventListener("click", record);
  $("s5-report").addEventListener("click", report);
  $("s5-restart").addEventListener("click", function () {
    s.clock = 0;
    spawn(46);
  });

  $("s5-d").value = "52";
  spawn(46);
  sync();
  requestAnimationFrame(frame);
})();
