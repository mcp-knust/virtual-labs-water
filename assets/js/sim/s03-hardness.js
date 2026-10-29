/* Session 03 — Total and calcium hardness by EDTA complexometric titration. */
(function () {
  "use strict";

  var W = 560, H = 360;
  var M_EDTA = 0.010;   // mol/L
  var V_SAMPLE = 50;    // mL

  function $(id) { return document.getElementById(id); }

  function volFor(hardness) { return (hardness * V_SAMPLE) / (M_EDTA * 100000); }
  function hardnessOf(v) { return (v * M_EDTA * 100000) / V_SAMPLE; }

  var s = { th: 240, mgFrac: 0.30, mode: "total", v: 0, ve: 0 };

  var c = Lab.ctx2d($("s3-canvas"), W, H);

  function label(text, x, y, size, color, align, weight) {
    c.font = (weight || 500) + " " + (size || 11) + "px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = color || "#3d464e";
    c.textAlign = align || "left";
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }

  function classOf(h) {
    if (h <= 75) return "Soft";
    if (h <= 150) return "Moderately hard";
    if (h <= 300) return "Hard";
    if (h <= 500) return "Very hard";
    return "Exceeds GS 175-1";
  }

  function draw() {
    c.clearRect(0, 0, W, H);

    c.fillStyle = "#efece6";
    c.fillRect(0, 326, W, H - 326);
    c.strokeStyle = "#d8d3ca";
    c.beginPath(); c.moveTo(0, 326); c.lineTo(W, 326); c.stroke();

    /* burette */
    var bx = 150, bw = 28, btop = 30, bbot = 226;
    c.fillStyle = "#eef1f3";
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.5;
    c.beginPath(); c.rect(bx, btop, bw, bbot - btop); c.fill(); c.stroke();

    var frac = Math.min(1, s.v / 50);
    var levelY = btop + 6 + frac * (bbot - btop - 12);
    c.save();
    c.beginPath(); c.rect(bx + 1.5, btop + 1.5, bw - 3, bbot - btop - 3); c.clip();
    c.fillStyle = "rgba(196,226,238,0.85)";
    c.fillRect(bx + 1.5, levelY, bw - 3, bbot - levelY);
    c.beginPath(); c.ellipse(bx + bw / 2, levelY, bw / 2 - 1.5, 3, 0, 0, Math.PI * 2);
    c.fillStyle = "#a9cfe0"; c.fill();
    c.restore();

    c.strokeStyle = "#7d8b95";
    c.lineWidth = 1;
    c.font = "8.5px ui-monospace, Menlo, Consolas, monospace";
    c.fillStyle = "#5c666f";
    c.textAlign = "left";
    c.textBaseline = "middle";
    for (var g = 0; g <= 50; g += 5) {
      var gy = btop + 6 + (g / 50) * (bbot - btop - 12);
      c.beginPath(); c.moveTo(bx, gy); c.lineTo(bx + (g % 10 === 0 ? 10 : 5), gy); c.stroke();
      if (g % 10 === 0) c.fillText(String(g), bx + 13, gy);
    }

    c.fillStyle = "#d8d3ca";
    c.beginPath(); c.arc(bx + bw / 2, bbot + 4, 7, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#8fa0ab"; c.stroke();
    c.beginPath();
    c.moveTo(bx + bw / 2, bbot + 11);
    c.lineTo(bx + bw / 2 - 3, bbot + 30);
    c.lineTo(bx + bw / 2 + 3, bbot + 30);
    c.closePath();
    c.fillStyle = "#eef1f3"; c.fill(); c.stroke();

    if (s.v > 0.01) {
      c.beginPath(); c.arc(bx + bw / 2, bbot + 40, 3.2, 0, Math.PI * 2);
      c.fillStyle = "rgba(140,196,220,0.95)"; c.fill();
    }

    label("0.010 M EDTA", bx + bw / 2, 18, 10, "#3d464e", "center", 600);

    /* flask */
    var fx = 230;
    var neckTop = 272, bodyTop = 298, bodyBot = 322;
    c.beginPath();
    c.moveTo(fx - 8, neckTop);
    c.lineTo(fx - 8, bodyTop);
    c.lineTo(fx - 46, bodyBot - 5);
    c.quadraticCurveTo(fx - 50, bodyBot, fx - 41, bodyBot);
    c.lineTo(fx + 41, bodyBot);
    c.quadraticCurveTo(fx + 50, bodyBot, fx + 46, bodyBot - 5);
    c.lineTo(fx + 8, bodyTop);
    c.lineTo(fx + 8, neckTop);
    c.closePath();
    c.fillStyle = "#f7f6f2"; c.fill();
    c.strokeStyle = "#8fa0ab"; c.lineWidth = 1.5; c.stroke();

    var reached = s.v >= s.ve - 0.02;
    var liq = indicatorColour(reached);
    c.save();
    c.beginPath();
    c.moveTo(fx - 8, 286);
    c.lineTo(fx - 8, bodyTop);
    c.lineTo(fx - 46, bodyBot - 5);
    c.quadraticCurveTo(fx - 50, bodyBot, fx - 41, bodyBot);
    c.lineTo(fx + 41, bodyBot);
    c.quadraticCurveTo(fx + 50, bodyBot, fx + 46, bodyBot - 5);
    c.lineTo(fx + 8, bodyTop);
    c.lineTo(fx + 8, 286);
    c.closePath();
    c.clip();
    c.fillStyle = liq;
    c.fillRect(fx - 55, 286, 110, 45);
    c.restore();

    label(s.mode === "total" ? "EBT · pH 10" : "murexide · pH 12.5", fx, 338, 9.5, "#6b757e", "center");

    /* classification gauge */
    var gx = 300, gy = 60, gw = 210, gh = 16;
    label("Hardness class", gx, gy - 14, 9, "#6b757e", "left", 700);

    var zones = [
      { to: 75, color: "#e8f2ec", name: "soft" },
      { to: 150, color: "#dfeaf0", name: "" },
      { to: 300, color: "#f3e6d2", name: "" },
      { to: 500, color: "#e9d3c2", name: "" },
      { to: 700, color: "#e2c6c6", name: "" }
    ];
    var prev = 0;
    zones.forEach(function (z) {
      var x0 = gx + (prev / 700) * gw;
      var x1 = gx + (z.to / 700) * gw;
      c.fillStyle = z.color;
      c.fillRect(x0, gy, x1 - x0, gh);
      prev = z.to;
    });
    c.strokeStyle = "#b9b3a8";
    c.lineWidth = 1;
    c.strokeRect(gx, gy, gw, gh);

    c.font = "8px ui-monospace, Menlo, Consolas, monospace";
    c.fillStyle = "#6b757e";
    c.textAlign = "center";
    [75, 150, 300, 500].forEach(function (t) {
      var tx = gx + (t / 700) * gw;
      c.beginPath(); c.moveTo(tx, gy + gh); c.lineTo(tx, gy + gh + 4); c.stroke();
      c.fillText(String(t), tx, gy + gh + 12);
    });

    var measured = hardnessOf(s.v);
    var mx = gx + (Math.min(measured, 700) / 700) * gw;
    c.beginPath();
    c.moveTo(mx, gy - 2);
    c.lineTo(mx - 4, gy - 9);
    c.lineTo(mx + 4, gy - 9);
    c.closePath();
    c.fillStyle = "#16191c";
    c.fill();

    label(measured.toFixed(0) + " mg/L as CaCO₃", gx, gy + 34, 11, "#16191c", "left", 600);

    /* stoichiometry note */
    var note = s.mode === "total"
      ? "Ca²⁺ + Mg²⁺ + EDTA → complex"
      : "Ca²⁺ + EDTA → complex (Mg(OH)₂ ppt.)";
    label(note, gx, 120, 10, "#6b757e", "left");

    /* end point readout box */
    c.fillStyle = "#e9e6e0";
    c.fillRect(gx, 140, 210, 84);
    c.strokeStyle = "#b9b3a8";
    c.strokeRect(gx, 140, 210, 84);
    label("BURETTE READING", gx + 12, 156, 8.5, "#6b757e", "left", 700);
    c.font = "600 26px ui-monospace, Menlo, Consolas, monospace";
    c.fillStyle = "#16191c";
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText(s.v.toFixed(2), gx + 12, 182);
    c.font = "11px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = "#6b757e";
    c.fillText("mL", gx + 92, 188);
    label(reached ? "end point reached" : "colour still changing", gx + 12, 208, 9.5, reached ? "#16603f" : "#8a4a12", "left");

    /* colour swatches */
    var sw = 300, sy = 244;
    label("Indicator colour", sw, sy, 9, "#6b757e", "left", 700);
    c.fillStyle = indicatorColour(false);
    c.fillRect(sw, sy + 10, 40, 18);
    c.strokeStyle = "#b9b3a8"; c.strokeRect(sw, sy + 10, 40, 18);
    label("before", sw + 46, sy + 19, 9, "#6b757e");

    c.fillStyle = indicatorColour(true);
    c.fillRect(sw, sy + 34, 40, 18);
    c.strokeStyle = "#b9b3a8"; c.strokeRect(sw, sy + 34, 40, 18);
    label("end point", sw + 46, sy + 43, 9, "#6b757e");
  }

  function indicatorColour(end) {
    if (s.mode === "total") {
      return end ? "rgba(38,86,168,0.62)" : "rgba(150,38,66,0.55)";
    }
    return end ? "rgba(120,62,150,0.60)" : "rgba(198,96,52,0.58)";
  }

  function sync() {
    s.th = Number($("s3-th").value);
    s.mgFrac = Number($("s3-mg").value) / 100;
    s.mode = $("s3-mode").value;

    var caH = s.th * (1 - s.mgFrac);
    var mgH = s.th - caH;
    s.ve = volFor(s.mode === "total" ? s.th : caH);

    var maxV = Math.max(0.5, s.ve * 1.35);
    var slider = $("s3-v");
    slider.max = String(Math.round(maxV * 100));
    s.v = Number(slider.value) / 100;
    if (s.v > maxV) { s.v = maxV; slider.value = String(Math.round(maxV * 100)); }

    $("s3-th-v").textContent = s.th + " mg/L";
    $("s3-mg-v").textContent = Math.round(s.mgFrac * 100) + "%";
    $("s3-v-v").textContent = s.v.toFixed(2) + " mL";
    $("s3-mode-lbl").textContent = s.mode === "total" ? "Total hardness by EDTA" : "Calcium hardness by EDTA";
    $("s3-result").innerHTML = hardnessOf(s.v).toFixed(0) + " <small>mg/L</small>";
    $("s3-ve").textContent = s.ve.toFixed(2) + " mL";
    $("s3-ca").textContent = caH.toFixed(0) + " mg/L";
    $("s3-mgh").textContent = mgH.toFixed(0) + " mg/L";
    $("s3-class").textContent = classOf(s.th) + (s.th > 500 ? " — above limit" : "");

    var chip = $("s3-chip");
    if (s.v === 0) {
      chip.className = "chip";
      chip.textContent = "Not started";
    } else if (s.v < s.ve - 0.02) {
      chip.className = "chip accent";
      chip.textContent = "Within " + (s.ve - s.v).toFixed(2) + " mL of end point";
    } else if (s.v <= s.ve + 0.15) {
      chip.className = "chip ok";
      chip.textContent = "End point";
    } else {
      chip.className = "chip bad";
      chip.textContent = "Over-titrated";
    }

    draw();
  }

  var run = 0;

  function record() {
    var caH = s.th * (1 - s.mgFrac);
    var measured = s.mode === "total" ? s.th : caH;
    run++;
    Lab.addRow("s3-table", [
      run,
      s.mode === "total" ? "Total (EBT)" : "Calcium (murexide)",
      s.ve.toFixed(2),
      measured.toFixed(0),
      classOf(measured)
    ]);
  }

  function report() {
    var caH = s.th * (1 - s.mgFrac);
    Lab.report({
      slug: "session-03-hardness",
      title: "Session 03 — Total Hardness by EDTA Titration",
      session: "03",
      tableId: "s3-table",
      values: [
        ["Sample volume", "50 mL"],
        ["EDTA molarity", "0.010 M"],
        ["Mode", s.mode === "total" ? "Total hardness, EBT at pH 10" : "Calcium hardness, murexide at pH 12.5"],
        ["End point volume", s.ve.toFixed(2) + " mL"],
        ["Total hardness", s.th.toFixed(0) + " mg/L as CaCO₃"],
        ["Calcium hardness", caH.toFixed(0) + " mg/L as CaCO₃"],
        ["Magnesium hardness", (s.th - caH).toFixed(0) + " mg/L as CaCO₃"],
        ["Class", classOf(s.th)],
        ["Limit (GS 175-1)", "500 mg/L as CaCO₃"]
      ],
      notes:
        "Hardness = (V_EDTA × M_EDTA × 100 000)/V_sample, valid because EDTA complexes Ca and Mg 1:1 " +
        "and CaCO₃ has an equivalent weight of 50 g/eq. Calcium was titrated at pH 12.5 where magnesium " +
        "precipitates as Mg(OH)₂; magnesium hardness is the difference between total and calcium."
    });
  }

  function autoTitrate() {
    var target = s.ve + 0.25;
    var start = s.v;
    var t0 = performance.now();
    var dur = 1500;
    function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      var v = start + (target - start) * (1 - Math.pow(1 - k, 2));
      $("s3-v").value = String(Math.round(v * 100));
      sync();
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  $("s3-mode").addEventListener("change", function () {
    $("s3-v").value = "0";
    sync();
  });
  $("s3-th").addEventListener("input", function () { $("s3-v").value = "0"; sync(); });
  $("s3-mg").addEventListener("input", function () { $("s3-v").value = "0"; sync(); });
  $("s3-v").addEventListener("input", sync);
  $("s3-record").addEventListener("click", record);
  $("s3-report").addEventListener("click", report);
  $("s3-auto").addEventListener("click", autoTitrate);

  sync();
})();
