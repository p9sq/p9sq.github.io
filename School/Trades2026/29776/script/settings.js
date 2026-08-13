// site-wide settings: theme, units, distance unit
// runs before the other page scripts so the theme applies before first paint

(function () {
  const STORAGE_KEY = "archiveSettings";
  const defaults = { theme: "light", units: "metric", distUnit: "ly" };

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaults };
      return { ...defaults, ...JSON.parse(raw) };
    } catch (e) {
      // private browsing or storage blocked, just fall back to defaults
      return { ...defaults };
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      // settings just won't persist this session
    }
  }

  let current = loadSettings();
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function applyTheme() {
    let theme = current.theme;
    if (theme === "system") {
      theme = darkQuery.matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", theme);
  }

  applyTheme();

  darkQuery.addEventListener("change", function () {
    if (current.theme === "system") applyTheme();
  });

  window.getSettings = function () {
    return current;
  };

  window.updateSetting = function (key, value) {
    current[key] = value;
    saveSettings(current);
    if (key === "theme") applyTheme();
    document.dispatchEvent(
      new CustomEvent("settingschange", { detail: current }),
    );
  };

  // build the settings button and panel once the nav exists
  document.addEventListener("DOMContentLoaded", function () {
    const nav = document.querySelector(".nav");
    if (!nav) return;

    const wrap = document.createElement("div");
    wrap.className = "settings-wrap";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "settings-toggle";
    toggleBtn.setAttribute("aria-label", "Settings");
    toggleBtn.textContent = "⚙";

    const panel = document.createElement("div");
    panel.className = "settings-panel";
    panel.innerHTML = `
      <div class="settings-group" data-key="theme">
        <div class="settings-label">Theme</div>
        <div class="settings-options">
          <button data-value="light">Light</button>
          <button data-value="dark">Dark</button>
          <button data-value="system">System</button>
        </div>
      </div>
      <div class="settings-group" data-key="units">
        <div class="settings-label">Units</div>
        <div class="settings-options">
          <button data-value="metric">Metric</button>
          <button data-value="imperial">Imperial</button>
        </div>
      </div>
      <div class="settings-group" data-key="distUnit">
        <div class="settings-label">Distance</div>
        <div class="settings-options">
          <button data-value="ly">Light Years</button>
          <button data-value="pc">Parsecs</button>
        </div>
      </div>
    `;

    function refreshActiveStates() {
      panel.querySelectorAll(".settings-group").forEach(function (group) {
        const key = group.dataset.key;
        group.querySelectorAll("button").forEach(function (b) {
          b.classList.toggle("active", b.dataset.value === current[key]);
        });
      });
    }

    panel.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-value]");
      if (!btn) return;
      const key = btn.closest(".settings-group").dataset.key;
      window.updateSetting(key, btn.dataset.value);
      refreshActiveStates();
    });

    toggleBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      panel.classList.toggle("open");
    });

    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) panel.classList.remove("open");
    });

    refreshActiveStates();

    wrap.appendChild(toggleBtn);
    wrap.appendChild(panel);

    const navStatus = nav.querySelector(".nav-status");
    if (navStatus) {
      nav.insertBefore(wrap, navStatus);
    } else {
      nav.appendChild(wrap);
    }
  });
})();
