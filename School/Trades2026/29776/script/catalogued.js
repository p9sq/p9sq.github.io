// Catalogued systems page.

var PC_TO_LY = 3.26156; // 1 parsec equals 3.26156 light years

function pcToLy(pc) {
  if (pc == null) return null;
  return Math.round(pc * PC_TO_LY * 100) / 100;
}

function fmtDist(pc) {
  if (pc == null) return "—";
  var ly = pcToLy(pc);
  return ly.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " ly";
}

// Colours for each spectral class. Match real star colours.
function spectralColor(sc) {
  const map = {
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
  };
  if (!sc) {
    return "#7a92b8";
  }
  var c = sc[0].toUpperCase();
  if (map[c]) {
    return map[c];
  }
  return "#7a92b8";
}

function isRogue(sys) {
  if (sys.spectralClass && sys.spectralClass[0].toUpperCase() == "P") {
    return true;
  }
  return false;
}

function lifeBadge(exists) {
  if (exists === true) {
    return '<span class="badge badge-life">● CONFIRMED</span>';
  } else if (exists === "pending") {
    return '<span class="badge badge-pending">◌ PENDING</span>';
  } else {
    return '<span class="badge badge-nolife">✕ NONE</span>';
  }
}

function lifeStatusText(exists) {
  if (exists === true) return '<span style="color:var(--green)">CONFIRMED</span>';
  if (exists === "pending") return '<span style="color:var(--yellow)">PENDING REVIEW</span>';
  return '<span style="color:#f87171">NOT DETECTED</span>';
}

function renderTable(data) {
  var tbody = document.getElementById("catalogueBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="11" style="text-align:center;padding:3rem;color:var(--text-dimmer);font-family:var(--font-mono);font-size:0.75rem;">NO MATCHING RECORDS</td></tr>';
    document.getElementById("resultsCount").textContent = "0 systems";
    return;
  }

  document.getElementById("resultsCount").textContent =
    data.length + " system" + (data.length !== 1 ? "s" : "");

  for (var i = 0; i < data.length; i++) {
    var name = data[i][0];
    var sys = data[i][1];
    var rogue = isRogue(sys);

    var moonCell;
    if (rogue) {
      if (sys.moonCount) {
        moonCell = sys.moonCount.major + " maj / " + sys.moonCount.dwarf + " dwf";
      } else {
        moonCell = "—";
      }
    } else {
      moonCell = '<span style="color:var(--text-dimmer);font-size:0.65rem">N/A</span>';
    }

    var thumbHtml;
    if (sys.thumbnail) {
      thumbHtml =
        '<img class="td-thumb" src="' +
        sys.thumbnail +
        '" alt="' +
        name +
        '" onerror="this.style.display=\'none\'">';
    } else {
      thumbHtml = '<div class="td-thumb-placeholder">⬡</div>';
    }

    var tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${thumbHtml}</td>
      <td class="td-desig">${sys.designation || "—"}</td>
      <td class="td-name">${name}</td>
      <td>${sys.systemType || "—"}</td>
      <td style="color:${spectralColor(sys.spectralClass)};font-family:var(--font-mono)">${sys.spectralClass || "—"}</td>
      <td>${fmtDist(sys.distToSun)}</td>
      <td>${sys.planetCount ? sys.planetCount.major + " maj / " + sys.planetCount.dwarf + " dwf" : "—"}</td>
      <td>${moonCell}</td>
      <td style="font-size:0.65rem">${sys.discDate ? sys.discDate.split(" ")[0] : "—"}</td>
      <td style="color:var(--accent-bright)">${sys.pioneer || "—"}</td>
      <td>${lifeBadge(sys.life ? sys.life.exists : undefined)}</td>
    `;
    tr.addEventListener("click", function (n, s) {
      return function () {
        openModal(n, s);
      };
    }(name, sys));
    tbody.appendChild(tr);
  }
}

function openModal(name, sys) {
  var modal = document.getElementById("modal");
  var content = document.getElementById("modalContent");
  var rogue = isRogue(sys);

  var moonFields = "";
  if (rogue) {
    moonFields = `
    <div class="modal-field"><div class="modal-field-label">Major Moons</div><div class="modal-field-val">${sys.moonCount ? sys.moonCount.major : "—"}</div></div>
    <div class="modal-field"><div class="modal-field-label">Dwarf Moons</div><div class="modal-field-val">${sys.moonCount ? sys.moonCount.dwarf : "—"}</div></div>
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
      <div class="modal-field"><div class="modal-field-label">Spectral Class</div><div class="modal-field-val" style="color:${spectralColor(sys.spectralClass)}">${sys.spectralClass || "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">Distance from Phebe</div><div class="modal-field-val">${fmtDist(sys.distToSun)}</div></div>
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
}

function applySort(entries, sortVal) {
  var sorted = entries.slice(); // Copy the array first so the original list stays untouched.

  if (sortVal == "dist-asc") {
    sorted.sort(function (a, b) {
      var da = a[1].distToSun == null ? Infinity : a[1].distToSun;
      var db = b[1].distToSun == null ? Infinity : b[1].distToSun;
      return da - db;
    });
  } else if (sortVal == "dist-desc") {
    sorted.sort(function (a, b) {
      var da = a[1].distToSun == null ? -Infinity : a[1].distToSun;
      var db = b[1].distToSun == null ? -Infinity : b[1].distToSun;
      return db - da;
    });
  } else if (sortVal == "alpha-asc") {
    sorted.sort(function (a, b) {
      return a[0].localeCompare(b[0]);
    });
  } else if (sortVal == "alpha-desc") {
    sorted.sort(function (a, b) {
      return b[0].localeCompare(a[0]);
    });
  }

  return sorted;
}

function filterAndRender() {
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

    var matchType = !typeFilter || sys.systemType === typeFilter;

    var lifeVal = sys.life ? sys.life.exists : undefined;
    var matchLife = !lifeFilter || String(lifeVal) === lifeFilter;

    return matchText && matchType && matchLife;
  });

  entries = applySort(entries, sortVal);
  renderTable(entries);
}

window.addEventListener("DOMContentLoaded", () => {
  filterAndRender();

  document.getElementById("searchBox").addEventListener("input", filterAndRender);
  document.getElementById("filterType").addEventListener("change", filterAndRender);
  document.getElementById("filterLife").addEventListener("change", filterAndRender);
  document.getElementById("sortSelect").addEventListener("change", filterAndRender);

  document.getElementById("modalClose").addEventListener("click", function () {
    document.getElementById("modal").classList.remove("open");
  });
  document.getElementById("modal").addEventListener("click", function (e) {
    if (e.target === document.getElementById("modal")) {
      document.getElementById("modal").classList.remove("open");
    }
  });
});
