(() => {
  const THEMES = {
    "Default": { bg: "#fffbef", fg: "#222222" },
    "Castle": { bg: "#171628", fg: "#ffffff" },
    "ProveIt": { bg: "#223c5f", fg: "#ff3300" },
    "HakunaMatata": { bg: "#0c2c73", fg: "#ffffff" },
    "Drawer": { bg: "#1d2643", fg: "#02d3be" },
    "tooSigma": { bg: "#00a5bd", fg: "#edf9fa" },
    "PokerRiver": { bg: "#0e4888", fg: "#e7f2f8" },
    "PlainJane": { bg: "#ffffff", fg: "#000000" },
    "insiderTrader27": { bg: "#000000", fg: "#00aeef" },
    "HormoneReplacementTherapy": { bg: "#fc8404", fg: "#ffffff" },
    "Musashi": { bg: "#405270", fg: "#ffffff" },
    "Root": { bg: "#000000", fg: "#66b361" }
  };

  const THEME_ORDER = [
    "Default", "Castle", "ProveIt", "HakunaMatata", "Drawer",
    "tooSigma", "PokerRiver", "PlainJane", "insiderTrader27",
    "HormoneReplacementTherapy", "Musashi", "Root"
  ];

  const STORAGE_KEY = "siteThemeIndex";

  function applyTheme(name) {
    const t = THEMES[name] || THEMES["Default"];
    document.documentElement.style.setProperty("--bg", t.bg);
    document.documentElement.style.setProperty("--fg", t.fg);
    document.body.style.background = t.bg;
    document.body.style.color = t.fg;
  }

  function getThemeIndex() {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    if (Number.isInteger(saved) && saved >= 0 && saved < THEME_ORDER.length) {
      return saved;
    }
    return 0;
  }

  function setThemeIndex(i) {
    localStorage.setItem(STORAGE_KEY, String(i));
  }

  function repaint() {
    const next = (getThemeIndex() + 1) % THEME_ORDER.length;
    setThemeIndex(next);
    applyTheme(THEME_ORDER[next]);
  }

  function initTheme() {
    applyTheme(THEME_ORDER[getThemeIndex()]);
  }

  window.SiteTheme  = {
    initTheme,
    applyTheme,
    repaint,
    THEMES,
    THEME_ORDER
  };
})();
