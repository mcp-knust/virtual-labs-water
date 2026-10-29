/* MCP KNUST — Water Engineering Virtual Laboratory
   Shared chrome, navigation, progress, observation tables, report export, charting. */
(function () {
  "use strict";

  var SESSIONS = [
    { n: 1, slug: "session-01-turbidity", title: "Turbidity & Apparent Colour", sub: "Nephelometry and Pt-Co colour determination", min: 45 },
    { n: 2, slug: "session-02-alkalinity", title: "pH, Acidity & Alkalinity", sub: "Titrimetric determination and species distribution", min: 50 },
    { n: 3, slug: "session-03-hardness", title: "Total Hardness by EDTA Titration", sub: "Complexometric titration as CaCO\u2083", min: 45 },
    { n: 4, slug: "session-04-jar-test", title: "Jar Test: Coagulation & Flocculation", sub: "Optimum alum dose and pH selection", min: 60 },
    { n: 5, slug: "session-05-sedimentation", title: "Sedimentation: Type I Settling", sub: "Stokes' law, settling column and removal efficiency", min: 60 },
    { n: 6, slug: "session-06-filtration", title: "Rapid Sand Filtration", sub: "Clean-bed head loss, filter run and backwash", min: 55 },
    { n: 7, slug: "session-07-disinfection", title: "Breakpoint Chlorination", sub: "Chlorine demand, residual and Ct disinfection", min: 45 },
    { n: 8, slug: "session-08-bod", title: "Dissolved Oxygen & BOD\u2085", sub: "Winkler method, BOD kinetics and DO sag", min: 60 },
    { n: 9, slug: "session-09-cod", title: "Chemical Oxygen Demand", sub: "Dichromate reflux and biodegradability ratio", min: 45 },
    { n: 10, slug: "session-10-pipe-flow", title: "Head Loss in Water Distribution Pipes", sub: "Darcy\u2013Weisbach, Colebrook\u2013White and minor losses", min: 50 }
  ];

  var PROGRESS_KEY = "mcp-water-lab-progress-v1";

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function getProgress() {
    try {
      var raw = localStorage.getItem(PROGRESS_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(function (x) { return typeof x === "number"; }) : [];
    } catch (e) { return []; }
  }

  function setProgress(arr) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(arr)); } catch (e) { /* private mode */ }
  }

  function isDone(n) { return getProgress().indexOf(n) !== -1; }

  function setDone(n, done) {
    var arr = getProgress().filter(function (x) { return x !== n; });
    if (done) arr.push(n);
    arr.sort(function (a, b) { return a - b; });
    setProgress(arr);
    updateChrome();
    return arr;
  }

  function completedCount() { return getProgress().length; }

  /* ---------- chrome ---------- */

  function buildChrome() {
    var host = qs("#chrome");
    if (host) {
      host.outerHTML =
        '<header class="topbar"><div class="topbar-inner">' +
        '<a class="brand" href="../index.html">' +
        '<span class="brand-mark">MCP</span>' +
        '<span class="brand-name">KNUST \u00b7 Water Engineering Virtual Lab</span>' +
        "</a>" +
        '<span class="topbar-spacer"></span>' +
        '<div class="topbar-meta">College of Science \u00b7 Department of Civil Engineering<br>' +
        "Virtual laboratory manual \u00b7 2026</div>" +
        "</div></header>";
    }

    var side = qs("#sidebar");
    if (side) {
      var current = Number(document.body.getAttribute("data-session") || 0);
      var items = SESSIONS.map(function (s) {
        return (
          '<li class="' + (s.n === current ? "current" : "") + '">' +
          '<a href="' + s.slug + '.html">' +
          '<span class="sn">' + pad(s.n) + "</span>" +
          "<span>" + s.title + "</span>" +
          "</a></li>"
        );
      }).join("");

      side.innerHTML =
        '<h2>Sessions</h2>' +
        '<div class="side-progress">' +
        '<div class="lbl"><span>Completed</span><span id="progress-count">' + completedCount() + " / " + SESSIONS.length + "</span></div>" +
        '<div class="bar"><span id="progress-bar"></span></div>' +
        "</div>" +
        "<ol>" + items + "</ol>" +
        '<h2>Reference</h2>' +
        '<ol><li><a href="../index.html"><span class="sn">\u2190</span><span>Lab home</span></a></li></ol>';
    }

    var pager = qs("#pager");
    if (pager) {
      var n = Number(document.body.getAttribute("data-session") || 0);
      var prev = SESSIONS.filter(function (s) { return s.n === n - 1; })[0];
      var next = SESSIONS.filter(function (s) { return s.n === n + 1; })[0];
      var html = "";
      html += prev
        ? '<a href="' + prev.slug + '.html"><span class="dir">\u2190 Previous</span>' + pad(prev.n) + " \u00b7 " + prev.title + "</a>"
        : '<a href="../index.html"><span class="dir">\u2190 Up</span>Lab home</a>';
      html += next
        ? '<a class="next" href="' + next.slug + '.html"><span class="dir">Next \u2192</span>' + pad(next.n) + " \u00b7 " + next.title + "</a>"
        : '<a class="next" href="../index.html"><span class="dir">Finish \u2192</span>Back to lab home</a>';
      pager.innerHTML = html;
    }

    updateChrome();
  }

  function updateChrome() {
    var bar = qs("#progress-bar");
    var count = qs("#progress-count");
    var pct = Math.round((completedCount() / SESSIONS.length) * 100);
    if (bar) bar.style.width = pct + "%";
    if (count) count.textContent = completedCount() + " / " + SESSIONS.length;

    qsa("[data-complete-btn]").forEach(function (btn) {
      var n = Number(btn.getAttribute("data-complete-btn"));
      var done = isDone(n);
      btn.textContent = done ? "\u2713 Session marked complete" : "Mark session complete";
      btn.classList.toggle("primary", !done);
      btn.classList.toggle("ghost", done);
    });

    qsa("[data-progress-tick]").forEach(function (el) {
      el.classList.toggle("on", isDone(Number(el.getAttribute("data-progress-tick"))));
    });
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- formatting ---------- */

  function fmt(x, dp) {
    if (x === null || x === undefined || !isFinite(x)) return "\u2014";
    var d = dp === undefined ? 2 : dp;
    return Number(x).toFixed(d);
  }

  function sig(x, s) {
    if (x === null || x === undefined || !isFinite(x)) return "\u2014";
    if (x === 0) return "0";
    var digits = s || 3;
    var mag = Math.floor(Math.log10(Math.abs(x)));
    var d = Math.max(0, digits - 1 - mag);
    return Number(x).toFixed(Math.min(d, 8));
  }

  /* ---------- observation tables ---------- */

  function addRow(tableId, cells) {
    var tbody = qs("#" + tableId + " tbody");
    if (!tbody) return;
    var empty = tbody.querySelector(".table-empty");
    if (empty) empty.parentNode.removeChild(empty);
    var tr = document.createElement("tr");
    cells.forEach(function (c) {
      var td = document.createElement("td");
      if (typeof c === "number") {
        td.className = "num";
        td.textContent = Number.isInteger(c) ? String(c) : fmt(c, 2);
      } else {
        td.textContent = c === null || c === undefined ? "\u2014" : String(c);
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  function setEmptyRow(tableId, message) {
    var tbody = qs("#" + tableId + " tbody");
    if (!tbody) return;
    var cols = qsa("thead th", tbody.closest("table")).length || 1;
    tbody.innerHTML = '<tr class="table-empty"><td colspan="' + cols + '">' +
      (message || "No readings recorded yet — run the simulation above.") + "</td></tr>";
  }

  function clearTable(tableId, message) {
    setEmptyRow(tableId, message);
  }

  function tableCSV(tableId) {
    var table = qs("#" + tableId);
    if (!table) return "";
    var rows = [];
    qsa("tr", table).forEach(function (tr) {
      var cells = qsa("th,td", tr).map(function (c) {
        var t = c.textContent.replace(/\s+/g, " ").trim();
        return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
      });
      if (cells.length && !tr.classList.contains("table-empty")) rows.push(cells.join(","));
    });
    return rows.join("\n");
  }

  function saveText(filename, text) {
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function exportTable(tableId, filename) {
    var csv = tableCSV(tableId);
    if (!csv) return;
    saveText(filename || tableId + ".csv", csv + "\n");
  }

  /* ---------- line chart ---------- */

  function niceStep(span, target) {
    var raw = span / (target || 5);
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var step = norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1;
    return step * mag;
  }

  function drawChart(canvas, cfg) {
    if (!canvas) return;
    canvas._cfg = cfg;
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth || 480;
    var h = cfg.height || 260;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var pad = { l: 58, r: 16, t: 16, b: 42 };
    var plotW = Math.max(10, w - pad.l - pad.r);
    var plotH = Math.max(10, h - pad.t - pad.b);
    var x = cfg.x || { min: 0, max: 1 };
    var y = cfg.y || { min: 0, max: 1 };
    var xf = cfg.xFormat || function (v) { return String(Math.round(v * 1000) / 1000); };
    var yf = cfg.yFormat || function (v) { return String(Math.round(v * 100) / 100); };

    function px(v) { return pad.l + ((v - x.min) / (x.max - x.min)) * plotW; }
    function py(v) { return pad.t + plotH - ((v - y.min) / (y.max - y.min)) * plotH; }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // bands
    (cfg.bands || []).forEach(function (b) {
      var y0 = py(b.from), y1 = py(b.to);
      ctx.fillStyle = b.color || "rgba(11,92,138,0.07)";
      ctx.fillRect(pad.l, Math.min(y0, y1), plotW, Math.abs(y1 - y0));
    });

    // grid
    var yStep = niceStep(y.max - y.min, 5);
    var xStep = niceStep(x.max - x.min, 6);
    ctx.font = "11px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillStyle = "#6b757e";
    ctx.strokeStyle = "#e6e2da";
    ctx.lineWidth = 1;

    var yv = Math.ceil(y.min / yStep) * yStep;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    while (yv <= y.max + 1e-9) {
      var yy = py(yv);
      ctx.beginPath();
      ctx.moveTo(pad.l, yy);
      ctx.lineTo(pad.l + plotW, yy);
      ctx.stroke();
      ctx.fillText(yf(yv), pad.l - 8, yy);
      yv += yStep;
    }

    var xv = Math.ceil(x.min / xStep) * xStep;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    while (xv <= x.max + 1e-9) {
      var xx = px(xv);
      ctx.beginPath();
      ctx.moveTo(xx, pad.t);
      ctx.lineTo(xx, pad.t + plotH);
      ctx.stroke();
      ctx.fillText(xf(xv), xx, pad.t + plotH + 7);
      xv += xStep;
    }

    // axes
    ctx.strokeStyle = "#b9b3a8";
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + plotH);
    ctx.lineTo(pad.l + plotW, pad.t + plotH);
    ctx.stroke();

    // axis labels
    ctx.fillStyle = "#3d464e";
    ctx.font = "11px -apple-system, Segoe UI, Roboto, sans-serif";
    if (x.label) {
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(x.label, pad.l + plotW / 2, h - 4);
    }
    if (y.label) {
      ctx.save();
      ctx.translate(11, pad.t + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(y.label, 0, 0);
      ctx.restore();
    }

    // series
    (cfg.series || []).forEach(function (s) {
      if (!s.pts || !s.pts.length) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.l, pad.t, plotW, plotH);
      ctx.clip();

      if (s.fill) {
        ctx.beginPath();
        ctx.moveTo(px(s.pts[0][0]), py(y.min));
        s.pts.forEach(function (p) { ctx.lineTo(px(p[0]), py(p[1])); });
        ctx.lineTo(px(s.pts[s.pts.length - 1][0]), py(y.min));
        ctx.closePath();
        ctx.fillStyle = s.fill;
        ctx.fill();
      }

      ctx.beginPath();
      s.pts.forEach(function (p, i) {
        if (i === 0) ctx.moveTo(px(p[0]), py(p[1]));
        else ctx.lineTo(px(p[0]), py(p[1]));
      });
      ctx.strokeStyle = s.color || "#0b5c8a";
      ctx.lineWidth = s.width || 2;
      ctx.setLineDash(s.dash || []);
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.setLineDash([]);

      if (s.dots) {
        s.pts.forEach(function (p) {
          ctx.beginPath();
          ctx.arc(px(p[0]), py(p[1]), s.dotR || 3, 0, Math.PI * 2);
          ctx.fillStyle = s.color || "#0b5c8a";
          ctx.fill();
        });
      }
      ctx.restore();
    });

    // marker
    if (cfg.marker) {
      var mx = px(cfg.marker.x), my = py(cfg.marker.y);
      ctx.strokeStyle = "#8a4a12";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(mx, pad.t);
      ctx.lineTo(mx, pad.t + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#8a4a12";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (cfg.marker.label) {
        ctx.fillStyle = "#16191c";
        ctx.font = "11px -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.textAlign = mx > pad.l + plotW * 0.7 ? "right" : "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(cfg.marker.label, mx + (mx > pad.l + plotW * 0.7 ? -8 : 8), my - 8);
      }
    }
  }

  var charts = [];
  function chart(canvas, cfg) {
    if (!canvas) return;
    if (charts.indexOf(canvas) === -1) {
      charts.push(canvas);
      if (window.ResizeObserver) {
        var ro = new ResizeObserver(function () {
          if (canvas._cfg) drawChart(canvas, canvas._cfg);
        });
        ro.observe(canvas);
      }
    }
    drawChart(canvas, cfg);
  }

  /* ---------- canvas ---------- */

  function ctx2d(cv, w, h) {
    var dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.width = "100%";
    cv.style.maxWidth = w + "px";
    cv.style.height = "auto";
    var c = cv.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return c;
  }

  /* ---------- water quality classification helpers ---------- */

  function statusChip(el, value, bands, unit) {
    // bands: [{max, cls, label}]
    if (!el) return;
    var hit = null;
    for (var i = 0; i < bands.length; i++) {
      if (value <= bands[i].max) { hit = bands[i]; break; }
    }
    if (!hit) hit = bands[bands.length - 1];
    el.className = "chip " + (hit.cls || "");
    el.textContent = hit.label + (unit ? " \u00b7 " + fmt(value, 2) + " " + unit : "");
  }

  /* ---------- report ---------- */

  function buildReport(opts) {
    var d = new Date();
    var stamp = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    var lines = [];
    lines.push("# " + (opts.title || "Virtual laboratory session"));
    lines.push("");
    lines.push("**Course:** Water Engineering Virtual Laboratory — MCP KNUST  ");
    if (opts.session) lines.push("**Session:** " + opts.session + "  ");
    lines.push("**Date:** " + stamp + "  ");
    lines.push("**Source:** simulated apparatus, teaching model");
    lines.push("");
    if (opts.values && opts.values.length) {
      lines.push("## Results");
      lines.push("");
      lines.push("| Quantity | Value |");
      lines.push("| --- | --- |");
      opts.values.forEach(function (v) {
        lines.push("| " + v[0] + " | " + v[1] + " |");
      });
      lines.push("");
    }
    if (opts.notes) {
      lines.push("## Analysis");
      lines.push("");
      lines.push(opts.notes);
      lines.push("");
    }
    if (opts.tableId) {
      var csv = tableCSV(opts.tableId);
      if (csv) {
        lines.push("## Observation sheet");
        lines.push("");
        lines.push("```csv");
        lines.push(csv);
        lines.push("```");
        lines.push("");
      }
    }
    lines.push("---");
    lines.push("");
    lines.push("*Generated from the MCP KNUST Water Engineering Virtual Laboratory. Simulated values are for teaching only and are not field measurements.*");
    return lines.join("\n");
  }

  /* ---------- init ---------- */

  function init() {
    var sessionNo = Number(document.body.getAttribute("data-session") || 0);
    if (sessionNo) {
      qsa("[data-session-complete]").forEach(function (el) {
        el.innerHTML = '<button type="button" data-complete-btn="' + sessionNo + '">Mark session complete</button>';
      });
    }

    buildChrome();

    document.addEventListener("click", function (e) {
      var t = e.target;
      if (t.matches("[data-complete-btn]")) {
        var n = Number(t.getAttribute("data-complete-btn"));
        setDone(n, !isDone(n));
      }
      if (t.matches(".qa .toggle")) {
        var qa = t.closest(".qa");
        qa.classList.toggle("open");
        t.textContent = qa.classList.contains("open") ? "Hide answer" : "Show answer";
        t.setAttribute("aria-expanded", qa.classList.contains("open") ? "true" : "false");
      }
      var dl = t.closest("[data-export]");
      if (dl) {
        var id = dl.getAttribute("data-export");
        exportTable(id, dl.getAttribute("data-filename") || id + ".csv");
      }
      var cl = t.closest("[data-clear]");
      if (cl) {
        clearTable(cl.getAttribute("data-clear"));
      }
    });

    qsa("table[data-empty]").forEach(function (t) {
      if (!t.querySelector("tbody tr")) setEmptyRow(t.id, t.getAttribute("data-empty"));
    });
  }

  window.Lab = {
    sessions: SESSIONS,
    qs: qs,
    qsa: qsa,
    fmt: fmt,
    sig: sig,
    pad: pad,
    addRow: addRow,
    clearTable: clearTable,
    exportTable: exportTable,
    saveText: saveText,
    tableCSV: tableCSV,
    chart: chart,
    ctx2d: ctx2d,
    statusChip: statusChip,
    report: function (opts) {
      var name = (opts.slug || "session") + "-report.md";
      saveText(name, buildReport(opts));
    },
    getProgress: getProgress,
    isDone: isDone,
    setDone: setDone,
    completeBtn: function (n) {
      return '<button type="button" data-complete-btn="' + n + '">Mark session complete</button>';
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
