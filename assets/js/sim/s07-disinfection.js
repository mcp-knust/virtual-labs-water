/* Session 07 — Breakpoint chlorination, chlorine demand and Ct disinfection. */
(function () {
  "use strict";

  var W = 560, H = 340;

  function $(id) { return document.getElementById(id); }

  var s = { n: 0.40, dose: 3.0, t: 30, temp: 15 };

  var c = Lab.ctx2d($("s7-canvas"), W, H);

  function label(text, x, y, size, color, align, weight) {
    c.font = (weight || 500) + " " + (size || 11) + "px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = color || "#3d464e";
    c.textAlign = align || "left";
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }

  var CT_T = [5, 10, 15, 20, 25];
  var CT_REQ = [450, 228, 152, 96, 63];

  function ctRequired(temp) {
    if (temp <= CT_T[0]) return CT_REQ[0];
    if (temp >= CT_T[CT_T.length - 1]) return CT_REQ[CT_REQ.length - 1];
    for (var i = 0; i < CT_T.length - 1; i++) {
      if (temp <= CT_T[i + 1]) {
        var k = (temp - CT_T[i]) / (CT_T[i + 1] - CT_T[i]);
        // interpolate in log space, as Ct roughly doubles per 10 °C drop
        return Math.exp(Math.log(CT_REQ[i]) + k * (Math.log(CT_REQ[i + 1]) - Math.log(CT_REQ[i])));
      }
    }
    return CT_REQ[0];
  }

  function curve(dose, n) {
    var bp = 7.6 * n;
    var peakDose = 5 * n;
    var combined = 0, free = 0;
    if (dose <= peakDose) {
      combined = 0.35 * dose;
    } else if (dose < bp) {
      combined = 0.35 * peakDose * (bp - dose) / (bp - peakDose);
    } else {
      free = dose - bp;
    }
    return { bp: bp, peakDose: peakDose, combined: combined, free: free };
  }

  /* ---------------- drawing ---------------- */

  function draw() {
    c.clearRect(0, 0, W, H);

    c.fillStyle = "#efece6";
    c.fillRect(0, 300, W, H - 300);
    c.strokeStyle = "#d8d3ca";
    c.beginPath(); c.moveTo(0, 300); c.lineTo(W, 300); c.stroke();

    // inlet pipe
    c.strokeStyle = "#9bb7c6";
    c.lineWidth = 10;
    c.beginPath();
    c.moveTo(20, 150);
    c.lineTo(110, 150);
    c.stroke();
    c.strokeStyle = "#e8eef2";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(20, 150);
    c.lineTo(110, 150);
    c.stroke();

    label("raw water", 22, 130, 9.5, "#6b757e");
    label("Q", 22, 168, 10, "#0b5c8a", "left", 600);

    // dosing pump
    var px = 96, py = 60;
    c.fillStyle = "#e9e6e0";
    c.strokeStyle = "#b9b3a8";
    c.lineWidth = 1.4;
    c.beginPath();
    c.rect(px, py, 66, 54);
    c.fill();
    c.stroke();
    label("NaOCl", px + 33, py + 16, 9, "#3d464e", "center", 700);
    label(s.dose.toFixed(2) + " mg/L", px + 33, py + 32, 9.5, "#0b5c8a", "center");

    c.strokeStyle = "#0b5c8a";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(px + 33, py + 54);
    c.lineTo(px + 33, 142);
    c.stroke();
    c.beginPath();
    c.arc(px + 33, 150, 4, 0, Math.PI * 2);
    c.fillStyle = "#0b5c8a";
    c.fill();
    label("injection", px + 42, 132, 9, "#0b5c8a");

    // contact tank with baffles
    var tx = 150, ty = 96, tw = 210, th = 132;
    c.fillStyle = "#f4f8fa";
    c.strokeStyle = "#8fa0ab";
    c.lineWidth = 1.8;
    c.beginPath();
    c.rect(tx, ty, tw, th);
    c.fill();
    c.stroke();

    var turb = Math.min(1, 0.10 + 0.5 * (s.dose / 12));
    c.fillStyle = "rgba(206,214,180," + (0.18 + 0.30 * turb).toFixed(2) + ")";
    c.fillRect(tx + 2, ty + 22, tw - 4, th - 24);

    // baffles
    c.strokeStyle = "#9fb3bf";
    c.lineWidth = 3;
    for (var b = 1; b <= 3; b++) {
      var bx = tx + (tw / 4) * b;
      c.beginPath();
      if (b % 2 === 1) {
        c.moveTo(bx, ty + 22);
        c.lineTo(bx, ty + th - 16);
      } else {
        c.moveTo(bx, ty + 16);
        c.lineTo(bx, ty + th - 34);
      }
      c.stroke();
    }

    // flow path
    c.strokeStyle = "rgba(70,130,160,0.55)";
    c.lineWidth = 1.6;
    c.setLineDash([5, 4]);
    c.beginPath();
    c.moveTo(tx + 6, ty + 60);
    c.lineTo(tx + tw / 4, ty + 60);
    c.lineTo(tx + tw / 4, ty + th - 40);
    c.lineTo(tx + tw / 2, ty + th - 40);
    c.lineTo(tx + tw / 2, ty + 50);
    c.lineTo(tx + 3 * tw / 4, ty + 50);
    c.lineTo(tx + 3 * tw / 4, ty + th - 46);
    c.lineTo(tx + tw - 6, ty + th - 46);
    c.stroke();
    c.setLineDash([]);

    label("CONTACT CHAMBER", tx, ty - 12, 9, "#6b757e", "left", 700);
    label("t = " + s.t + " min", tx + tw, ty - 12, 10, "#3d464e", "right", 600);

    // outlet
    c.strokeStyle = "#9bb7c6";
    c.lineWidth = 10;
    c.beginPath();
    c.moveTo(tx + tw, ty + th - 46);
    c.lineTo(tx + tw + 62, ty + th - 46);
    c.stroke();
    c.strokeStyle = "#e8eef2";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(tx + tw, ty + th - 46);
    c.lineTo(tx + tw + 62, ty + th - 46);
    c.stroke();

    // analyser
    var ax = 396, ay = 60;
    c.fillStyle = "#e9e6e0";
    c.strokeStyle = "#b9b3a8";
    c.beginPath();
    c.rect(ax, ay, 132, 118);
    c.fill();
    c.stroke();
    label("FREE Cl ANALYSER", ax + 10, ay + 14, 8.5, "#6b757e", "left", 700);

    c.fillStyle = "#1c2226";
    c.fillRect(ax + 10, ay + 26, 112, 44);
    var res = curve(s.dose, s.n);
    c.fillStyle = res.free > 0 ? "#7fe3b0" : "#d9a06a";
    c.font = "600 20px ui-monospace, Menlo, Consolas, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(res.free.toFixed(2), ax + 66, ay + 46);
    c.font = "9px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = "#8fa0ab";
    c.fillText("mg/L", ax + 66, ay + 62);

    label("combined " + res.combined.toFixed(2), ax + 10, ay + 84, 9.5, "#6b757e");
    label("breakpoint " + res.bp.toFixed(1), ax + 10, ay + 100, 9.5, "#6b757e");

    var targetTone = res.free >= 0.2 && res.free <= 1.0 ? "#16603f" : res.free < 0.2 ? "#8d2020" : "#8a4a12";
    c.font = "600 10px -apple-system, Segoe UI, Roboto, sans-serif";
    c.fillStyle = targetTone;
    c.textAlign = "left";
    c.fillText(res.free >= 0.2 && res.free <= 1.0 ? "within target" : res.free < 0.2 ? "under-disinfected" : "above target", ax + 10, ay + 116);

    // note under tank
    label("4-pass baffled contactor", tx, ty + th + 20, 9.5, "#6b757e");
    label("Ct = " + (res.free * s.t).toFixed(0) + " mg·min/L", tx, ty + th + 38, 11, "#16191c", "left", 600);
  }

  /* ---------------- sync ---------------- */

  function sync() {
    s.n = Number($("s7-n").value) / 100;
    s.dose = Number($("s7-d").value) / 100;
    s.t = Number($("s7-t").value);
    s.temp = Number($("s7-temp").value);

    var res = curve(s.dose, s.n);
    var ct = res.free * s.t;
    var req = ctRequired(s.temp);
    var logRem = Math.min(4, 3 * (ct / req));

    $("s7-n-v").textContent = s.n.toFixed(2) + " mg/L";
    $("s7-d-v").textContent = s.dose.toFixed(2) + " mg/L";
    $("s7-t-v").textContent = s.t + " min";
    $("s7-temp-v").textContent = s.temp + " °C";

    $("s7-free").innerHTML = res.free.toFixed(2) + " <small>mg/L</small>";
    $("s7-comb").textContent = res.combined.toFixed(2) + " mg/L";
    $("s7-bp").textContent = res.bp.toFixed(1) + " mg/L";
    $("s7-ct").textContent = ct.toFixed(0) + " mg·min/L";
    $("s7-ctreq").textContent = req.toFixed(0) + " mg·min/L";
    $("s7-log").textContent = logRem.toFixed(2) + " log";

    var chip = $("s7-chip");
    if (res.free <= 0) {
      chip.className = "chip bad";
      chip.textContent = "No free residual — below breakpoint";
    } else if (res.free < 0.2) {
      chip.className = "chip warn";
      chip.textContent = "Free residual below 0.2 mg/L";
    } else if (res.free <= 1.0) {
      chip.className = "chip ok";
      chip.textContent = "Free residual within target";
    } else {
      chip.className = "chip warn";
      chip.textContent = "Free residual above 1.0 mg/L";
    }

    draw();
    drawCurve();
  }

  function drawCurve() {
    var maxDose = Math.max(6, 12 * s.n);
    var combPts = [], freePts = [];
    for (var i = 0; i <= 140; i++) {
      var d = (i / 140) * Math.max(maxDose * 1.2, s.dose * 1.1);
      var r = curve(d, s.n);
      combPts.push([d, r.combined]);
      freePts.push([d, r.free]);
    }
    var res = curve(s.dose, s.n);

    Lab.chart($("s7-curve"), {
      height: 260,
      x: { min: 0, max: Math.max(maxDose * 1.2, s.dose * 1.1), label: "Chlorine dose (mg/L as Cl₂)" },
      y: { min: 0, max: Math.max(2, res.bp * 0.6), label: "Residual (mg/L)" },
      series: [
        { pts: combPts, color: "#8a4a12", width: 2 },
        { pts: freePts, color: "#0b5c8a", width: 2 },
        { pts: [[res.bp, 0], [res.bp, Math.max(2, res.bp * 0.6)]], color: "#8d2020", dash: [5, 4], width: 1.2 }
      ],
      marker: { x: s.dose, y: res.free + res.combined, label: s.dose.toFixed(2) + " mg/L" },
      bands: [{ from: 0, to: 0.5, color: "rgba(22,96,63,0.05)" }]
    });
  }

  /* ---------------- actions ---------------- */

  var run = 0;

  function record() {
    var res = curve(s.dose, s.n);
    var ct = res.free * s.t;
    run++;
    Lab.addRow("s7-table", [
      run,
      s.n.toFixed(2),
      s.dose.toFixed(2),
      res.free.toFixed(2),
      ct.toFixed(0),
      Math.min(4, 3 * (ct / ctRequired(s.temp))).toFixed(2)
    ]);
  }

  function report() {
    var res = curve(s.dose, s.n);
    var ct = res.free * s.t;
    Lab.report({
      slug: "session-07-breakpoint",
      title: "Session 07 — Breakpoint Chlorination",
      session: "07",
      tableId: "s7-table",
      values: [
        ["Ammonia nitrogen", s.n.toFixed(2) + " mg/L as N"],
        ["Applied chlorine dose", s.dose.toFixed(2) + " mg/L as Cl₂"],
        ["Breakpoint dose", res.bp.toFixed(2) + " mg/L"],
        ["Combined residual", res.combined.toFixed(2) + " mg/L"],
        ["Free residual", res.free.toFixed(2) + " mg/L"],
        ["Contact time", s.t + " min"],
        ["Ct product", ct.toFixed(0) + " mg·min/L"],
        ["Ct required, 3-log Giardia", ctRequired(s.temp).toFixed(0) + " mg·min/L"],
        ["Log inactivation", Math.min(4, 3 * (ct / ctRequired(s.temp))).toFixed(2)]
      ],
      notes:
        "Breakpoint taken at 7.6 mg Cl₂ per mg NH₃–N, with a combined-residual peak at 5:1. Free residual " +
        "computed only beyond the breakpoint. Ct = free residual × contact time, compared with " +
        "temperature-corrected 3-log Giardia Ct values (≈228 mg·min/L at 10 °C, 96 at 20 °C)."
    });
  }

  $("s7-n").addEventListener("input", sync);
  $("s7-d").addEventListener("input", sync);
  $("s7-t").addEventListener("input", sync);
  $("s7-temp").addEventListener("input", sync);
  $("s7-record").addEventListener("click", record);
  $("s7-report").addEventListener("click", report);

  sync();
})();
