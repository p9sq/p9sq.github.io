// site-wide settings: theme, units, distance unit
// runs before the other page scripts so the theme applies before first paint

var SETTINGS_STORAGE_KEY = "archiveSettings";
var settingsDefaults = { theme: "light", units: "metric", distUnit: "ly" };

function loadSettings() {
  try {
    var raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return mergeSettings(settingsDefaults, {});
    return mergeSettings(settingsDefaults, JSON.parse(raw));
  } catch (e) {
    // private browsing or storage blocked, just fall back to defaults
    return mergeSettings(settingsDefaults, {});
  }
}

// copies base then overlays saved on top, without touching either object
function mergeSettings(base, saved) {
  var result = {};
  for (var key in base) {
    result[key] = base[key];
  }
  for (var key2 in saved) {
    result[key2] = saved[key2];
  }
  return result;
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // settings just won't persist this session
  }
}

var currentSettings = loadSettings();
var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme() {
  var theme = currentSettings.theme;
  if (theme === "system") {
    theme = darkQuery.matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", theme);
}

applyTheme();

darkQuery.addEventListener("change", function () {
  if (currentSettings.theme === "system") applyTheme();
});

window.getSettings = function () {
  return currentSettings;
};

window.updateSetting = function (key, value) {
  currentSettings[key] = value;
  saveSettings(currentSettings);
  if (key === "theme") applyTheme();
  document.dispatchEvent(
    new CustomEvent("settingschange", { detail: currentSettings }),
  );
};

// build the settings button and panel once the nav exists
document.addEventListener("DOMContentLoaded", function () {
  var nav = document.querySelector(".nav");
  if (!nav) return;

  var wrap = document.createElement("div");
  wrap.className = "settings-wrap";

  var toggleBtn = document.createElement("button");
  toggleBtn.className = "settings-toggle";
  toggleBtn.setAttribute("aria-label", "Settings");
  toggleBtn.textContent = "⚙";

  var panel = document.createElement("div");
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
    var groups = panel.querySelectorAll(".settings-group");
    groups.forEach(function (group) {
      var key = group.dataset.key;
      var buttons = group.querySelectorAll("button");
      buttons.forEach(function (b) {
        b.classList.toggle("active", b.dataset.value === currentSettings[key]);
      });
    });
  }

  panel.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-value]");
    if (!btn) return;
    var key = btn.closest(".settings-group").dataset.key;
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

  var navStatus = nav.querySelector(".nav-status");
  if (navStatus) {
    nav.insertBefore(wrap, navStatus);
  } else {
    nav.appendChild(wrap);
  }
});
