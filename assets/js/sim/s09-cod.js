/* Session 09 — COD by dichromate reflux and FAS titration, with BOD/COD biodegradability. */
(function () {
  "use strict";

  var W = 560, H = 360;
  var V_BLANK = 25.00;

  function $(id) { return document.getElementById(id); }

  var s = { cod: 240, vs: 20, n: 0.25, v: 0, ve: 0, bod: 120, over: false };

  var c = Lab.ctx2d($("s9-canvas"), W, H);

  function label(text, x, y, size, color, align, weight) {
    c.font = (weight || 500) + " " + (size || 11) + "px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = color || "#3d464e";
    c.textAlign = align || "left";
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }

  function draw() {
    c.clearRect(0, 0, W, H);

    c.fillStyle = "#efece6";
    c.fillRect(0, 320, W, H - 320);
    c.strokeStyle = "#d8d3ca";
    c.beginPath(); c.moveTo(0, 320); c.lineTo(W, 320); c.stroke();

    /* ---- reflux assembly ---- */
    // condenser
    var cx = 130, ctop = 36, cbot = 168;
    c.fillStyle = "#eef4f7";
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.6;
    c.beginPath();
    c.rect(cx - 11, ctop, 22, cbot - ctop);
    c.fill();
    c.stroke();
    // cooling jacket
    c.beginPath();
    c.rect(cx - 30, ctop + 26, 60, 96);
    c.fillStyle = "rgba(150,200,220,0.20)";
    c.fill();
    c.strokeStyle = "#9fb3bf";
    c.stroke();
    label("cooling water", cx, ctop + 18, 8.5, "#6b757e", "center");

    // water droplets in condenser
    for (var i = 0; i < 5; i++) {
      c.beginPath();
      c.arc(cx, ctop + 44 + i * 18, 2, 0, Math.PI * 2);
      c.fillStyle = "rgba(120,180,205,0.6)";
      c.fill();
    }

    // flask
    var fy = 240, fr = 52;
    c.beginPath();
    c.arc(cx, fy, fr, 0, Math.PI * 2);
    c.fillStyle = "#f7f6f2";
    c.fill();
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.6;
    c.stroke();

    // liquid: orange dichromate -> green with COD
    var green = Math.min(1, s.cod / 600);
    var liq = "rgba(" + Math.round(216 - 90 * green) + "," + Math.round(146 - 0 * green) + "," + Math.round(58 + 20 * green) + ",0.72)";
    c.save();
    c.beginPath();
    c.arc(cx, fy, fr - 4, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = liq;
    c.fillRect(cx - fr, fy + 4, fr * 2, fr);
    c.restore();

    c.beginPath();
    c.arc(cx, fy, fr, 0, Math.PI * 2);
    c.strokeStyle = "#8fa0ab";
    c.stroke();

    // mantle
    c.fillStyle = "#e2ddd3";
    c.beginPath();
    c.moveTo(cx - 58, fy + 30);
    c.lineTo(cx + 58, fy + 30);
    c.lineTo(cx + 62, 306);
    c.lineTo(cx - 62, 306);
    c.closePath();
    c.fill();
    c.strokeStyle = "#b9b3a8";
    c.stroke();
    label("heating mantle 150 °C", cx, 300, 9, "#6b757e", "center");

    // stand
    c.strokeStyle = "#b9b3a8";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(cx + 78, 36);
    c.lineTo(cx + 78, 310);
    c.stroke();

    label("reflux", cx, 20, 10, "#3d464e", "center", 600);

    /* ---- burette ---- */
    var bx = 300, bw = 26, btop = 40, bbot = 240;
    c.fillStyle = "#eef1f3";
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.5;
    c.beginPath(); c.rect(bx, btop, bw, bbot - btop); c.fill(); c.stroke();

    var frac = Math.min(1, s.v / 25);
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
    for (var g = 0; g <= 25; g += 1) {
      var gy = btop + 6 + (g / 25) * (bbot - btop - 12);
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

    label("FAS " + s.n.toFixed(3) + " N", bx + bw / 2, 24, 10, "#3d464e", "center", 600);

    /* ---- readings ---- */
    var px = 356, py = 60;
    c.fillStyle = "#e9e6e0";
    c.strokeStyle = "#b9b3a8";
    c.lineWidth = 1.2;
    c.beginPath(); c.rect(px, py, 176, 176); c.fill(); c.stroke();
    label("COD RESULT", px + 12, py + 14, 8.5, "#6b757e", "left", 700);

    c.fillStyle = "#1c2226";
    c.fillRect(px + 12, py + 24, 152, 46);
    var reached = s.v >= s.ve - 0.02 && !s.over;
    c.fillStyle = s.over ? "#e3a08a" : reached ? "#7fe3b0" : "#d9a06a";
    c.font = "600 20px ui-monospace, Menlo, Consolas, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(s.over ? "OR" : s.v.toFixed(2), px + 88, py + 40);
    c.font = "9px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = "#8fa0ab";
    c.fillText("mL FAS", px + 88, py + 58);

    label("blank " + V_BLANK.toFixed(2) + " mL", px + 12, py + 84, 10, "#3d464e");
    label("sample " + s.vs + " mL", px + 12, py + 100, 10, "#3d464e");
    label("COD " + (s.over ? "—" : ((V_BLANK - s.v) * s.n * 8000 / s.vs).toFixed(0)) + " mg/L", px + 12, py + 120, 11, "#16191c", "left", 600);
    label(s.over ? "over range — dilute" : reached ? "end point: red-brown" : "digestate: green → red", px + 12, py + 142, 9.5, s.over ? "#8d2020" : reached ? "#16603f" : "#8a4a12");
    label("BOD₅/COD " + (s.over ? "—" : (s.bod / Math.max(1, ((V_BLANK - s.v) * s.n * 8000 / s.vs))).toFixed(2)), px + 12, py + 164, 9.5, "#6b757e");
  }

  function sync() {
    s.cod = Number($("s9-cod").value);
    s.vs = Number($("s9-vs").value);
    s.n = Number($("s9-n").value) / 100;
    s.bod = Number($("s9-bod").value);

    var delta = (s.cod * s.vs) / (s.n * 8000);
    s.ve = V_BLANK - delta;
    s.over = s.ve <= 0.1;

    var slider = $("s9-v");
    slider.max = String(Math.round(V_BLANK * 100));
    s.v = Number(slider.value) / 100;

    $("s9-cod-v").textContent = s.cod + " mg/L";
    $("s9-vs-v").textContent = s.vs + " mL";
    $("s9-n-v").textContent = s.n.toFixed(3) + " N";
    $("s9-v-v").textContent = s.v.toFixed(2) + " mL";
    $("s9-bod-v").textContent = s.bod + " mg/L";

    var codMeasured = s.over ? null : (V_BLANK - s.v) * s.n * 8000 / s.vs;
    var reached = !s.over && s.v >= s.ve - 0.02;
    $("s9-res").innerHTML = s.over ? "OR" : reached ? codMeasured.toFixed(0) + " <small>mg/L</small>" : "— <small>titrating</small>";
    $("s9-ve").textContent = s.over ? "over range" : s.ve.toFixed(2) + " mL";

    var ratio = (s.over || !reached) ? 0 : s.bod / Math.max(1, codMeasured);
    $("s9-ratio").textContent = (s.over || !reached) ? "—" : ratio.toFixed(2);
    $("s9-class").textContent = s.over ? "—"
      : !reached ? "Titrate to end point"
      : ratio >= 0.5 ? "Readily biodegradable"
      : ratio >= 0.3 ? "Biodegradable with acclimatisation"
      : "Poorly biodegradable";
    $("s9-limit").textContent = (s.over || !reached) ? "—" : codMeasured <= 250 ? "Pass" : "Exceeded";

    draw();
    drawCurve();
  }

  function drawCurve() {
    var codMeasured = s.over ? null : (V_BLANK - s.v) * s.n * 8000 / s.vs;
    var reached = codMeasured !== null && s.v >= s.ve - 0.02;
    var xmax = 1000, ymax = 600;
    var line50 = [[0, 0], [xmax, 0.5 * xmax]];
    var line30 = [[0, 0], [xmax, 0.3 * xmax]];

    var series = [
      { pts: line50, color: "#16603f", dash: [5, 4], width: 1.2 },
      { pts: line30, color: "#8a4a12", dash: [5, 4], width: 1.2 }
    ];
    if (reached) {
      series.push({ pts: [[codMeasured, s.bod]], color: "#0b5c8a", dots: true, width: 0 });
    }

    Lab.chart($("s9-curve"), {
      height: 260,
      x: { min: 0, max: xmax, label: "COD (mg/L)" },
      y: { min: 0, max: ymax, label: "BOD₅ (mg/L)" },
      series: series,
      marker: reached ? { x: codMeasured, y: s.bod, label: "ratio " + (s.bod / Math.max(1, codMeasured)).toFixed(2) } : null
    });
  }

  /* ---------------- actions ---------------- */

  var run = 0;

  function record() {
    if (s.over) return;
    var codMeasured = (V_BLANK - s.ve) * s.n * 8000 / s.vs;
    run++;
    Lab.addRow("s9-table", [
      run,
      s.vs,
      s.n.toFixed(3),
      s.ve.toFixed(2),
      codMeasured.toFixed(0),
      (s.bod / Math.max(1, codMeasured)).toFixed(2)
    ]);
  }

  function report() {
    var codMeasured = s.over ? null : (V_BLANK - s.ve) * s.n * 8000 / s.vs;
    Lab.report({
      slug: "session-09-cod",
      title: "Session 09 — Chemical Oxygen Demand",
      session: "09",
      tableId: "s9-table",
      values: [
        ["Sample volume", s.vs + " mL"],
        ["FAS normality", s.n.toFixed(3) + " N"],
        ["Blank titre", V_BLANK.toFixed(2) + " mL"],
        ["Sample titre", s.over ? "over range" : s.ve.toFixed(2) + " mL"],
        ["COD", s.over ? "requires dilution" : codMeasured.toFixed(0) + " mg/L"],
        ["Paired BOD₅", s.bod + " mg/L"],
        ["BOD₅/COD", s.over ? "—" : (s.bod / Math.max(1, codMeasured)).toFixed(2)],
        ["Discharge limit", "250 mg/L"]
      ],
      notes:
        "COD computed as (V_blank − V_sample) × N_FAS × 8000 / V_sample. Biodegradability judged from the " +
        "BOD₅/COD ratio: above 0.5 readily biodegradable, 0.3–0.5 biodegradable with acclimatisation, " +
        "below 0.3 poorly biodegradable and needing chemical or physical pre-treatment."
    });
  }

  function autoTitrate() {
    if (s.over) return;
    var target = s.ve + 0.3;
    var start = s.v;
    var t0 = performance.now();
    var dur = 1500;
    function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      var v = start + (target - start) * (1 - Math.pow(1 - k, 2));
      $("s9-v").value = String(Math.round(v * 100));
      sync();
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  $("s9-cod").addEventListener("input", function () { $("s9-v").value = "0"; sync(); });
  $("s9-vs").addEventListener("input", function () { $("s9-v").value = "0"; sync(); });
  $("s9-n").addEventListener("input", function () { $("s9-v").value = "0"; sync(); });
  $("s9-bod").addEventListener("input", sync);
  $("s9-v").addEventListener("input", sync);
  $("s9-record").addEventListener("click", record);
  $("s9-auto").addEventListener("click", autoTitrate);
  $("s9-report").addEventListener("click", report);

  sync();
})();
