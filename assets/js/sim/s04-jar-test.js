/* Session 04 — Six-place jar test: alum dose optimisation with a pH efficiency window. */
(function () {
  "use strict";

  var W = 560, H = 330;

  function $(id) { return document.getElementById(id); }

  var s = { raw: 45, ph: 7.0, t: 30, d0: 4, di: 5, jars: [], opt: null, phase: 0 };

  var c = Lab.ctx2d($("s4-canvas"), W, H);

  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function label(text, x, y, size, color, align, weight) {
    c.font = (weight || 500) + " " + (size || 11) + "px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = color || "#3d464e";
    c.textAlign = align || "left";
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }

  /* ---------------- model ---------------- */

  function optimumDose(raw) { return 2 + 0.5 * Math.pow(raw, 0.8); }

  function removalAt(dose, raw, ph, t) {
    var dopt = optimumDose(raw);
    var sigma = 0.45 * dopt;
    var doseFactor = Math.exp(-Math.pow(dose - dopt, 2) / (2 * sigma * sigma));
    var phFactor = Math.exp(-Math.pow(ph - 6.5, 2) / (2 * 1.0 * 1.0));
    var settleFactor = 1 - Math.exp(-t / 8);
    var rmax = raw > 60 ? 0.985 : 0.955;
    // over-dosing beyond twice the optimum also loses efficiency from restabilisation
    var restab = dose > 2.2 * dopt ? Math.max(0.55, 1 - 0.045 * (dose - 2.2 * dopt)) : 1;
    return Math.min(0.995, rmax * doseFactor * phFactor * settleFactor * restab);
  }

  function residualAt(dose, raw, ph, t) {
    return raw * (1 - removalAt(dose, raw, ph, t)) + 0.35;
  }

  function buildJars() {
    s.jars = [];
    for (var i = 0; i < 6; i++) {
      var dose = s.d0 + i * s.di;
      var res = residualAt(dose, s.raw, s.ph, s.t);
      var seed = 1000 + i * 37;
      var rnd = mulberry(seed);
      var particles = [];
      var n = Math.round(10 + Math.min(120, res * 1.4));
      for (var p = 0; p < n; p++) {
        particles.push({
          x: rnd(), y: rnd(), r: 0.7 + rnd() * 2.0, sp: 0.4 + rnd() * 0.8,
          y0: rnd()
        });
      }
      s.jars.push({
        dose: dose, residual: res,
        removal: (s.raw - res) / s.raw,
        particles: particles
      });
    }
    var best = s.jars[0];
    s.jars.forEach(function (j) { if (j.residual < best.residual) best = j; });
    s.opt = best;
  }

  /* ---------------- drawing ---------------- */

  function draw() {
    c.clearRect(0, 0, W, H);

    c.fillStyle = "#efece6";
    c.fillRect(0, 292, W, H - 292);
    c.strokeStyle = "#d8d3ca";
    c.beginPath(); c.moveTo(0, 292); c.lineTo(W, 292); c.stroke();

    var margin = 26, gap = 8;
    var bw = (W - margin * 2 - gap * 5) / 6;
    var top = 96, h = 150;
    var settleProgress = Math.min(1, s.t / 35);

    s.jars.forEach(function (j, i) {
      var x = margin + i * (bw + gap);
      var isOpt = j === s.opt;

      // beaker body
      c.beginPath();
      c.moveTo(x, top);
      c.lineTo(x, top + h - 8);
      c.quadraticCurveTo(x, top + h, x + 8, top + h);
      c.lineTo(x + bw - 8, top + h);
      c.quadraticCurveTo(x + bw, top + h, x + bw, top + h - 8);
      c.lineTo(x + bw, top);
      c.closePath();
      c.fillStyle = "#fbfaf8";
      c.fill();
      c.strokeStyle = isOpt ? "#0b5c8a" : "#b9b3a8";
      c.lineWidth = isOpt ? 2 : 1.3;
      c.stroke();

      // liquid turbidity
      var turb = Math.min(1, j.residual / 60);
      var alpha = 0.10 + 0.62 * Math.pow(turb, 0.6);
      c.save();
      c.beginPath();
      c.moveTo(x + 1, top + 40);
      c.lineTo(x + 1, top + h - 8);
      c.quadraticCurveTo(x + 1, top + h - 1, x + 9, top + h - 1);
      c.lineTo(x + bw - 9, top + h - 1);
      c.quadraticCurveTo(x + bw - 1, top + h - 1, x + bw - 1, top + h - 8);
      c.lineTo(x + bw - 1, top + 40);
      c.closePath();
      c.clip();
      c.fillStyle = "rgba(198,188,164," + alpha.toFixed(3) + ")";
      c.fillRect(x, top + 40, bw, h);

      // flocs
      j.particles.forEach(function (p) {
        var drift = Math.sin(s.phase * p.sp + i) * 3;
        var yBase = top + 46 + p.y * (h - 54);
        var settleY = top + h - 14 - p.y * 18;
        var y = yBase + (settleY - yBase) * settleProgress;
        var rad = (isOpt ? 1.6 : 1.1) * p.r * (0.6 + settleProgress * 0.9);
        c.beginPath();
        c.arc(x + 10 + p.x * (bw - 20) + drift, y, rad, 0, Math.PI * 2);
        c.fillStyle = isOpt
          ? "rgba(70,96,88," + (0.18 + 0.35 * settleProgress).toFixed(2) + ")"
          : "rgba(110,104,90," + (0.12 + 0.28 * settleProgress).toFixed(2) + ")";
        c.fill();
      });
      c.restore();

      // label
      label(j.dose + " mg/L", x + bw / 2, top - 8, 11, isOpt ? "#07405f" : "#3d464e", "center", 600);
      c.font = "10px ui-monospace, Menlo, Consolas, monospace";
      c.fillStyle = j.residual <= 5 ? "#16603f" : "#8a4a12";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(j.residual.toFixed(1) + " NTU", x + bw / 2, top + h + 14);

      if (isOpt) {
        c.fillStyle = "#0b5c8a";
        c.font = "8.5px -apple-system, Segoe UI, Roboto, sans-serif";
        c.fillText("OPTIMUM", x + bw / 2, top + h + 30);
      }
    });

    // titles
    label("6 \u00d7 1 L beakers", margin, 30, 10, "#6b757e", "left", 700);
    label("rapid mix 200 rpm 2 min \u2192 flocculate 35 rpm 20 min \u2192 settle", margin, 50, 10.5, "#3d464e");
    label("settling " + s.t + " min", margin, 68, 10.5, s.t >= 25 ? "#16603f" : "#8a4a12");

    // pH indicator
    label("pH " + s.ph.toFixed(1), W - margin, 30, 11, "#3d464e", "right", 600);
    var phTone = s.ph < 5.5 || s.ph > 7.6 ? "#8a4a12" : "#16603f";
    label(s.ph < 5.5 || s.ph > 7.6 ? "outside alum window" : "within alum window", W - margin, 48, 9.5, phTone, "right");

    // stirrer paddles
    s.jars.forEach(function (j, i) {
      var x = margin + i * (bw + gap) + bw / 2;
      c.strokeStyle = "#b9b3a8";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x, top - 26);
      c.lineTo(x, top + 46);
      c.stroke();
      c.fillStyle = "#cdd6dc";
      c.fillRect(x - 8, top + 44, 16, 4);
    });
  }

  /* ---------------- sync ---------------- */

  function sync() {
    s.raw = Number($("s4-raw").value);
    s.ph = Number($("s4-ph").value) / 10;
    s.t = Number($("s4-t").value);
    s.d0 = Number($("s4-d0").value);
    s.di = Number($("s4-di").value);

    $("s4-raw-v").textContent = s.raw + " NTU";
    $("s4-ph-v").textContent = s.ph.toFixed(1);
    $("s4-t-v").textContent = s.t + " min";
    $("s4-d0-v").textContent = s.d0 + " mg/L";
    $("s4-di-v").textContent = s.di + " mg/L";

    buildJars();

    $("s4-opt").innerHTML = s.opt.dose + " <small>mg/L</small>";
    $("s4-res").textContent = s.opt.residual.toFixed(1) + " NTU";
    $("s4-rem").textContent = (s.opt.removal * 100).toFixed(1) + " %";
    $("s4-alk").textContent = (0.45 * s.opt.dose).toFixed(0) + " mg/L";
    $("s4-pass").textContent = s.opt.residual <= 5 ? "Pass" : "Fail";

    draw();
    drawCurve();
  }

  function drawCurve() {
    var pts = [];
    var maxDose = s.d0 + 5 * s.di;
    for (var i = 0; i <= 120; i++) {
      var d = 1 + (i / 120) * (maxDose * 1.25);
      pts.push([d, residualAt(d, s.raw, s.ph, s.t)]);
    }
    var dots = s.jars.map(function (j) { return [j.dose, j.residual]; });

    Lab.chart($("s4-curve"), {
      height: 250,
      x: { min: 0, max: maxDose * 1.25, label: "Alum dose (mg/L)" },
      y: { min: 0, max: Math.max(10, s.raw * 0.65), label: "Residual turbidity (NTU)" },
      series: [
        { pts: pts, color: "#0b5c8a", width: 2 },
        { pts: dots, color: "#8a4a12", dots: true, width: 0 }
      ],
      marker: { x: s.opt.dose, y: s.opt.residual, label: s.opt.dose + " mg/L" },
      bands: [{ from: 0, to: 5, color: "rgba(22,96,63,0.07)" }]
    });
  }

  /* ---------------- actions ---------------- */

  var run = 0;

  function record() {
    run++;
    Lab.addRow("s4-table", [
      run,
      s.raw,
      s.ph.toFixed(1),
      s.opt.dose,
      s.opt.residual.toFixed(1),
      (s.opt.removal * 100).toFixed(1)
    ]);
  }

  function report() {
    Lab.report({
      slug: "session-04-jar-test",
      title: "Session 04 — Jar Test: Coagulation and Flocculation",
      session: "04",
      tableId: "s4-table",
      values: [
        ["Raw turbidity", s.raw + " NTU"],
        ["Raw water pH", s.ph.toFixed(1)],
        ["Settling time", s.t + " min"],
        ["Dose series", s.d0 + " to " + (s.d0 + 5 * s.di) + " mg/L, step " + s.di],
        ["Optimum dose", s.opt.dose + " mg/L"],
        ["Residual at optimum", s.opt.residual.toFixed(1) + " NTU"],
        ["Removal at optimum", (s.opt.removal * 100).toFixed(1) + " %"],
        ["Alkalinity consumed", (0.45 * s.opt.dose).toFixed(0) + " mg/L as CaCO₃"]
      ],
      notes:
        "Residual turbidity was modelled as a U-shaped function of dose with a charge-neutralisation " +
        "optimum that scales with raw turbidity (d_opt ≈ 2 + 0.5·T^0.8), multiplied by a pH efficiency " +
        "factor centred on pH 6.5 and a settling factor (1 − e^(−t/8)). The optimum dose is the jar with " +
        "the lowest measured residual, not the model's d_opt."
    });
  }

  function runTest() {
    var start = 5, end = 45;
    $("s4-t").value = String(start);
    var t0 = performance.now();
    var dur = 2200;
    function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      $("s4-t").value = String(Math.round(start + (end - start) * k));
      sync();
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* flowing animation of the flocs */
  function animate() {
    s.phase += 0.03;
    draw();
    requestAnimationFrame(animate);
  }

  $("s4-raw").addEventListener("input", sync);
  $("s4-ph").addEventListener("input", sync);
  $("s4-t").addEventListener("input", sync);
  $("s4-d0").addEventListener("input", sync);
  $("s4-di").addEventListener("input", sync);
  $("s4-record").addEventListener("click", record);
  $("s4-report").addEventListener("click", report);
  $("s4-run").addEventListener("click", runTest);

  sync();
  animate();
})();
