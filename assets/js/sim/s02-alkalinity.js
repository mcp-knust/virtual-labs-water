/* Session 02 — Carbonate-system titration: P/T alkalinity and species distribution. */
(function () {
  "use strict";

  var W = 560, H = 380;
  var K1 = 4.47e-7, K2 = 4.68e-11, KW = 1e-14;
  var N_ACID = 0.02;      // eq/L
  var V_SAMPLE = 50;      // mL

  var WATERS = [
    { name: "Bicarbonate groundwater", alk: 180, ph: 7.4 },
    { name: "Surface water (carbonate)", alk: 95, ph: 8.6 },
    { name: "Lime-softened water", alk: 65, ph: 10.9 },
    { name: "Acidic upland water", alk: 8, ph: 5.6 }
  ];

  function $(id) { return document.getElementById(id); }

  function a1(H) { return (K1 * H) / (H * H + K1 * H + K1 * K2); }
  function a2(H) { return (K1 * K2) / (H * H + K1 * H + K1 * K2); }

  /* Build the closed carbonate model for a water: CT (mol/L) and SID0 (eq/L). */
  function buildModel(w) {
    var alkEq = w.alk / 50000;             // mg/L as CaCO3 -> eq/L
    var H0 = Math.pow(10, -w.ph);
    var ct = (alkEq - KW / H0 + H0) / (a1(H0) + 2 * a2(H0));
    var sid0 = alkEq;   // charge balance: SID equals the measured alkalinity
    return { ct: ct, sid0: sid0, alk0: alkEq };
  }

  /* pH after adding A equivalents per litre of strong acid. */
  function phAfter(m, A) {
    var lo = 1.0, hi = 13.8;
    for (var i = 0; i < 90; i++) {
      var mid = (lo + hi) / 2;
      var H = Math.pow(10, -mid);
      var f = (m.sid0 - A) + H - KW / H - m.ct * (a1(H) + 2 * a2(H));
      if (f > 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* Acid equivalents needed to reach a target pH (0 if already below). */
  function acidTo(m, targetPh) {
    var H = Math.pow(10, -targetPh);
    var A = m.sid0 - (m.ct * (a1(H) + 2 * a2(H)) + KW / H - H);
    return A > 0 ? A : 0;
  }

  function volOf(A) { return (A * V_SAMPLE) / N_ACID; }       // mL of standard acid
  function alkOf(v) { return (v * N_ACID * 50000) / V_SAMPLE; } // mg/L as CaCO3

  /* ---------------- state ---------------- */

  var state = { water: 0, model: null, v: 0, vp: 0, vt: 0, vmax: 20, ph: 7 };

  function loadWater(i) {
    state.water = i;
    var w = WATERS[i];
    state.model = buildModel(w);
    state.vp = Math.min(50, volOf(acidTo(state.model, 8.3)));
    state.vt = Math.min(50, volOf(acidTo(state.model, 4.5)));
    state.vmax = Math.min(50, volOf(acidTo(state.model, 3.0)) * 1.06 + 0.4);
    state.v = 0;
    $("s2-v").max = String(Math.round(state.vmax * 100));
    $("s2-v").value = "0";
  }

  /* ---------------- drawing ---------------- */

  var cv = Lab.ctx2d($("s2-canvas"), W, H);
  var c = cv;

  function draw() {
    c.clearRect(0, 0, W, H);

    // bench
    c.fillStyle = "#efece6";
    c.fillRect(0, 344, W, H - 344);
    c.strokeStyle = "#d8d3ca";
    c.beginPath(); c.moveTo(0, 344); c.lineTo(W, 344); c.stroke();

    /* ---- burette ---- */
    var bx = 214, bw = 30, btop = 34, bbot = 236;
    c.fillStyle = "#eef1f3";
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.5;
    c.beginPath();
    c.rect(bx, btop, bw, bbot - btop);
    c.fill(); c.stroke();

    // acid level: falls as volume is delivered
    var frac = Math.min(1, state.v / 50);
    var levelY = btop + 6 + frac * (bbot - btop - 12);

    c.save();
    c.beginPath();
    c.rect(bx + 1.5, btop + 1.5, bw - 3, bbot - btop - 3);
    c.clip();
    c.fillStyle = "rgba(196,226,238,0.85)";
    c.fillRect(bx + 1.5, levelY, bw - 3, bbot - levelY);
    // meniscus
    c.beginPath();
    c.ellipse(bx + bw / 2, levelY, bw / 2 - 1.5, 3, 0, 0, Math.PI * 2);
    c.fillStyle = "#a9cfe0";
    c.fill();
    c.restore();

    // graduations
    c.strokeStyle = "#7d8b95";
    c.lineWidth = 1;
    c.font = "8.5px ui-monospace, Menlo, Consolas, monospace";
    c.fillStyle = "#5c666f";
    c.textAlign = "left";
    c.textBaseline = "middle";
    for (var g = 0; g <= 50; g += 2) {
      var gy = btop + 6 + (g / 50) * (bbot - btop - 12);
      var long = g % 10 === 0;
      c.beginPath();
      c.moveTo(bx, gy);
      c.lineTo(bx + (long ? 10 : 5), gy);
      c.stroke();
      if (long) c.fillText(String(g), bx + 13, gy);
    }

    // stopcock + tip
    c.fillStyle = "#d8d3ca";
    c.beginPath();
    c.arc(bx + bw / 2, bbot + 4, 7, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#8fa0ab";
    c.stroke();
    c.beginPath();
    c.moveTo(bx + bw / 2 - 4, bbot);
    c.lineTo(bx + bw / 2 + 4, bbot);
    c.stroke();
    c.beginPath();
    c.moveTo(bx + bw / 2, bbot + 11);
    c.lineTo(bx + bw / 2 - 3, bbot + 30);
    c.lineTo(bx + bw / 2 + 3, bbot + 30);
    c.closePath();
    c.fillStyle = "#eef1f3";
    c.fill();
    c.stroke();

    // drop when flowing
    if (state.v > 0.01) {
      c.beginPath();
      c.arc(bx + bw / 2, bbot + 40, 3.2, 0, Math.PI * 2);
      c.fillStyle = "rgba(140,196,220,0.95)";
      c.fill();
    }

    label("0.02 N H₂SO₄", bx + bw / 2, 20, 10, "#3d464e", "center", 600);

    /* ---- flask ---- */
    var fx = 214; // centre
    var neckTop = 288, bodyTop = 316, bodyBot = 352;
    c.beginPath();
    c.moveTo(fx - 9, neckTop);
    c.lineTo(fx - 9, bodyTop);
    c.lineTo(fx - 52, bodyBot - 6);
    c.quadraticCurveTo(fx - 56, bodyBot, fx - 46, bodyBot);
    c.lineTo(fx + 46, bodyBot);
    c.quadraticCurveTo(fx + 56, bodyBot, fx + 52, bodyBot - 6);
    c.lineTo(fx + 9, bodyTop);
    c.lineTo(fx + 9, neckTop);
    c.closePath();
    c.fillStyle = "#f7f6f2";
    c.fill();
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.5;
    c.stroke();

    // liquid with indicator colour
    var ph = state.ph;
    var fill = indicatorColour(ph);
    c.save();
    c.beginPath();
    c.moveTo(fx - 9, 302);
    c.lineTo(fx - 9, bodyTop);
    c.lineTo(fx - 52, bodyBot - 6);
    c.quadraticCurveTo(fx - 56, bodyBot, fx - 46, bodyBot);
    c.lineTo(fx + 46, bodyBot);
    c.quadraticCurveTo(fx + 56, bodyBot, fx + 52, bodyBot - 6);
    c.lineTo(fx + 9, bodyTop);
    c.lineTo(fx + 9, 302);
    c.closePath();
    c.clip();
    c.fillStyle = fill;
    c.fillRect(fx - 60, 302, 120, 60);
    // surface line
    c.strokeStyle = "rgba(255,255,255,0.7)";
    c.beginPath();
    c.moveTo(fx - 12, 303);
    c.lineTo(fx + 12, 303);
    c.stroke();
    c.restore();

    label("sample 50 mL", fx, 366, 9.5, "#6b757e", "center");

    /* ---- pH meter ---- */
    var mx = 356, my = 120;
    c.beginPath();
    c.roundRect ? c.roundRect(mx, my, 150, 96, 4) : c.rect(mx, my, 150, 96);
    c.fillStyle = "#e9e6e0";
    c.fill();
    c.strokeStyle = "#b9b3a8";
    c.stroke();
    label("pH METER", mx + 12, my + 14, 9, "#6b757e", "left", 700);

    c.fillStyle = "#1c2226";
    c.fillRect(mx + 12, my + 26, 126, 40);
    c.fillStyle = "#7fe3b0";
    c.font = "600 22px ui-monospace, Menlo, Consolas, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(ph.toFixed(2), mx + 75, my + 46);

    label("slope 99% · 25 °C", mx + 12, my + 82, 9, "#8a939b", "left");

    /* ---- indicator legend ---- */
    label("Phenolphthalein", 356, 250, 10, "#3d464e", "left", 600);
    c.fillStyle = ph > 8.3 ? "rgba(214,84,140,0.85)" : "rgba(214,84,140,0.12)";
    c.fillRect(356, 260, 22, 12);
    c.strokeStyle = "#b9b3a8";
    c.strokeRect(356, 260, 22, 12);
    label(ph > 8.3 ? "pink" : "colourless", 384, 266, 9.5, "#6b757e");

    label("Methyl orange", 356, 288, 10, "#3d464e", "left", 600);
    c.fillStyle = ph < 4.4 ? "rgba(198,72,48,0.9)" : ph < 6.2 ? "rgba(226,146,58,0.9)" : "rgba(236,206,86,0.9)";
    c.fillRect(356, 298, 22, 12);
    c.strokeStyle = "#b9b3a8";
    c.strokeRect(356, 298, 22, 12);
    label(ph < 4.4 ? "red" : ph < 6.2 ? "orange" : "yellow", 384, 304, 9.5, "#6b757e");
  }

  function indicatorColour(ph) {
    if (ph > 8.25) {
      var t = Math.min(1, (ph - 8.25) / 1.4);
      return "rgba(" + Math.round(246 - 40 * t) + "," + Math.round(226 - 130 * t) + "," + Math.round(236 - 60 * t) + "," + (0.25 + 0.6 * t).toFixed(2) + ")";
    }
    if (ph >= 6.2) return "rgba(238,214,110,0.55)";
    if (ph >= 4.4) {
      var u = (6.2 - ph) / 1.8;
      return "rgba(" + Math.round(238 - 30 * u) + "," + Math.round(214 - 66 * u) + "," + Math.round(110 - 40 * u) + ",0.68)";
    }
    return "rgba(198,72,48,0.62)";
  }

  function label(text, x, y, size, color, align, weight) {
    c.font = (weight || 500) + " " + (size || 11) + "px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = color || "#3d464e";
    c.textAlign = align || "left";
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }

  /* ---------------- species ---------------- */

  function species(P, T) {
    if (P <= 0.001) return { oh: 0, co3: 0, hco3: T };
    if (P < T / 2) return { oh: 0, co3: 2 * P, hco3: T - 2 * P };
    if (Math.abs(P - T / 2) < 0.001) return { oh: 0, co3: T, hco3: 0 };
    return { oh: 2 * P - T, co3: 2 * (T - P), hco3: 0 };
  }

  function dominant(sp) {
    if (sp.oh > sp.co3 && sp.oh > sp.hco3) return "Hydroxide";
    if (sp.co3 > sp.hco3) return "Carbonate";
    return "Bicarbonate";
  }

  /* ---------------- sync ---------------- */

  function sync() {
    state.v = Number($("s2-v").value) / 100;
    var A = (state.v * N_ACID) / V_SAMPLE;

    // pH from the model, but never below what the acid volume implies
    state.ph = state.v >= state.vmax - 0.005
      ? phAfter(state.model, A)
      : phAfter(state.model, A);

    $("s2-v-v").textContent = state.v.toFixed(2) + " mL";
    $("s2-ph").textContent = state.ph.toFixed(2);
    $("s2-vp").textContent = state.vp > 0 ? state.vp.toFixed(2) + " mL" : "none";
    $("s2-vt").textContent = state.vt.toFixed(2) + " mL";

    var P = alkOf(state.vp);
    var T = alkOf(state.vt);
    $("s2-p").textContent = P.toFixed(0) + " mg/L";
    $("s2-t").textContent = T.toFixed(0) + " mg/L";

    var sp = species(P, T);
    $("s2-oh").textContent = sp.oh.toFixed(0) + " mg/L";
    $("s2-co3").textContent = sp.co3.toFixed(0) + " mg/L";
    $("s2-hco3").textContent = sp.hco3.toFixed(0) + " mg/L";

    var chip = $("s2-chip");
    if (state.v === 0) {
      chip.className = "chip";
      chip.textContent = "Not started";
    } else if (state.v < state.vp) {
      chip.className = "chip accent";
      chip.textContent = "Phenolphthalein still pink";
    } else if (state.v < state.vt) {
      chip.className = "chip warn";
      chip.textContent = "Past pH 8.3 — methyl orange yellow";
    } else {
      chip.className = "chip bad";
      chip.textContent = "Past pH 4.5 — orange-red endpoint";
    }

    draw();
    drawCurve();
  }

  function drawCurve() {
    var pts = [];
    var m = state.model;
    var vmax = state.vmax;
    for (var i = 0; i <= 160; i++) {
      var v = (i / 160) * vmax;
      var A = (v * N_ACID) / V_SAMPLE;
      pts.push([v, phAfter(m, A)]);
    }

    var series = [
      { pts: pts, color: "#0b5c8a", width: 2 }
    ];
    if (state.vp > 0.05) {
      series.push({ pts: [[state.vp, 2], [state.vp, 12]], color: "#16603f", dash: [4, 3], width: 1 });
    }
    series.push({ pts: [[state.vt, 2], [state.vt, 12]], color: "#8a4a12", dash: [4, 3], width: 1 });

    Lab.chart($("s2-curve"), {
      height: 240,
      x: { min: 0, max: vmax, label: "Acid added (mL of 0.02 N H\u2082SO\u2084)" },
      y: { min: 2, max: 13, label: "pH" },
      series: series,
      marker: { x: state.v, y: state.ph },
      bands: [
        { from: 8.3, to: 13, color: "rgba(214,84,140,0.06)" },
        { from: 2, to: 4.5, color: "rgba(198,72,48,0.07)" }
      ]
    });
  }

  /* ---------------- actions ---------------- */

  var run = 0;

  function record() {
    var P = alkOf(state.vp);
    var T = alkOf(state.vt);
    var sp = species(P, T);
    run++;
    Lab.addRow("s2-table", [
      run,
      WATERS[state.water].name,
      state.vp.toFixed(2),
      state.vt.toFixed(2),
      P.toFixed(0),
      T.toFixed(0),
      dominant(sp)
    ]);
  }

  function report() {
    var P = alkOf(state.vp);
    var T = alkOf(state.vt);
    var sp = species(P, T);
    Lab.report({
      slug: "session-02-alkalinity",
      title: "Session 02 — pH, Acidity and Alkalinity",
      session: "02",
      tableId: "s2-table",
      values: [
        ["Water", WATERS[state.water].name],
        ["Initial pH", WATERS[state.water].ph.toFixed(2)],
        ["Acid normality", "0.02 N"],
        ["Sample volume", "50 mL"],
        ["V phenolphthalein", state.vp.toFixed(2) + " mL"],
        ["V total", state.vt.toFixed(2) + " mL"],
        ["P alkalinity", P.toFixed(0) + " mg/L as CaCO₃"],
        ["T alkalinity", T.toFixed(0) + " mg/L as CaCO₃"],
        ["Hydroxide alkalinity", sp.oh.toFixed(0) + " mg/L"],
        ["Carbonate alkalinity", sp.co3.toFixed(0) + " mg/L"],
        ["Bicarbonate alkalinity", sp.hco3.toFixed(0) + " mg/L"],
        ["Limit, pH (GS 175-1)", "6.5 – 8.5"]
      ],
      notes:
        "Alkalinity computed as (V × N × 50 000)/V_sample. Species resolved from the P/T relationship: " +
        "P=0 gives bicarbonate only; P<T/2 gives carbonate 2P and bicarbonate T−2P; P>T/2 gives hydroxide 2P−T " +
        "and carbonate 2(T−P)."
    });
  }

  function autoTitrate() {
    var target = Math.min(state.vmax, state.vt + 0.35);
    var start = state.v;
    var t0 = performance.now();
    var dur = 1600;
    function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      var v = start + (target - start) * (1 - Math.pow(1 - k, 2));
      $("s2-v").value = String(Math.round(v * 100));
      sync();
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------------- wiring ---------------- */

  $("s2-type").addEventListener("change", function () {
    loadWater(Number(this.value));
    sync();
  });
  $("s2-v").addEventListener("input", sync);
  $("s2-record").addEventListener("click", record);
  $("s2-report").addEventListener("click", report);
  $("s2-auto").addEventListener("click", autoTitrate);
  $("s2-reset").addEventListener("click", function () {
    $("s2-v").value = "0";
    sync();
  });

  loadWater(0);
  sync();
})();
