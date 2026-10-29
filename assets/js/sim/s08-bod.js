/* Session 08 — Winkler DO titration, BOD5 with seeded blank, and Streeter–Phelps oxygen sag. */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  var N_THIO = 0.025;

  /* ---------------- 8A : Winkler ---------------- */

  var a = { do: 7.8, vs: 200, v: 0, ve: 7.8 };
  var ca = Lab.ctx2d($("s8a-canvas"), 560, 340);

  function labelOn(c, text, x, y, size, color, align, weight) {
    c.font = (weight || 500) + " " + (size || 11) + "px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = color || "#3d464e";
    c.textAlign = align || "left";
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }

  function drawA() {
    var c = ca;
    c.clearRect(0, 0, 560, 340);

    c.fillStyle = "#efece6";
    c.fillRect(0, 300, 560, 40);
    c.strokeStyle = "#d8d3ca";
    c.beginPath(); c.moveTo(0, 300); c.lineTo(560, 300); c.stroke();

    // burette
    var bx = 150, bw = 26, btop = 34, bbot = 230;
    c.fillStyle = "#eef1f3";
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.5;
    c.beginPath(); c.rect(bx, btop, bw, bbot - btop); c.fill(); c.stroke();

    var frac = Math.min(1, a.v / 50);
    var levelY = btop + 6 + frac * (bbot - btop - 12);
    c.save();
    c.beginPath(); c.rect(bx + 1.5, btop + 1.5, bw - 3, bbot - btop - 3); c.clip();
    c.fillStyle = "rgba(214,226,238,0.9)";
    c.fillRect(bx + 1.5, levelY, bw - 3, bbot - levelY);
    c.restore();

    c.font = "8.5px ui-monospace, Menlo, Consolas, monospace";
    c.fillStyle = "#5c666f";
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.strokeStyle = "#7d8b95";
    c.lineWidth = 1;
    for (var g = 0; g <= 10; g += 1) {
      var gy = btop + 6 + (g / 10) * (bbot - btop - 12);
      c.beginPath(); c.moveTo(bx, gy); c.lineTo(bx + (g % 5 === 0 ? 9 : 5), gy); c.stroke();
      if (g % 5 === 0) c.fillText(String(g), bx + 12, gy);
    }

    c.fillStyle = "#d8d3ca";
    c.beginPath(); c.arc(bx + bw / 2, bbot + 4, 6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#8fa0ab"; c.stroke();
    c.beginPath();
    c.moveTo(bx + bw / 2, bbot + 10);
    c.lineTo(bx + bw / 2 - 3, bbot + 28);
    c.lineTo(bx + bw / 2 + 3, bbot + 28);
    c.closePath();
    c.fillStyle = "#eef1f3"; c.fill(); c.stroke();

    labelOn(c, "0.025 N Na₂S₂O₃", bx + bw / 2, 20, 10, "#3d464e", "center", 600);

    // conical flask
    var fx = 250;
    c.beginPath();
    c.moveTo(fx - 10, 252);
    c.lineTo(fx - 10, 276);
    c.lineTo(fx - 54, 296);
    c.quadraticCurveTo(fx - 58, 302, fx - 48, 302);
    c.lineTo(fx + 48, 302);
    c.quadraticCurveTo(fx + 58, 302, fx + 54, 296);
    c.lineTo(fx + 10, 276);
    c.lineTo(fx + 10, 252);
    c.closePath();
    c.fillStyle = "#f7f6f2"; c.fill();
    c.strokeStyle = "#8fa0ab"; c.lineWidth = 1.5; c.stroke();

    var remain = Math.max(0, 1 - a.v / Math.max(0.01, a.ve));
    var col;
    if (a.v >= a.ve) col = "rgba(246,246,242,0.55)";
    else if (remain < 0.15) col = "rgba(238,226,150,0.75)";
    else if (remain < 0.45) col = "rgba(226,196,88,0.75)";
    else col = "rgba(198,150,40,0.72)";

    c.save();
    c.beginPath();
    c.moveTo(fx - 10, 264);
    c.lineTo(fx - 10, 276);
    c.lineTo(fx - 54, 296);
    c.quadraticCurveTo(fx - 58, 302, fx - 48, 302);
    c.lineTo(fx + 48, 302);
    c.quadraticCurveTo(fx + 58, 302, fx + 54, 296);
    c.lineTo(fx + 10, 276);
    c.lineTo(fx + 10, 264);
    c.closePath();
    c.clip();
    c.fillStyle = col;
    c.fillRect(fx - 60, 264, 120, 40);
    c.restore();

    labelOn(c, a.v >= a.ve ? "colourless — end point" : "iodine colour", fx, 316, 9.5, a.v >= a.ve ? "#16603f" : "#8a4a12", "center");

    // starch note
    var starch = a.v > a.ve * 0.85;
    labelOn(c, starch ? "starch added → blue" : "starch not yet added", fx, 334, 9, "#6b757e", "center");

    // readings panel
    var px = 344, py = 60;
    c.fillStyle = "#e9e6e0";
    c.strokeStyle = "#b9b3a8";
    c.beginPath(); c.rect(px, py, 176, 168); c.fill(); c.stroke();
    labelOn(c, "WINKLER TITRATION", px + 12, py + 14, 8.5, "#6b757e", "left", 700);

    c.fillStyle = "#1c2226";
    c.fillRect(px + 12, py + 26, 152, 48);
    c.fillStyle = a.v >= a.ve ? "#7fe3b0" : "#d9a06a";
    c.font = "600 22px ui-monospace, Menlo, Consolas, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(a.v.toFixed(2), px + 88, py + 44);
    c.font = "9px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = "#8fa0ab";
    c.fillText("mL titrant", px + 88, py + 64);

    labelOn(c, "aliquot " + a.vs + " mL", px + 12, py + 88, 10, "#3d464e");
    labelOn(c, "DO " + ((a.v * N_THIO * 8000) / a.vs).toFixed(2) + " mg/L", px + 12, py + 106, 11, "#16191c", "left", 600);
    labelOn(c, "end point " + a.ve.toFixed(2) + " mL", px + 12, py + 124, 9.5, "#6b757e");
    labelOn(c, "I₂ + 2S₂O₃²⁻ → 2I⁻", px + 12, py + 144, 9, "#6b757e");
    labelOn(c, a.v >= a.ve ? "end point reached" : "titrating", px + 12, py + 160, 9.5, a.v >= a.ve ? "#16603f" : "#8a4a12");
  }

  function syncA() {
    a.do = Number($("s8a-do").value) / 10;
    a.vs = Number($("s8a-vs").value);
    a.ve = (a.do * a.vs) / (N_THIO * 8000);
    var slider = $("s8a-v");
    slider.max = String(Math.round(Math.max(0.5, a.ve * 1.4) * 100));
    a.v = Number(slider.value) / 100;
    if (a.v > a.ve * 1.4) { a.v = a.ve * 1.4; slider.value = String(Math.round(a.v * 100)); }

    $("s8a-do-v").textContent = a.do.toFixed(1) + " mg/L";
    $("s8a-vs-v").textContent = a.vs + " mL";
    $("s8a-v-v").textContent = a.v.toFixed(2) + " mL";
    $("s8a-ve").textContent = a.ve.toFixed(2) + " mL";
    $("s8a-res").innerHTML = ((a.v * N_THIO * 8000) / a.vs).toFixed(2) + " <small>mg/L</small>";

    var pct = (a.do / 9.09) * 100;
    $("s8a-status").textContent = a.do >= 5 ? "Adequate (" + pct.toFixed(0) + "% sat.)"
      : a.do >= 4 ? "Marginal" : "Low — stress for aquatic life";

    drawA();
  }

  /* ---------------- 8B : BOD ---------------- */

  var b = { bod: 220, P: 0.02, seed: 0.20, k: 0.20, d1: 8.9, d2: 0, computed: 0, valid: true, l0: 0 };

  var cb = Lab.ctx2d($("s8b-canvas"), 560, 340);

  function drawB() {
    var c = cb;
    c.clearRect(0, 0, 560, 340);

    c.fillStyle = "#efece6";
    c.fillRect(0, 300, 560, 40);
    c.strokeStyle = "#d8d3ca";
    c.beginPath(); c.moveTo(0, 300); c.lineTo(560, 300); c.stroke();

    // incubator
    var ix = 40, iy = 56, iw = 250, ih = 224;
    c.fillStyle = "#f4f6f7";
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 2;
    c.beginPath(); c.rect(ix, iy, iw, ih); c.fill(); c.stroke();
    labelB(c, "INCUBATOR 20 °C", ix + 12, iy + 16, 9, "#6b757e", "left", 700);

    // bottle
    var bx = ix + 60, by = iy + 44, bw = 74, bh = 140;
    c.beginPath();
    c.moveTo(bx + 20, by);
    c.lineTo(bx + 20, by + 20);
    c.lineTo(bx, by + 40);
    c.lineTo(bx, by + bh - 10);
    c.quadraticCurveTo(bx, by + bh, bx + 10, by + bh);
    c.lineTo(bx + bw - 10, by + bh);
    c.quadraticCurveTo(bx + bw, by + bh, bx + bw, by + bh - 10);
    c.lineTo(bx + bw, by + 40);
    c.lineTo(bx + bw - 20, by + 20);
    c.lineTo(bx + bw - 20, by);
    c.closePath();
    c.fillStyle = "#fbfaf8"; c.fill();
    c.strokeStyle = "#8fa0ab"; c.lineWidth = 1.5; c.stroke();

    // stopper
    c.fillStyle = "#d8d3ca";
    c.fillRect(bx + 18, by - 10, 38, 12);

    // liquid: level reflects remaining DO
    var fill = 0.35 + 0.55 * Math.max(0, Math.min(1, b.d2 / 9));
    var liqTop = by + 40 + (1 - fill) * (bh - 50);
    c.fillStyle = "rgba(150,196,214,0.45)";
    c.fillRect(bx + 2, liqTop, bw - 4, by + bh - liqTop - 2);
    c.beginPath();
    c.ellipse(bx + bw / 2, liqTop, bw / 2 - 3, 3, 0, 0, Math.PI * 2);
    c.fillStyle = "rgba(120,180,205,0.55)";
    c.fill();

    labelB(c, "300 mL", bx + bw / 2, by + bh + 14, 9, "#6b757e", "center");

    // probe
    c.strokeStyle = "#5c666f";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(ix + iw - 30, iy + 20);
    c.lineTo(ix + iw - 30, by + 70);
    c.stroke();
    c.fillStyle = "#cdd6dc";
    c.fillRect(ix + iw - 36, by + 70, 12, 22);

    // thermometer
    c.fillStyle = "#e9e6e0";
    c.fillRect(ix + 18, iy + 44, 14, 90);
    c.strokeStyle = "#b9b3a8";
    c.strokeRect(ix + 18, iy + 44, 14, 90);
    c.fillStyle = "#c2543c";
    c.fillRect(ix + 22, iy + 60, 6, 74);
    labelB(c, "20", ix + 25, iy + 40, 9, "#6b757e", "center");
    labelB(c, "°C", ix + 25, iy + 142, 9, "#6b757e", "center");

    // five-day dial
    var dx = 342, dy = 70, dr = 44;
    c.beginPath();
    c.arc(dx, dy, dr, 0, Math.PI * 2);
    c.strokeStyle = "#d8d3ca";
    c.lineWidth = 8;
    c.stroke();
    c.beginPath();
    c.arc(dx, dy, dr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (5 / 5));
    c.strokeStyle = "#0b5c8a";
    c.lineWidth = 8;
    c.stroke();
    c.font = "600 18px ui-monospace, Menlo, Consolas, monospace";
    c.fillStyle = "#16191c";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("5 d", dx, dy - 4);
    c.font = "9px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = "#6b757e";
    c.fillText("incubation", dx, dy + 14);

    // readings
    var rx = 404, ry = 140;
    c.fillStyle = "#e9e6e0";
    c.strokeStyle = "#b9b3a8";
    c.lineWidth = 1.2;
    c.beginPath(); c.rect(rx, ry, 130, 116); c.fill(); c.stroke();
    labelB(c, "D₁  " + b.d1.toFixed(1) + " mg/L", rx + 10, ry + 16, 10, "#3d464e");
    labelB(c, "D₂  " + b.d2.toFixed(1) + " mg/L", rx + 10, ry + 34, 10, "#3d464e");
    labelB(c, "Δ   " + (b.d1 - b.d2).toFixed(1) + " mg/L", rx + 10, ry + 52, 10, "#3d464e");

    c.fillStyle = "#1c2226";
    c.fillRect(rx + 8, ry + 64, 114, 40);
    c.fillStyle = b.valid ? "#7fe3b0" : "#e3a08a";
    c.font = "600 17px ui-monospace, Menlo, Consolas, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(b.valid ? b.computed.toFixed(0) : "—", rx + 65, ry + 78);
    c.font = "8.5px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = "#8fa0ab";
    c.fillText("BOD₅ mg/L", rx + 65, ry + 94);

    labelB(c, b.valid ? "valid dilution" : "reject dilution", rx + 65, ry + 112, 9.5, b.valid ? "#16603f" : "#8d2020", "center");
  }

  function labelB(c, text, x, y, size, color, align, weight) {
    c.font = (weight || 500) + " " + (size || 11) + "px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = color || "#3d464e";
    c.textAlign = align || "left";
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }

  function syncB() {
    b.bod = Number($("s8b-bod").value);
    b.P = Number($("s8b-p").value) / 100;
    b.seed = Number($("s8b-seed").value) / 100;
    b.k = Number($("s8b-k").value) / 100;

    b.d1 = 8.9;
    var depletion = b.bod * b.P + b.seed * (1 - b.P);
    b.d2 = Math.max(0, Math.round((b.d1 - depletion) * 10) / 10);

    // measurement resolution: readings to 0.1 mg/L
    var d1r = Math.round(b.d1 * 10) / 10;
    b.computed = ((d1r - b.d2) - b.seed * (1 - b.P)) / b.P;
    b.valid = (d1r - b.d2) >= 2.0 && b.d2 >= 1.0;
    b.l0 = b.computed / (1 - Math.exp(-5 * b.k));

    $("s8b-bod-v").textContent = b.bod + " mg/L";
    $("s8b-p-v").textContent = b.P.toFixed(3);
    $("s8b-seed-v").textContent = b.seed.toFixed(2) + " mg/L";
    $("s8b-k-v").textContent = b.k.toFixed(2) + " /d";

    $("s8b-res").innerHTML = (b.valid ? b.computed.toFixed(0) : "—") + " <small>mg/L</small>";
    $("s8b-d1").textContent = b.d1.toFixed(1) + " mg/L";
    $("s8b-d2").textContent = b.d2.toFixed(1) + " mg/L";
    $("s8b-dep").textContent = (b.d1 - b.d2).toFixed(1) + " mg/L";
    $("s8b-l0").textContent = b.valid ? b.l0.toFixed(0) + " mg/L" : "—";
    $("s8b-valid").textContent = b.valid ? "Accept" : "Reject";
    $("s8b-valid").className = "chip " + (b.valid ? "ok" : "bad");

    drawB();
    drawBodCurve();
    drawSag();
  }

  function drawBodCurve() {
    var pts = [];
    var l0 = Math.max(1, b.l0);
    for (var i = 0; i <= 100; i++) {
      var t = (i / 100) * 20;
      pts.push([t, l0 * (1 - Math.exp(-b.k * t))]);
    }
    Lab.chart($("s8b-curve"), {
      height: 230,
      x: { min: 0, max: 20, label: "Time (days)" },
      y: { min: 0, max: Math.max(10, l0 * 1.05), label: "BOD exerted (mg/L)" },
      series: [{ pts: pts, color: "#0b5c8a", width: 2 }],
      marker: { x: 5, y: Math.min(l0, b.computed), label: "BOD₅ " + (b.valid ? b.computed.toFixed(0) : "—") }
    });
  }

  function drawSag() {
    var kd = b.k, kr = 0.45, d0 = 0.5;
    var l0 = Math.max(1, b.l0);
    var pts = [];
    var minDo = 99, minT = 0;
    for (var i = 0; i <= 140; i++) {
      var t = (i / 140) * 15;
      var deficit = (kd * l0 / (kr - kd)) * (Math.exp(-kd * t) - Math.exp(-kr * t)) + d0 * Math.exp(-kr * t);
      var doVal = 9.09 - deficit;
      pts.push([t, doVal]);
      if (doVal < minDo) { minDo = doVal; minT = t; }
    }

    var tc = 0, dc = 0;
    var arg = (kr / kd) * (1 - (d0 * (kr - kd)) / (kd * l0));
    if (arg > 0 && kr !== kd) {
      tc = Math.log(arg) / (kr - kd);
      if (tc > 0 && tc < 15) {
        dc = 9.09 - ((kd * l0 / (kr - kd)) * (Math.exp(-kd * tc) - Math.exp(-kr * tc)) + d0 * Math.exp(-kr * tc));
      } else { tc = 0; }
    }

    Lab.chart($("s8b-sag"), {
      height: 230,
      x: { min: 0, max: 15, label: "Travel time downstream (days)" },
      y: { min: 0, max: 10, label: "Dissolved oxygen (mg/L)" },
      series: [
        { pts: pts, color: "#0b5c8a", width: 2 },
        { pts: [[0, 5], [15, 5]], color: "#8d2020", dash: [5, 4], width: 1.2 }
      ],
      marker: { x: tc, y: Math.max(0, dc), label: "critical " + Math.max(0, dc).toFixed(1) + " mg/L" },
      bands: [{ from: 0, to: 5, color: "rgba(141,32,32,0.06)" }]
    });
  }

  /* ---------------- actions ---------------- */

  var runA = 0, runB = 0;

  function recordA() {
    runA++;
    Lab.addRow("s8a-table", [
      runA,
      a.vs,
      a.v.toFixed(2),
      ((a.v * N_THIO * 8000) / a.vs).toFixed(2)
    ]);
  }

  function recordB() {
    runB++;
    Lab.addRow("s8b-table", [
      runB,
      b.P.toFixed(3),
      b.d1.toFixed(1),
      b.d2.toFixed(1),
      b.valid ? b.computed.toFixed(0) : "—",
      b.valid ? "Accept" : "Reject"
    ]);
  }

  function reportA() {
    Lab.report({
      slug: "session-08-do",
      title: "Session 08A — Dissolved Oxygen by Winkler Titration",
      session: "08",
      tableId: "s8a-table",
      values: [
        ["Aliquot titrated", a.vs + " mL"],
        ["Thiosulphate normality", "0.025 N"],
        ["End point volume", a.ve.toFixed(2) + " mL"],
        ["Computed DO", ((a.v * N_THIO * 8000) / a.vs).toFixed(2) + " mg/L"],
        ["Saturation at 20 °C", "9.09 mg/L"],
        ["Percent saturation", ((a.do / 9.09) * 100).toFixed(0) + "%"]
      ],
      notes:
        "DO computed as (V × N × 8000)/V_aliquot. With 0.025 N thiosulphate and a 200 mL aliquot, " +
        "1 mL of titrant equals 1 mg/L DO."
    });
  }

  function reportB() {
    Lab.report({
      slug: "session-08-bod",
      title: "Session 08B — BOD₅ and Oxygen Sag",
      session: "08",
      tableId: "s8b-table",
      values: [
        ["Sample fraction P", b.P.toFixed(3)],
        ["Initial DO D₁", b.d1.toFixed(1) + " mg/L"],
        ["Day-5 DO D₂", b.d2.toFixed(1) + " mg/L"],
        ["Depletion", (b.d1 - b.d2).toFixed(1) + " mg/L"],
        ["Seed depletion", b.seed.toFixed(2) + " mg/L"],
        ["BOD₅", b.valid ? b.computed.toFixed(0) + " mg/L" : "rejected dilution"],
        ["Deoxygenation constant k", b.k.toFixed(2) + " /d"],
        ["Ultimate BOD L₀", b.valid ? b.l0.toFixed(0) + " mg/L" : "—"],
        ["Dilution validity", b.valid ? "Accept" : "Reject"]
      ],
      notes:
        "BOD₅ = [(D₁−D₂) − (B₁−B₂)(1−P)]/P. A dilution is accepted only with at least 2 mg/L depletion " +
        "and at least 1 mg/L residual DO. L₀ = BOD₅/(1−e^(−5k))."
    });
  }

  $("s8a-do").addEventListener("input", syncA);
  $("s8a-vs").addEventListener("input", function () { $("s8a-v").value = "0"; syncA(); });
  $("s8a-v").addEventListener("input", syncA);
  $("s8a-record").addEventListener("click", recordA);
  $("s8a-report").addEventListener("click", reportA);

  $("s8b-bod").addEventListener("input", syncB);
  $("s8b-p").addEventListener("input", syncB);
  $("s8b-seed").addEventListener("input", syncB);
  $("s8b-k").addEventListener("input", syncB);
  $("s8b-record").addEventListener("click", recordB);
  $("s8b-report").addEventListener("click", reportB);

  syncA();
  syncB();
})();
