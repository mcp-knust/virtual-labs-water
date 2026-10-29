/* ==========================================================================
   MCP Virtual Laboratory — site behaviour
   No dependencies, no network calls. Every script fails quietly.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------- theme ----- */

  var root = document.documentElement;
  var THEME_KEY = "mcp-lab-theme";

  function storedTheme() {
    try {
      return window.localStorage.getItem(THEME_KEY);
    } catch (error) {
      return null;
    }
  }

  function storeTheme(value) {
    try {
      window.localStorage.setItem(THEME_KEY, value);
    } catch (error) {
      /* storage unavailable — the session still works */
    }
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var toggle = document.querySelector("[data-theme-toggle]");
    if (toggle) {
      toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      toggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance"
      );
    }
  }

  applyTheme(storedTheme() === "dark" ? "dark" : "light");

  document.addEventListener("click", function (event) {
    var toggle = event.target.closest("[data-theme-toggle]");
    if (!toggle) return;
    applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    storeTheme(root.getAttribute("data-theme"));
  });

  /* ------------------------------------------------------- mobile nav --- */

  var navToggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("site-nav");

  if (navToggle && nav) {
    var setNav = function (open) {
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        nav.removeAttribute("hidden");
      } else {
        nav.setAttribute("hidden", "");
      }
    };

    if (window.matchMedia("(min-width: 901px)").matches) {
      setNav(true);
    } else {
      setNav(false);
    }

    navToggle.addEventListener("click", function () {
      setNav(navToggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a") && window.matchMedia("(max-width: 900px)").matches) {
        setNav(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        setNav(false);
        navToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 901px)").matches) {
        nav.removeAttribute("hidden");
        navToggle.setAttribute("aria-expanded", "true");
      }
    });
  }

  /* ------------------------------------------------------- catalogue ---- */

  var table = document.querySelector("[data-catalogue]");

  if (table) {
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr"));
    var search = document.querySelector("[data-catalogue-search]");
    var count = document.querySelector("[data-catalogue-count]");
    var empty = document.querySelector("[data-catalogue-empty]");
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var pathway = "all";

    var matches = function (row, term) {
      if (pathway !== "all" && row.getAttribute("data-pathway") !== pathway) return false;
      if (!term) return true;
      return (row.getAttribute("data-search") || row.textContent).toLowerCase().indexOf(term) !== -1;
    };

    var render = function () {
      var term = (search && search.value ? search.value : "").trim().toLowerCase();
      var shown = 0;

      rows.forEach(function (row) {
        var visible = matches(row, term);
        if (visible) {
          row.removeAttribute("hidden");
          shown += 1;
        } else {
          row.setAttribute("hidden", "");
        }
      });

      if (count) {
        count.textContent = shown + " of " + rows.length + " sessions";
      }
      if (empty) {
        if (shown === 0) {
          empty.removeAttribute("hidden");
        } else {
          empty.setAttribute("hidden", "");
        }
      }
    };

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        pathway = chip.getAttribute("data-filter") || "all";
        chips.forEach(function (other) {
          other.setAttribute("aria-pressed", other === chip ? "true" : "false");
        });
        render();
      });
    });

    if (search) {
      search.addEventListener("input", render);
      search.addEventListener("search", render);
    }

    render();
  }

  /* ---------------------------------------------------------- viewer ---- */

  var frame = document.querySelector("[data-viewer-frame]");
  var titleEl = document.querySelector("[data-viewer-title]");
  var kindEl = document.querySelector("[data-viewer-kind]");
  var openLink = document.querySelector("[data-viewer-open]");
  var fallback = document.querySelector("[data-viewer-fallback]");

  var LABS = {
    quantum: {
      title: "Quantum Science & Technology",
      kind: "Interactive laboratory · 10 stations",
      src: "branches/quantum/Quantum_Science_Technology.html"
    },
    materials: {
      title: "Clean Water Through Materials Modelling",
      kind: "Presentation deck · 18 slides",
      src: "branches/materials/Clean_Water_Through_Materials_Modelling_v2.html"
    },
    outreach: {
      title: "Protecting Our Rivers: From Invisible Toxins to Quantum Tech",
      kind: "Outreach deck · World Rivers Day 2026",
      src: "branches/quantum/Submit-this.html"
    }
  };

  if (frame) {
    var requested = "";
    try {
      requested = new URLSearchParams(window.location.search).get("lab") || "";
    } catch (error) {
      requested = "";
    }

    var lab = LABS[requested];

    if (!lab) {
      if (fallback) fallback.removeAttribute("hidden");
      frame.setAttribute("hidden", "");
    } else {
      frame.removeAttribute("hidden");
      if (fallback) fallback.setAttribute("hidden", "");
      frame.setAttribute("src", lab.src);
      frame.setAttribute("title", lab.title + " — interactive lab");
      document.title = lab.title + " · MCP Virtual Laboratory";
      if (titleEl) titleEl.textContent = lab.title;
      if (kindEl) kindEl.textContent = lab.kind;
      if (openLink) {
        openLink.setAttribute("href", lab.src);
        openLink.removeAttribute("hidden");
      }
    }
  }

  /* ------------------------------------------------------------ year ---- */

  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
