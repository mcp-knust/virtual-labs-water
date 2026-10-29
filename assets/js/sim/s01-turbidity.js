/* Session 01 — Turbidity (nephelometry) and apparent colour (spectrophotometry). */
(function () {
  "use strict";

  var W = 560, H = 340;
  var K_COLOUR = 4.3e-4; // TCU^-1 cm^-1

  function $(id) { return document.getElementById(id); }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function label(c, text, x, y, size, color, align, weight) {
    c.font = (weight || 500) + " " + (size || 11) + "px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = color || "#3d464e";
    c.textAlign = align || "left";
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }

  /* ---------------- 1A : turbidimeter ---------------- */

  var a = {
    trueNTU: 100,
    df: 1,
    reading: 0,
    overRange: false
  };

  var ca = Lab.ctx2d($("s1a-canvas"), W, H);

  function trueFromSlider(v) {
    return 0.5 * Math.pow(1600, v / 100);
  }

  function recomputeA() {
    var measured = a.trueNTU / a.df;
    a.overRange = measured > 1000;
    a.reading = a.overRange ? 0 : measured;
    return measured;
  }

  function drawA() {
    var c = ca;
    c.clearRect(0, 0, W, H);

    // bench
    c.fillStyle = "#efece6";
    c.fillRect(0, 292, W, H - 292);
    c.strokeStyle = "#d8d3ca";
    c.beginPath();
    c.moveTo(0, 292);
    c.lineTo(W, 292);
    c.stroke();

    // instrument body
    roundRect(c, 58, 44, 300, 248, 6);
    c.fillStyle = "#e9e6e0";
    c.fill();
    c.strokeStyle = "#b9b3a8";
    c.lineWidth = 1.5;
    c.stroke();

    // vent grille
    c.strokeStyle = "#c9c3b8";
    c.lineWidth = 1;
    for (var i = 0; i < 6; i++) {
      c.beginPath();
      c.moveTo(76, 258 + i * 4);
      c.lineTo(126, 258 + i * 4);
      c.stroke();
    }

    label(c, "TURBIDIMETER", 78, 64, 10, "#6b757e", "left", 700);
    label(c, "90° scatter", 78, 78, 9.5, "#8a939b", "left", 500);

    // sample chamber
    roundRect(c, 150, 100, 116, 150, 4);
    c.fillStyle = "#dcd8d0";
    c.fill();
    c.strokeStyle = "#b9b3a8";
    c.stroke();

    // cuvette
    roundRect(c, 178, 112, 60, 126, 3);
    c.fillStyle = "#fbfaf8";
    c.fill();
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.5;
    c.stroke();

    // liquid: milky as turbidity rises
    var alpha = Math.min(0.82, 0.05 + (a.trueNTU / a.df) / 260);
    c.save();
    roundRect(c, 180, 150, 56, 86, 2);
    c.clip();
    c.fillStyle = "rgba(206,200,182," + alpha.toFixed(3) + ")";
    c.fillRect(180, 150, 56, 86);
    // particles
    var seed = 12345;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
    var count = Math.min(170, Math.round(6 + (a.trueNTU / a.df) * 1.6));
    for (var p = 0; p < count; p++) {
      var px = 182 + rnd() * 52;
      var py = 152 + rnd() * 82;
      var r = 0.5 + rnd() * 1.3;
      c.beginPath();
      c.arc(px, py, r, 0, Math.PI * 2);
      c.fillStyle = "rgba(120,112,96," + (0.25 + rnd() * 0.35).toFixed(2) + ")";
      c.fill();
    }
    c.restore();

    // beam in
    c.strokeStyle = "rgba(210,150,60,0.55)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(96, 196);
    c.lineTo(178, 196);
    c.stroke();
    c.beginPath();
    c.moveTo(178, 196);
    c.lineTo(196, 196);
    c.stroke();

    label(c, "light", 100, 184, 9, "#8a4a12");
    label(c, "source", 100, 206, 9, "#8a4a12");

    // 90 deg detector
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(212, 148);
    c.lineTo(212, 118);
    c.stroke();
    roundRect(c, 196, 96, 34, 20, 2);
    c.fillStyle = "#cdd6dc";
    c.fill();
    c.strokeStyle = "#8fa0ab";
    c.stroke();
    label(c, "det.", 213, 106, 8.5, "#3d464e", "center");

    // display
    roundRect(c, 286, 96, 54, 118, 3);
    c.fillStyle = "#1c2226";
    c.fill();
    c.strokeStyle = "#0d1113";
    c.stroke();

    var disp = a.overRange ? "OR" : a.reading.toFixed(2);
    c.fillStyle = a.overRange ? "#d9a06a" : "#7fe3b0";
    c.font = "600 15px ui-monospace, Menlo, Consolas, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(disp, 313, 136);
    c.font = "9px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = "#8fa0ab";
    c.fillText("NTU", 313, 152);

    // range indicator
    c.fillStyle = a.overRange ? "#c9704a" : "#4f7f68";
    c.beginPath();
    c.arc(313, 176, 4, 0, Math.PI * 2);
    c.fill();
    label(c, a.overRange ? "over" : "stable", 313, 190, 8, "#8fa0ab", "center");

    // cell orientation mark
    label(c, "Fill line", 208, 240, 9, "#6b757e", "center");

    // readout on bench
    label(c, a.overRange ? "Dilute and re-read" : "Reading stable", 400, 312, 12, "#3d464e");
  }

  function syncA() {
    var v = Number($("s1a-true").value);
    a.trueNTU = trueFromSlider(v);
    a.df = Number($("s1a-df").value);
    $("s1a-true-v").textContent = a.trueNTU < 10
      ? a.trueNTU.toFixed(2) + " NTU"
      : Math.round(a.trueNTU) + " NTU";
    $("s1a-df-v").textContent = a.df.toFixed(1) + " : 1";

    var measured = recomputeA();
    drawA();

    $("s1a-read").innerHTML = a.overRange
      ? "OR <small>NTU</small>"
      : a.reading.toFixed(2) + " <small>NTU</small>";
    $("s1a-dil").textContent = a.overRange ? "—" : measured.toFixed(2) + " NTU";
    $("s1a-corr").textContent = a.overRange ? "—" : (measured * a.df).toFixed(1) + " NTU";
    $("s1a-rep").textContent = a.overRange
      ? "requires dilution"
      : (measured * a.df).toFixed(1) + " NTU";

    var chip = $("s1a-chip");
    var val = measured * a.df;
    Lab.statusChip(chip, val, [
      { max: 1, cls: "ok", label: "Excellent" },
      { max: 5, cls: "ok", label: "Compliant" },
      { max: 1e9, cls: "bad", label: "Exceeds 5 NTU" }
    ], "NTU");
    if (a.overRange) {
      chip.className = "chip warn";
      chip.textContent = "Over range — dilute";
    }
  }

  /* ---------------- 1B : spectrophotometer ---------------- */

  var b = { trueTCU: 24, path: 1, abs: 0, tcu: 0 };
  var cb = Lab.ctx2d($("s1b-canvas"), W, H);

  function drawB() {
    var c = cb;
    c.clearRect(0, 0, W, H);

    c.fillStyle = "#efece6";
    c.fillRect(0, 292, W, H - 292);
    c.strokeStyle = "#d8d3ca";
    c.beginPath();
    c.moveTo(0, 292);
    c.lineTo(W, 292);
    c.stroke();

    roundRect(c, 54, 44, 320, 248, 6);
    c.fillStyle = "#e9e6e0";
    c.fill();
    c.strokeStyle = "#b9b3a8";
    c.lineWidth = 1.5;
    c.stroke();

    label(c, "SPECTROPHOTOMETER", 74, 64, 10, "#6b757e", "left", 700);
    label(c, "λ = 456 nm", 74, 78, 9.5, "#8a939b", "left", 500);

    // cell compartment
    roundRect(c, 150, 104, 150, 142, 4);
    c.fillStyle = "#dcd8d0";
    c.fill();
    c.strokeStyle = "#b9b3a8";
    c.stroke();

    // cuvette with Pt-Co colour
    var tcuScale = Math.min(1, b.trueTCU / 70);
    roundRect(c, 196, 118, 58, 112, 3);
    c.fillStyle = "#fbfaf8";
    c.fill();
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.5;
    c.stroke();

    c.save();
    roundRect(c, 198, 150, 54, 78, 2);
    c.clip();
    c.fillStyle =
      "rgba(" +
      Math.round(232 - 96 * tcuScale) + "," +
      Math.round(206 - 120 * tcuScale) + "," +
      Math.round(150 - 104 * tcuScale) + "," +
      (0.35 + 0.6 * tcuScale).toFixed(2) + ")";
    c.fillRect(198, 150, 54, 78);
    c.restore();

    // light path through the cell
    c.strokeStyle = "rgba(210,150,60,0.6)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(92, 200);
    c.lineTo(196, 200);
    c.stroke();
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(254, 200);
    c.lineTo(392, 200);
    c.stroke();
    c.setLineDash([]);

    label(c, "I₀", 100, 188, 10, "#8a4a12", "left", 600);
    label(c, "I", 366, 188, 10, "#8a4a12", "left", 600);

    // detector
    roundRect(c, 392, 188, 26, 24, 2);
    c.fillStyle = "#cdd6dc";
    c.fill();
    c.strokeStyle = "#8fa0ab";
    c.stroke();

    // display
    roundRect(c, 312, 96, 46, 66, 3);
    c.fillStyle = "#1c2226";
    c.fill();
    c.strokeStyle = "#0d1113";
    c.stroke();
    c.fillStyle = "#7fe3b0";
    c.font = "600 13px ui-monospace, Menlo, Consolas, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(b.abs.toFixed(3), 335, 122);
    c.font = "9px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = "#8fa0ab";
    c.fillText("Abs", 335, 140);

    // path length callout
    c.strokeStyle = "#8a939b";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(196, 246);
    c.lineTo(254, 246);
    c.stroke();
    c.beginPath();
    c.moveTo(196, 241);
    c.lineTo(196, 251);
    c.moveTo(254, 241);
    c.lineTo(254, 251);
    c.stroke();
    label(c, "b = " + b.path + " cm", 225, 262, 9.5, "#3d464e", "center");

    label(c, "Pt–Co standards", 400, 312, 12, "#3d464e");
  }

  function syncB() {
    b.trueTCU = Number($("s1b-true").value);
    b.path = Number($("s1b-path").value);
    b.abs = K_COLOUR * b.trueTCU * b.path;
    b.tcu = b.abs / (K_COLOUR * b.path);

    $("s1b-true-v").textContent = b.trueTCU + " TCU";
    $("s1b-path-v").textContent = b.path + " cm";
    $("s1b-abs").innerHTML = b.abs.toFixed(4) + " <small>A</small>";
    $("s1b-tcu").textContent = b.tcu.toFixed(1) + " TCU";
    $("s1b-rep").textContent = b.tcu.toFixed(0) + " TCU";

    Lab.statusChip($("s1b-chip"), b.tcu, [
      { max: 5, cls: "ok", label: "Clear" },
      { max: 15, cls: "ok", label: "Compliant" },
      { max: 1e9, cls: "bad", label: "Exceeds 15 TCU" }
    ], "TCU");

    drawB();
  }

  /* ---------------- recording ---------------- */

  var run = 0;

  function recordA() {
    var measured = recomputeA();
    if (a.overRange) return;
    run++;
    var value = measured * a.df;
    Lab.addRow("s1-table", [
      run,
      "Synthetic",
      a.df.toFixed(1) + " : 1",
      measured.toFixed(2),
      value.toFixed(1),
      value <= 5 ? "Pass" : "Fail"
    ]);
  }

  function recordB() {
    run++;
    Lab.addRow("s1-table", [
      run,
      "Colour (true)",
      "—",
      b.abs.toFixed(4) + " A",
      b.tcu.toFixed(1) + " TCU",
      b.tcu <= 15 ? "Pass" : "Fail"
    ]);
  }

  function sessionReport() {
    Lab.report({
      slug: "session-01-turbidity",
      title: "Session 01 — Turbidity and Apparent Colour",
      session: "01",
      tableId: "s1-table",
      values: [
        ["Sample turbidity (corrected)", a.overRange ? "over range" : (a.trueNTU).toFixed(1) + " NTU"],
        ["Dilution applied", a.df.toFixed(1) + " : 1"],
        ["Reported turbidity", a.overRange ? "requires dilution" : (a.reading * a.df).toFixed(1) + " NTU"],
        ["Colour, path length", b.path + " cm"],
        ["Absorbance at 456 nm", b.abs.toFixed(4)],
        ["True colour", b.tcu.toFixed(1) + " TCU"],
        ["Limit, turbidity (GS 175-1)", "5 NTU"],
        ["Limit, colour", "15 TCU"]
      ],
      notes:
        "Turbidity was corrected for dilution using NTU(original) = NTU(measured) × DF. " +
        "True colour was computed from absorbance using c = A/(ε·b) with ε = 4.3×10⁻⁴ TCU⁻¹cm⁻¹ at 456 nm. " +
        "Both results are compared against GS 175-1 / WHO aesthetic limits."
    });
  }

  /* ---------------- wiring ---------------- */

  $("s1a-true").value = 72;
  $("s1a-true").addEventListener("input", syncA);
  $("s1a-df").addEventListener("input", syncA);
  $("s1a-record").addEventListener("click", recordA);
  $("s1a-report").addEventListener("click", sessionReport);

  $("s1b-true").addEventListener("input", syncB);
  $("s1b-path").addEventListener("input", syncB);
  $("s1b-record").addEventListener("click", recordB);

  syncA();
  syncB();
})();
