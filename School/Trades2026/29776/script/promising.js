// Promising worlds page, the Arventia 2.0 candidates.

var PC_TO_LY = 3.26156; // 1 parsec in light years
var EARTH_RADIUS_KM = 6371;

function pcToLy(pc) {
  if (pc == null) return null;
  return Math.round(pc * PC_TO_LY * 100) / 100;
}

function fmtDist(pc) {
  if (pc == null) return "—";
  if (pc === 0) return "< 0.01 ly";
  var ly = pcToLy(pc);
  return ly.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " ly";
}

function fmtRadius(radiusKm) {
  if (radiusKm == null) return "—";
  var re = (radiusKm / EARTH_RADIUS_KM).toFixed(3);
  return re + " R⊕";
}

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
  if (!sc) return "#7a92b8";
  var c = sc[0].toUpperCase();
  return map[c] || "#7a92b8";
}

function lifeBadge(exists) {
  if (exists === true)
    return '<span class="badge badge-life">● LIFE CONFIRMED</span>';
  if (exists === "pending")
    return '<span class="badge badge-pending">◌ LIFE PENDING</span>';
  return '<span class="badge badge-nolife">✕ NO LIFE</span>';
}

function lifeStatusText(exists) {
  if (exists === true)
    return '<span style="color:var(--green)">CONFIRMED</span>';
  if (exists === "pending")
    return '<span style="color:var(--yellow)">PENDING REVIEW</span>';
  return '<span style="color:#f87171">NOT DETECTED</span>';
}

// Estimate density using Earth as the baseline. Not exact, but close enough.
function calculateDensity(radiusKm, massEarths) {
  var radiusEarths = radiusKm / 6378.14;
  var EARTH_DENSITY = 5.5136;
  var density = EARTH_DENSITY * (massEarths / Math.pow(radiusEarths, 3));
  return density.toFixed(3);
}

function getDensity(world) {
  if (!world.physical) return null;
  var r = world.physical.radius;
  var m = world.physical.mass;
  if (r != null && m != null) {
    return parseFloat(calculateDensity(r, m));
  }
  return null;
}

function makeCard(name, world) {
  var density = getDensity(world);
  var mass = world.physical ? world.physical.mass : null;
  var radius = world.physical ? world.physical.radius : null;
  var sma = world.orbit ? world.orbit.sma : null;

  var imgHtml;
  if (world.thumbnail) {
    imgHtml =
      '<img class="planet-card-img" src="' +
      world.thumbnail +
      '" alt="' +
      name +
      '" onerror="this.style.display=\'none\'">';
  } else {
    imgHtml = '<div class="planet-card-img-placeholder">🌍</div>';
  }

  var altNameHtml = "";
  if (world.type === "Moon" && world.altName) {
    altNameHtml =
      ' <span style="color:var(--text-dimmer);font-size:0.75em;font-weight:400">/ ' +
      world.altName +
      "</span>";
  }

  var moonOfHtml = "";
  if (world.type === "Moon" && world.parent) {
    moonOfHtml = " · Moon of " + world.parent;
  }

  var div = document.createElement("div");
  div.className = "planet-card";
  div.innerHTML = `
    ${imgHtml}
    <div class="planet-card-body">
      <div class="planet-card-name">${name}${altNameHtml}</div>
      <div class="planet-card-system">${world.systemName} · ${world.parentStar}${moonOfHtml}</div>
      <div class="planet-card-meta">
        <div class="planet-card-row"><span class="planet-card-row-label">Type</span><span class="planet-card-row-val">${world.type || "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Mass</span><span class="planet-card-row-val">${mass != null ? mass + " M⊕" : "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Radius</span><span class="planet-card-row-val">${fmtRadius(radius)}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Density</span><span class="planet-card-row-val">${density != null ? density + " g/cm³" : "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">SMA</span><span class="planet-card-row-val">${sma != null ? sma + " AU" : "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Moons</span><span class="planet-card-row-val">${world.moonCount != null ? world.moonCount : "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Star</span><span class="planet-card-row-val" style="color:${spectralColor(world.spectralClass)}">${world.spectralClass || "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Distance</span><span class="planet-card-row-val">${fmtDist(world.distToSun)}</span></div>
      </div>
      <div class="planet-card-badges">
        ${lifeBadge(world.life ? world.life.exists : undefined)}
      </div>
    </div>
  `;
  div.addEventListener("click", function () {
    openModal(name, world);
  });
  return div;
}

function openModal(name, world) {
  var modal = document.getElementById("modal");
  var content = document.getElementById("modalContent");
  var density = getDensity(world);
  var mass = world.physical ? world.physical.mass : null;
  var radius = world.physical ? world.physical.radius : null;
  var sma = world.orbit ? world.orbit.sma : null;
  var period = world.orbit ? world.orbit.period : null;
  var ecc = world.orbit ? world.orbit.eccentricity : null;
  var lifeExists = world.life ? world.life.exists : undefined;

  var altNameHtml = "";
  if (world.type === "Moon" && world.altName) {
    altNameHtml = '<span class="modal-altname"> / ' + world.altName + "</span>";
  }

  var lifeExtra = "";
  if (lifeExists === true) {
    lifeExtra = `
        <div class="modal-field"><div class="modal-field-label">Life Type</div><div class="modal-field-val">${world.life.type || "—"}</div></div>
        <div class="modal-field"><div class="modal-field-label">Biome</div><div class="modal-field-val">${world.life.biome || "—"}</div></div>
        <div class="modal-field"><div class="modal-field-label">Life Origin</div><div class="modal-field-val">${world.life.origin || "—"}</div></div>
      `;
  }

  content.innerHTML = `
    ${world.thumbnail ? `<img class="modal-thumb" src="${world.thumbnail}" alt="${name}" onerror="this.remove()">` : ""}
    <div class="modal-title">${name}${altNameHtml}</div>
    <div class="modal-sub">${world.type}${world.type === "Moon" && world.parent ? " of " + world.parent : ""} · ${world.systemName}</div>

    <div class="modal-section-title">PHYSICAL DATA</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Object Type</div><div class="modal-field-val">${world.type || "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">Mass</div><div class="modal-field-val">${mass != null ? mass + " M⊕" : "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">Radius</div><div class="modal-field-val">${fmtRadius(radius)}</div></div>
      <div class="modal-field"><div class="modal-field-label">Density</div><div class="modal-field-val">${density != null ? density + " g/cm³" : "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">Moon Count</div><div class="modal-field-val">${world.moonCount != null ? world.moonCount : "—"}</div></div>
    </div>

    <div class="modal-section-title">ORBITAL DATA</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Semi-Major Axis</div><div class="modal-field-val">${sma != null ? sma + " AU" : "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">Orbital Period</div><div class="modal-field-val">${period != null ? period + " yr" : "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">Eccentricity</div><div class="modal-field-val">${ecc != null ? ecc : "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">System Type</div><div class="modal-field-val">${world.systemType || "—"}</div></div>
    </div>

    <div class="modal-section-title">STELLAR CONTEXT</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">System</div><div class="modal-field-val">${world.systemName}</div></div>
      <div class="modal-field"><div class="modal-field-label">Parent Star</div><div class="modal-field-val">${world.parentStar}</div></div>
      ${world.type === "Moon" && world.parent ? `<div class="modal-field"><div class="modal-field-label">Parent Planet</div><div class="modal-field-val">${world.parent}</div></div>` : ""}
      <div class="modal-field"><div class="modal-field-label">Spectral Class</div><div class="modal-field-val" style="color:${spectralColor(world.spectralClass)}">${world.spectralClass || "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">Distance from Phebe</div><div class="modal-field-val">${fmtDist(world.distToSun)}</div></div>
    </div>

    <div class="modal-section-title">LIFE ASSESSMENT</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Life Status</div><div class="modal-field-val">${lifeStatusText(lifeExists)}</div></div>
      ${lifeExtra}
    </div>
  `;

  modal.classList.add("open");
}

function applySort(entries, sortVal) {
  var sorted = entries.slice();

  function num(v, fallbackForAsc) {
    if (v == null) return fallbackForAsc ? Infinity : -Infinity;
    return v;
  }

  switch (sortVal) {
    case "dist-asc":
      sorted.sort(
        (a, b) => num(a[1].distToSun, true) - num(b[1].distToSun, true),
      );
      break;
    case "dist-desc":
      sorted.sort(
        (a, b) => num(b[1].distToSun, false) - num(a[1].distToSun, false),
      );
      break;
    case "radius-asc":
      sorted.sort((a, b) => {
        var ra = a[1].physical ? a[1].physical.radius : null;
        var rb = b[1].physical ? b[1].physical.radius : null;
        return num(ra, true) - num(rb, true);
      });
      break;
    case "radius-desc":
      sorted.sort((a, b) => {
        var ra = a[1].physical ? a[1].physical.radius : null;
        var rb = b[1].physical ? b[1].physical.radius : null;
        return num(rb, false) - num(ra, false);
      });
      break;
    case "mass-asc":
      sorted.sort((a, b) => {
        var ma = a[1].physical ? a[1].physical.mass : null;
        var mb = b[1].physical ? b[1].physical.mass : null;
        return num(ma, true) - num(mb, true);
      });
      break;
    case "mass-desc":
      sorted.sort((a, b) => {
        var ma = a[1].physical ? a[1].physical.mass : null;
        var mb = b[1].physical ? b[1].physical.mass : null;
        return num(mb, false) - num(ma, false);
      });
      break;
    case "density-asc":
      sorted.sort(
        (a, b) => num(getDensity(a[1]), true) - num(getDensity(b[1]), true),
      );
      break;
    case "density-desc":
      sorted.sort(
        (a, b) => num(getDensity(b[1]), false) - num(getDensity(a[1]), false),
      );
      break;
    case "alpha-asc":
      sorted.sort((a, b) => a[0].localeCompare(b[0]));
      break;
    case "alpha-desc":
      sorted.sort((a, b) => b[0].localeCompare(a[0]));
      break;
  }
  return sorted;
}

function filterAndRender() {
  var query = document.getElementById("searchBox").value.toLowerCase();
  var typeFilter = document.getElementById("filterType").value;
  var lifeFilter = document.getElementById("filterLife").value;
  var sortVal = document.getElementById("sortSelect").value;

  var grid = document.getElementById("promisingGrid");
  grid.innerHTML = "";

  var entries = Object.entries(PROMISING_WORLDS);
  entries = entries.filter(function (entry) {
    var name = entry[0];
    var world = entry[1];

    var matchText =
      !query ||
      name.toLowerCase().indexOf(query) !== -1 ||
      (world.systemName || "").toLowerCase().indexOf(query) !== -1 ||
      ((world.life && world.life.type) || "").toLowerCase().indexOf(query) !==
        -1;

    var matchType = !typeFilter || world.type === typeFilter;

    var lifeVal = world.life ? world.life.exists : undefined;
    var matchLife = !lifeFilter || String(lifeVal) === lifeFilter;

    return matchText && matchType && matchLife;
  });

  entries = applySort(entries, sortVal);

  document.getElementById("resultsCount").textContent =
    entries.length + " candidate" + (entries.length !== 1 ? "s" : "");

  if (entries.length === 0) {
    grid.innerHTML = '<div class="empty-state">NO MATCHING CANDIDATES</div>';
    return;
  }

  for (var i = 0; i < entries.length; i++) {
    grid.appendChild(makeCard(entries[i][0], entries[i][1]));
  }
}

window.addEventListener("DOMContentLoaded", () => {
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

  document.getElementById("modalClose").addEventListener("click", function () {
    document.getElementById("modal").classList.remove("open");
  });
  document.getElementById("modal").addEventListener("click", function (e) {
    if (e.target === document.getElementById("modal")) {
      document.getElementById("modal").classList.remove("open");
    }
  });
});
