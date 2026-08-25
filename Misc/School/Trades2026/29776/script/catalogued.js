// this page shows every catalogued system in a table

// colour per spectral class, based on real star colours
var SPECTRAL_COLORS = {
  O: "#b0d4ff",
  B: "#cce0ff",
  A: "#e8f0ff",
  F: "#fffde0",
  G: "#ffe87a",
  K: "#ffaa44",
  M: "#ff6633",
  L: "#cc3300",
  T: "#661100",
  Y: "#330000",
  P: "#a070ff",
  D: "#88aacc",
  X: "#4b0082",
};

function spectralColor(sc) {
  if (!sc) return "#7a92b8";
  return SPECTRAL_COLORS[sc[0].toUpperCase()] || "#7a92b8";
}

// class "P" has no parent star and class "X" is a black hole, both need a proper label
function spectralLabel(sc) {
  if (!sc) return "—";
  var c = sc[0].toUpperCase();
  if (c === "P") return "Rogue object/Free floating";
  if (c === "X") return "Black hole";
  return sc;
}

// class "P" means a rogue system, no parent star
function isRogue(sys) {
  return sys.spectralClass && sys.spectralClass[0].toUpperCase() === "P";
}

// treat 0 major / 0 dwarf the same as no moon data at all
function hasMoons(sys) {
  return sys.moonCount && (sys.moonCount.major > 0 || sys.moonCount.dwarf > 0);
}

function lifeBadge(exists) {
  if (exists === true)
    return '<span class="badge badge-life">● CONFIRMED</span>';
  if (exists === "pending")
    return '<span class="badge badge-pending">◌ PENDING</span>';
  return '<span class="badge badge-nolife">✕ NONE</span>';
}

function lifeStatusText(exists) {
  if (exists === true)
    return '<span style="color:var(--green)">CONFIRMED</span>';
  if (exists === "pending")
    return '<span style="color:var(--yellow)">PENDING REVIEW</span>';
  return '<span style="color:#f87171">NOT DETECTED</span>';
}

function renderTable(data) {
  var tbody = document.getElementById("catalogueBody");
  tbody.innerHTML = "";

  var countEl = document.getElementById("resultsCount");

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="11" style="text-align:center;padding:3rem;color:var(--text-dimmer);font-family:var(--font-mono);font-size:0.75rem;">NO MATCHING RECORDS</td></tr>';
    countEl.textContent = "0 systems";
    return;
  }

  countEl.textContent =
    data.length + " system" + (data.length !== 1 ? "s" : "");

  for (var i = 0; i < data.length; i++) {
    var name = data[i][0];
    var sys = data[i][1];
    var rogue = isRogue(sys);

    var moonCell =
      '<span style="color:var(--text-dimmer);font-size:0.65rem">N/A</span>';
    if (hasMoons(sys)) {
      moonCell = sys.moonCount.major + " maj / " + sys.moonCount.dwarf + " dwf";
    } else if (rogue && sys.moonCount == null) {
      moonCell = "—";
    }

    var thumbHtml = sys.thumbnail
      ? '<img class="td-thumb" src="' +
        sys.thumbnail +
        '" alt="' +
        name +
        '" onerror="this.style.display=\'none\'">'
      : '<div class="td-thumb-placeholder">⬡</div>';

    var tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${thumbHtml}</td>
      <td class="td-desig">${sys.designation || "—"}</td>
      <td class="td-name">${name}</td>
      <td>${sys.systemType || "—"}</td>
      <td style="color:${spectralColor(sys.spectralClass)};font-family:var(--font-mono)">${spectralLabel(sys.spectralClass)}</td>
      <td>${fmtDist(sys.distToSun)}</td>
      <td>${sys.planetCount ? sys.planetCount.major + " maj / " + sys.planetCount.dwarf + " dwf" : "—"}</td>
      <td>${moonCell}</td>
      <td style="font-size:0.65rem">${sys.discDate ? sys.discDate.split(" ")[0] : "—"}</td>
      <td style="color:var(--accent-bright)">${sys.pioneer || "—"}</td>
      <td>${lifeBadge(sys.life ? sys.life.exists : undefined)}</td>
    `;

    // use an IIFE so each row remembers its own name/sys instead of the last one in the loop
    tr.addEventListener(
      "click",
      (function (n, s) {
        return function () {
          openModal(n, s);
        };
      })(name, sys),
    );

    tbody.appendChild(tr);
  }
}

function openModal(name, sys) {
  var modal = document.getElementById("modal");
  var content = document.getElementById("modalContent");

  var moonFields = "";
  if (hasMoons(sys)) {
    moonFields = `
    <div class="modal-field"><div class="modal-field-label">Major Moons</div><div class="modal-field-val">${sys.moonCount.major}</div></div>
    <div class="modal-field"><div class="modal-field-label">Dwarf Moons</div><div class="modal-field-val">${sys.moonCount.dwarf}</div></div>
  `;
  }

  var lifeExists = sys.life ? sys.life.exists : undefined;

  var lifeExtra = "";
  if (lifeExists === true) {
    lifeExtra = `
        <div class="modal-field"><div class="modal-field-label">Objects with Life</div><div class="modal-field-val">${sys.life.objectsWithLife}</div></div>
        <div class="modal-field" style="grid-column:1/-1"><div class="modal-field-label">Life Types</div><div class="modal-field-val">${sys.life.types || "—"}</div></div>
      `;
  }

  content.innerHTML = `
    ${sys.thumbnail ? `<img class="modal-thumb" src="${sys.thumbnail}" alt="${name}" onerror="this.remove()">` : ""}
    <div class="modal-title">${name}</div>
    <div class="modal-sub">${sys.designation || "No Designation"}</div>
    <div class="modal-section-title">SYSTEM DATA</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">System Type</div><div class="modal-field-val">${sys.systemType || "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">Spectral Class</div><div class="modal-field-val" style="color:${spectralColor(sys.spectralClass)}">${spectralLabel(sys.spectralClass)}</div></div>
      <div class="modal-field"><div class="modal-field-label">Distance from Athovon</div><div class="modal-field-val">${fmtDist(sys.distToSun)}</div></div>
      <div class="modal-field"><div class="modal-field-label">Parent Sun</div><div class="modal-field-val">${sys.parentSun || "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">Major Planets</div><div class="modal-field-val">${sys.planetCount ? sys.planetCount.major : "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">Dwarf Planets</div><div class="modal-field-val">${sys.planetCount ? sys.planetCount.dwarf : "—"}</div></div>
      ${moonFields}
    </div>
    <div class="modal-section-title">DISCOVERY</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Discovery Date</div><div class="modal-field-val">${sys.discDate || "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">Method</div><div class="modal-field-val">${sys.discMethod || "—"}</div></div>
      <div class="modal-field" style="grid-column:1/-1"><div class="modal-field-label">Pioneer</div><div class="modal-field-val">${sys.pioneer || "—"}</div></div>
    </div>
    <div class="modal-section-title">LIFE STATUS</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Life Exists</div><div class="modal-field-val">${lifeStatusText(lifeExists)}</div></div>
      ${lifeExtra}
    </div>
  `;

  modal.classList.add("open");
  document.body.classList.add("no-scroll");
}

function applySort(entries, sortVal) {
  var sorted = entries.slice();

  if (sortVal === "dist-asc") {
    sorted.sort(function (a, b) {
      var da = a[1].distToSun == null ? Infinity : a[1].distToSun;
      var db = b[1].distToSun == null ? Infinity : b[1].distToSun;
      return da - db;
    });
  } else if (sortVal === "dist-desc") {
    sorted.sort(function (a, b) {
      var da = a[1].distToSun == null ? -Infinity : a[1].distToSun;
      var db = b[1].distToSun == null ? -Infinity : b[1].distToSun;
      return db - da;
    });
  } else if (sortVal === "alpha-asc") {
    sorted.sort(function (a, b) {
      return a[0].localeCompare(b[0]);
    });
  } else if (sortVal === "alpha-desc") {
    sorted.sort(function (a, b) {
      return b[0].localeCompare(a[0]);
    });
  }

  return sorted;
}

function updateDistHeader() {
  var th = document.getElementById("distHeader");
  if (th) th.textContent = "DIST (" + getSettings().distUnit + ")";
}

function filterAndRender() {
  updateDistHeader();

  var query = document.getElementById("searchBox").value.toLowerCase();
  var typeFilter = document.getElementById("filterType").value;
  var lifeFilter = document.getElementById("filterLife").value;
  var sortVal = document.getElementById("sortSelect").value;

  var entries = Object.entries(CATALOGUED_SYSTEMS);

  entries = entries.filter(function (entry) {
    var name = entry[0];
    var sys = entry[1];

    var matchText =
      !query ||
      name.toLowerCase().indexOf(query) !== -1 ||
      (sys.designation || "").toLowerCase().indexOf(query) !== -1 ||
      (sys.pioneer || "").toLowerCase().indexOf(query) !== -1 ||
      (sys.spectralClass || "").toLowerCase().indexOf(query) !== -1;

    var matchType =
      !typeFilter ||
      (typeFilter === "Rogue" ? isRogue(sys) : sys.systemType === typeFilter);

    var lifeVal = sys.life ? sys.life.exists : undefined;
    var matchLife = !lifeFilter || String(lifeVal) === lifeFilter;

    return matchText && matchType && matchLife;
  });

  renderTable(applySort(entries, sortVal));
}

window.addEventListener("DOMContentLoaded", function () {
  filterAndRender();

  document
    .getElementById("searchBox")
    .addEventListener("input", filterAndRender);
  document
    .getElementById("filterType")
    .addEventListener("change", filterAndRender);
  document
    .getElementById("filterLife")
    .addEventListener("change", filterAndRender);
  document
    .getElementById("sortSelect")
    .addEventListener("change", filterAndRender);

  var modal = document.getElementById("modal");

  document.getElementById("modalClose").addEventListener("click", function () {
    modal.classList.remove("open");
    document.body.classList.remove("no-scroll");
  });

  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.remove("open");
      document.body.classList.remove("no-scroll");
    }
  });

  // ly/pc and metric/imperial live in localStorage, re-render whenever the settings panel changes
  document.addEventListener("settingschange", filterAndRender);
});
