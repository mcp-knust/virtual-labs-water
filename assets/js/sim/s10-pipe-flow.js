/* Session 10 — Darcy–Weisbach head loss with Colebrook–White friction factor. */
(function () {
  "use strict";

  var W = 560, H = 340;
  var G = 9.81, RHO = 1000, NU = 1.004e-6;
  var EPS_MM = 0.0015;

  function $(id) { return document.getElementById(id); }

  var s = { D: 0.15, L: 500, Q: 0.020, sumK: 5, eps: 0.0015e-3, v: 0, Re: 0, f: 0, hf: 0, hm: 0, h: 0, grad: 0, power: 0 };

  var c = Lab.ctx2d($("s10-canvas"), W, H);

  function label(text, x, y, size, color, align, weight) {
    c.font = (weight || 500) + " " + (size || 11) + "px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = color || "#3d464e";
    c.textAlign = align || "left";
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }

  function frictionFactor(Re, epsD) {
    if (Re <= 1e-6) return 0;
    if (Re < 2300) return 64 / Re;
    var f = 0.03;
    for (var i = 0; i < 80; i++) {
      var inv = -2 * Math.log10(epsD / 3.7 + 2.51 / (Re * Math.sqrt(f)));
      var fn = 1 / (inv * inv);
      if (!isFinite(fn)) break;
      if (Math.abs(fn - f) < 1e-10) { f = fn; break; }
      f = 0.5 * f + 0.5 * fn;
    }
    return f;
  }

  function recompute() {
    var area = Math.PI * s.D * s.D / 4;
    s.v = s.Q / area;
    s.Re = (s.v * s.D) / NU;
    s.f = frictionFactor(s.Re, s.eps / s.D);
    var hv = (s.v * s.v) / (2 * G);
    s.hf = s.f * (s.L / s.D) * hv;
    s.hm = s.sumK * hv;
    s.h = s.hf + s.hm;
    s.grad = (s.hf / s.L) * 1000;
    s.power = (RHO * G * s.Q * (s.h + 25)) / 0.70 / 1000; // +25 m assumed static lift
    return area;
  }

  /* ---------------- drawing ---------------- */

  var phase = 0;

  function draw() {
    c.clearRect(0, 0, W, H);

    c.fillStyle = "#efece6";
    c.fillRect(0, 288, W, H - 288);
    c.strokeStyle = "#d8d3ca";
    c.beginPath(); c.moveTo(0, 288); c.lineTo(W, 288); c.stroke();

    var x0 = 60, x1 = 500, cy = 176, r = 40;

    // pipe walls
    c.fillStyle = "#e8e4dc";
    c.fillRect(x0, cy - r - 8, x1 - x0, 8);
    c.fillRect(x0, cy + r, x1 - x0, 8);
    c.strokeStyle = "#b9b3a8";
    c.lineWidth = 1;
    c.strokeRect(x0, cy - r - 8, x1 - x0, 8);
    c.strokeRect(x0, cy + r, x1 - x0, 8);

    // water
    c.fillStyle = "rgba(150,200,220,0.30)";
    c.fillRect(x0, cy - r, x1 - x0, r * 2);

    // roughness hatching on the inner walls
    c.strokeStyle = "rgba(140,130,112,0.55)";
    c.lineWidth = 1;
    var rough = Math.min(1, s.eps / (0.5e-3));
    for (var hx = x0; hx < x1; hx += 9) {
      c.beginPath();
      c.moveTo(hx, cy - r);
      c.lineTo(hx + 3 + rough * 2, cy - r + 3 + rough * 3);
      c.stroke();
      c.beginPath();
      c.moveTo(hx, cy + r);
      c.lineTo(hx + 3 + rough * 2, cy + r - 3 - rough * 3);
      c.stroke();
    }

    // flanges
    c.fillStyle = "#cdd6dc";
    c.fillRect(x0 - 8, cy - r - 12, 8, r * 2 + 24);
    c.fillRect(x1, cy - r - 12, 8, r * 2 + 24);
    c.strokeStyle = "#8fa0ab";
    c.strokeRect(x0 - 8, cy - r - 12, 8, r * 2 + 24);
    c.strokeRect(x1, cy - r - 12, 8, r * 2 + 24);

    // flow particles
    var speed = Math.min(3.2, 0.4 + s.v * 1.1);
    for (var i = 0; i < 46; i++) {
      var px = x0 + ((i / 46) * (x1 - x0) + phase * speed * 12) % (x1 - x0);
      var py = cy - r + 8 + ((i * 37) % (r * 2 - 16));
      c.beginPath();
      c.arc(px, py, 1.8, 0, Math.PI * 2);
      c.fillStyle = "rgba(70,130,160,0.55)";
      c.fill();
    }

    // flow arrow
    c.strokeStyle = "#0b5c8a";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x1 - 60, cy);
    c.lineTo(x1 - 30, cy);
    c.stroke();
    c.beginPath();
    c.moveTo(x1 - 30, cy);
    c.lineTo(x1 - 38, cy - 5);
    c.lineTo(x1 - 38, cy + 5);
    c.closePath();
    c.fillStyle = "#0b5c8a";
    c.fill();

    // gauges
    pressureGauge(110, 96, s.h + 30, "P₁");
    pressureGauge(452, 96, 30, "P₂");

    // head loss bracket
    c.strokeStyle = "#8a4a12";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(150, 126);
    c.lineTo(412, 126);
    c.stroke();
    c.beginPath();
    c.moveTo(150, 121);
    c.lineTo(150, 131);
    c.moveTo(412, 121);
    c.lineTo(412, 131);
    c.stroke();

    c.font = "600 11px ui-monospace, Menlo, Consolas, monospace";
    c.fillStyle = "#8a4a12";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("ΔH = " + s.h.toFixed(2) + " m", 281, 114);

    // data strip
    label("D = " + (s.D * 1000).toFixed(0) + " mm  ·  L = " + s.L + " m  ·  ε = " + (s.eps * 1000).toFixed(3) + " mm", x0, 232, 10, "#3d464e");
    label("V = " + s.v.toFixed(2) + " m/s  ·  Re = " + (s.Re > 1e4 ? (s.Re / 1000).toFixed(0) + "k" : s.Re.toFixed(0)) + "  ·  f = " + s.f.toFixed(4), x0, 250, 10, "#3d464e");
    label(s.Re < 2300 ? "laminar flow" : s.Re < 4000 ? "transitional" : "turbulent flow", x0, 268, 10, s.Re < 2300 ? "#8a4a12" : "#16603f");

    // velocity band
    var bx = 320, by = 236, bw = 180, bh = 12;
    label("VELOCITY", bx, by - 10, 8.5, "#6b757e", "left", 700);
    c.fillStyle = "#eae6de";
    c.fillRect(bx, by, bw, bh);
    c.fillStyle = "rgba(141,32,32,0.16)";
    c.fillRect(bx, by, bw * (0.6 / 3), bh);
    c.fillStyle = "rgba(141,32,32,0.16)";
    c.fillRect(bx + bw * (1.5 / 3), by, bw * (1.5 / 3), bh);
    c.fillStyle = "rgba(22,96,63,0.16)";
    c.fillRect(bx + bw * (0.6 / 3), by, bw * (0.9 / 3), bh);
    c.strokeStyle = "#b9b3a8";
    c.strokeRect(bx, by, bw, bh);

    var vx = bx + bw * Math.min(1, s.v / 3);
    c.beginPath();
    c.moveTo(vx, by - 2);
    c.lineTo(vx - 4, by - 8);
    c.lineTo(vx + 4, by - 8);
    c.closePath();
    c.fillStyle = "#16191c";
    c.fill();
    c.font = "8.5px ui-monospace, Menlo, Consolas, monospace";
    c.fillStyle = "#6b757e";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("0.6", bx + bw * (0.6 / 3), by + bh + 8);
    c.fillText("1.5", bx + bw * (1.5 / 3), by + bh + 8);
    c.textAlign = "left";
    c.fillText("3.0", bx + bw, by + bh + 8);
  }

  function pressureGauge(cx, cy, head, name) {
    var r = 26;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fillStyle = "#fbfaf8";
    c.fill();
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.6;
    c.stroke();

    // needle: 0..60 m
    var ang = -Math.PI * 0.75 + (Math.min(60, Math.max(0, head)) / 60) * Math.PI * 1.5;
    c.strokeStyle = "#8a4a12";
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(ang) * (r - 6), cy + Math.sin(ang) * (r - 6));
    c.stroke();
    c.beginPath();
    c.arc(cx, cy, 2.4, 0, Math.PI * 2);
    c.fillStyle = "#3d464e";
    c.fill();

    c.font = "8.5px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = "#3d464e";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(name, cx, cy + r + 8);
    c.font = "9px ui-monospace, Menlo, Consolas, monospace";
    c.fillStyle = "#6b757e";
    c.fillText(head.toFixed(1) + " m", cx, cy + r + 20);
  }

  /* ---------------- sync ---------------- */

  function sync() {
    s.eps = Number($("s10-mat").value) * 1e-3;
    s.D = Number($("s10-d").value) / 1000;
    s.L = Number($("s10-l").value);
    s.Q = Number($("s10-q").value) / 1000;
    s.sumK = Number($("s10-k").value) / 10;

    recompute();

    $("s10-d-v").textContent = (s.D * 1000).toFixed(0) + " mm";
    $("s10-l-v").textContent = s.L + " m";
    $("s10-q-v").textContent = (s.Q * 1000).toFixed(1) + " L/s";
    $("s10-k-v").textContent = s.sumK.toFixed(1);

    $("s10-h").innerHTML = s.h.toFixed(2) + " <small>m</small>";
    $("s10-v").textContent = s.v.toFixed(2) + " m/s";
    $("s10-re").textContent = s.Re > 1e4 ? (s.Re / 1000).toFixed(1) + " × 10³" : s.Re.toFixed(0);
    $("s10-f").textContent = s.f.toFixed(4);
    $("s10-hf").textContent = s.hf.toFixed(2) + " m";
    $("s10-hm").textContent = s.hm.toFixed(2) + " m";
    $("s10-grad").textContent = s.grad.toFixed(1) + " m/km";
    $("s10-p").textContent = s.power.toFixed(1) + " kW";

    var chip = $("s10-chip");
    if (s.v < 0.6) {
      chip.className = "chip warn";
      chip.textContent = "Velocity below 0.6 m/s — solids may settle";
    } else if (s.v <= 1.5) {
      chip.className = "chip ok";
      chip.textContent = "Velocity within 0.6–1.5 m/s";
    } else {
      chip.className = "chip bad";
      chip.textContent = "Velocity above 1.5 m/s — erosion, surge risk";
    }

    draw();
    drawCurve();
  }

  function drawCurve() {
    var qmax = Math.max(0.05, s.Q * 2.2);
    var pts = [];
    for (var i = 0; i <= 120; i++) {
      var q = (i / 120) * qmax;
      var area = Math.PI * s.D * s.D / 4;
      var v = q / area;
      var re = (v * s.D) / NU;
      var f = frictionFactor(re, s.eps / s.D);
      var hv = (v * v) / (2 * G);
      pts.push([q * 1000, (f * (s.L / s.D) * hv) + s.sumK * hv]);
    }

    Lab.chart($("s10-curve"), {
      height: 250,
      x: { min: 0, max: qmax * 1000, label: "Flow (L/s)" },
      y: { min: 0, max: Math.max(2, s.h * 1.8), label: "Total head loss (m)" },
      series: [{ pts: pts, color: "#0b5c8a", width: 2 }],
      marker: { x: s.Q * 1000, y: s.h, label: s.h.toFixed(2) + " m" }
    });
  }

  /* ---------------- actions ---------------- */

  var run = 0;

  function record() {
    run++;
    Lab.addRow("s10-table", [
      run,
      (s.D * 1000).toFixed(0),
      (s.Q * 1000).toFixed(1),
      s.v.toFixed(2),
      s.Re > 1e4 ? (s.Re / 1000).toFixed(0) + "k" : s.Re.toFixed(0),
      s.f.toFixed(4),
      s.hf.toFixed(2),
      s.h.toFixed(2)
    ]);
  }

  function report() {
    Lab.report({
      slug: "session-10-pipe-flow",
      title: "Session 10 — Head Loss in Water Distribution Pipes",
      session: "10",
      tableId: "s10-table",
      values: [
        ["Internal diameter", (s.D * 1000).toFixed(0) + " mm"],
        ["Length", s.L + " m"],
        ["Roughness", (s.eps * 1000).toFixed(3) + " mm"],
        ["Flow", (s.Q * 1000).toFixed(1) + " L/s"],
        ["Velocity", s.v.toFixed(2) + " m/s"],
        ["Reynolds number", s.Re.toFixed(0)],
        ["Friction factor", s.f.toFixed(4)],
        ["Friction loss", s.hf.toFixed(2) + " m"],
        ["Minor losses (ΣK = " + s.sumK.toFixed(1) + ")", s.hm.toFixed(2) + " m"],
        ["Total head loss", s.h.toFixed(2) + " m"],
        ["Hydraulic gradient", s.grad.toFixed(1) + " m/km"],
        ["Pumping power (incl. 25 m lift, η = 70%)", s.power.toFixed(1) + " kW"]
      ],
      notes:
        "Head loss from Darcy–Weisbach, h_f = f(L/D)(V²/2g), with f from Colebrook–White solved by iteration " +
        "and 64/Re in the laminar range. Minor losses from ΣK(V²/2g). Pumping power includes an assumed 25 m " +
        "static lift at 70% efficiency."
    });
  }

  function animate() {
    phase += 0.02;
    draw();
    requestAnimationFrame(animate);
  }

  $("s10-mat").addEventListener("change", sync);
  $("s10-d").addEventListener("input", sync);
  $("s10-l").addEventListener("input", sync);
  $("s10-q").addEventListener("input", sync);
  $("s10-k").addEventListener("input", sync);
  $("s10-record").addEventListener("click", record);
  $("s10-report").addEventListener("click", report);

  sync();
  requestAnimationFrame(animate);
})();
