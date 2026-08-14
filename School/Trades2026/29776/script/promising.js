// this page shows the arventia 2.0 candidates as cards

const SPECTRAL_COLORS = {
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
  const c = sc[0].toUpperCase();
  if (c === "P") return "Rogue object/Free floating";
  if (c === "X") return "Black hole";
  return sc;
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

// density relative to earth, not exact but close enough for the catalogue
function getDensity(world) {
  if (!world.physical) return null;
  const { radius: r, mass: m } = world.physical;
  if (r == null || m == null) return null;
  const rEarths = r / 6378.14;
  const density = 5.5136 * (m / Math.pow(rEarths, 3));
  return Math.round(density * 1000) / 1000;
}

function makeCard(name, world) {
  const density = getDensity(world);
  const mass = world.physical ? world.physical.mass : null;
  const radius = world.physical ? world.physical.radius : null;
  const sma = world.orbit ? world.orbit.sma : null;

  const imgHtml = world.thumbnail
    ? `<img class="planet-card-img" src="${world.thumbnail}" alt="${name}" onerror="this.style.display='none'">`
    : '<div class="planet-card-img-placeholder">🌍</div>';

  let altNameHtml = "";
  if (world.type === "Moon" && world.altName) {
    altNameHtml = ` <span style="color:var(--text-dimmer);font-size:0.75em;font-weight:400">/ ${world.altName}</span>`;
  }

  const moonOfHtml =
    world.type === "Moon" && world.parent ? " · Moon of " + world.parent : "";

  const div = document.createElement("div");
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
        <div class="planet-card-row"><span class="planet-card-row-label">Density</span><span class="planet-card-row-val">${fmtDensity(density)}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">SMA</span><span class="planet-card-row-val">${fmtSma(sma)}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Moons</span><span class="planet-card-row-val">${world.moonCount != null ? world.moonCount : "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Star</span><span class="planet-card-row-val" style="color:${spectralColor(world.spectralClass)}">${world.parentStar || "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Distance</span><span class="planet-card-row-val">${fmtDist(world.distToSun)}</span></div>
      </div>
      <div class="planet-card-badges">
        ${lifeBadge(world.life ? world.life.exists : undefined)}
      </div>
    </div>
  `;
  div.addEventListener("click", () => openModal(name, world));
  return div;
}

function openModal(name, world) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  const density = getDensity(world);
  const mass = world.physical ? world.physical.mass : null;
  const radius = world.physical ? world.physical.radius : null;
  const sma = world.orbit ? world.orbit.sma : null;
  const period = world.orbit ? world.orbit.period : null;
  const ecc = world.orbit ? world.orbit.eccentricity : null;
  const lifeExists = world.life ? world.life.exists : undefined;

  const altNameHtml =
    world.type === "Moon" && world.altName
      ? `<span class="modal-altname"> / ${world.altName}</span>`
      : "";

  let lifeExtra = "";
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
      <div class="modal-field"><div class="modal-field-label">Density</div><div class="modal-field-val">${fmtDensity(density)}</div></div>
      <div class="modal-field"><div class="modal-field-label">Moon Count</div><div class="modal-field-val">${world.moonCount != null ? world.moonCount : "—"}</div></div>
    </div>

    <div class="modal-section-title">ORBITAL DATA</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Semi-Major Axis</div><div class="modal-field-val">${fmtSma(sma)}</div></div>
      <div class="modal-field"><div class="modal-field-label">Orbital Period</div><div class="modal-field-val">${fmtPeriod(period)}</div></div>
      <div class="modal-field"><div class="modal-field-label">Eccentricity</div><div class="modal-field-val">${ecc != null ? ecc : "—"}</div></div>
      <div class="modal-field"><div class="modal-field-label">System Type</div><div class="modal-field-val">${world.systemType || "—"}</div></div>
    </div>

    <div class="modal-section-title">STELLAR CONTEXT</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">System</div><div class="modal-field-val">${world.systemName}</div></div>
      <div class="modal-field"><div class="modal-field-label">Parent Star</div><div class="modal-field-val">${world.parentStar}</div></div>
      ${world.type === "Moon" && world.parent ? `<div class="modal-field"><div class="modal-field-label">Parent Planet</div><div class="modal-field-val">${world.parent}</div></div>` : ""}
      <div class="modal-field"><div class="modal-field-label">Spectral Class</div><div class="modal-field-val" style="color:${spectralColor(world.spectralClass)}">${spectralLabel(world.spectralClass)}</div></div>
      <div class="modal-field"><div class="modal-field-label">Distance from Phebe</div><div class="modal-field-val">${fmtDist(world.distToSun)}</div></div>
    </div>

    <div class="modal-section-title">LIFE ASSESSMENT</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Life Status</div><div class="modal-field-val">${lifeStatusText(lifeExists)}</div></div>
      ${lifeExtra}
    </div>
  `;

  modal.classList.add("open");
  document.body.classList.add("no-scroll");
}

function num(v, fallbackForAsc) {
  if (v == null) return fallbackForAsc ? Infinity : -Infinity;
  return v;
}

function applySort(entries, sortVal) {
  const sorted = [...entries];

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
      sorted.sort(
        (a, b) =>
          num(a[1].physical?.radius, true) - num(b[1].physical?.radius, true),
      );
      break;
    case "radius-desc":
      sorted.sort(
        (a, b) =>
          num(b[1].physical?.radius, false) - num(a[1].physical?.radius, false),
      );
      break;
    case "mass-asc":
      sorted.sort(
        (a, b) =>
          num(a[1].physical?.mass, true) - num(b[1].physical?.mass, true),
      );
      break;
    case "mass-desc":
      sorted.sort(
        (a, b) =>
          num(b[1].physical?.mass, false) - num(a[1].physical?.mass, false),
      );
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
  const query = document.getElementById("searchBox").value.toLowerCase();
  const typeFilter = document.getElementById("filterType").value;
  const lifeFilter = document.getElementById("filterLife").value;
  const sortVal = document.getElementById("sortSelect").value;

  const grid = document.getElementById("promisingGrid");
  grid.innerHTML = "";

  let entries = Object.entries(PROMISING_WORLDS);
  entries = entries.filter(([name, world]) => {
    const matchText =
      !query ||
      name.toLowerCase().includes(query) ||
      (world.systemName || "").toLowerCase().includes(query) ||
      ((world.life && world.life.type) || "").toLowerCase().includes(query);

    const matchType = !typeFilter || world.type === typeFilter;

    const lifeVal = world.life ? world.life.exists : undefined;
    const matchLife = !lifeFilter || String(lifeVal) === lifeFilter;

    return matchText && matchType && matchLife;
  });

  entries = applySort(entries, sortVal);

  document.getElementById("resultsCount").textContent =
    entries.length + " candidate" + (entries.length !== 1 ? "s" : "");

  if (entries.length === 0) {
    grid.innerHTML = '<div class="empty-state">NO MATCHING CANDIDATES</div>';
    return;
  }

  for (const [name, world] of entries) {
    grid.appendChild(makeCard(name, world));
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

  const modal = document.getElementById("modal");
  document.getElementById("modalClose").addEventListener("click", () => {
    modal.classList.remove("open");
    document.body.classList.remove("no-scroll");
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("open");
      document.body.classList.remove("no-scroll");
    }
  });

  // ly/pc and metric/imperial live in localStorage, re-render on change
  document.addEventListener("settingschange", filterAndRender);
});
