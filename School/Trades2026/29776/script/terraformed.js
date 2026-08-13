// Terraformed worlds page

const PC_TO_LY = 3.26156;
const EARTH_RADIUS_KM = 6371;

function fmtDist(pc) {
  if (pc == null) return "—";
  if (pc === 0) return "< 0.01 ly";
  const ly = pc * PC_TO_LY;
  return ly.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " ly";
}

function fmtRadius(radiusKm) {
  if (radiusKm == null) return "—";
  return (radiusKm / EARTH_RADIUS_KM).toFixed(3) + " R⊕";
}

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
};

function spectralColor(sc) {
  if (!sc) return "#7a92b8";
  return SPECTRAL_COLORS[sc[0].toUpperCase()] || "#7a92b8";
}

function lifeBadge(exists) {
  if (exists === true) return '<span class="badge badge-life">● LIFE</span>';
  if (exists === "pending")
    return '<span class="badge badge-pending">◌ PENDING</span>';
  return "";
}

function lifeStatusText(exists) {
  if (exists === true)
    return '<span style="color:var(--green)">CONFIRMED</span>';
  if (exists === "pending")
    return '<span style="color:var(--yellow)">PENDING REVIEW</span>';
  return '<span style="color:#f87171">ABSENT</span>';
}

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
    : '<div class="planet-card-img-placeholder">🌱</div>';

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
        <div class="planet-card-row"><span class="planet-card-row-label">Density</span><span class="planet-card-row-val">${density != null ? density + " g/cm³" : "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">SMA</span><span class="planet-card-row-val">${sma != null ? sma + " AU" : "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Moons</span><span class="planet-card-row-val">${world.moonCount != null ? world.moonCount : "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Star</span><span class="planet-card-row-val" style="color:${spectralColor(world.spectralClass)}">${world.spectralClass || "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Biome</span><span class="planet-card-row-val">${(world.life && world.life.biome) || "—"}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Life Origin</span><span class="planet-card-row-val" style="color:var(--orange)">${(world.life && world.life.origin) || "—"}</span></div>
      </div>
      <div class="planet-card-badges">
        <span class="badge" style="background:var(--orange-dim);color:var(--orange);border:1px solid rgba(249,115,22,0.25)">🌱 TERRAFORMED</span>
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
        <div class="modal-field"><div class="modal-field-label">Life Origin</div><div class="modal-field-val" style="color:var(--orange)">${world.life.origin || "—"}</div></div>
      `;
  }

  content.innerHTML = `
    ${world.thumbnail ? `<img class="modal-thumb" src="${world.thumbnail}" alt="${name}" onerror="this.remove()">` : ""}
    <div class="modal-title">${name}${altNameHtml}</div>
    <div class="modal-sub">${world.type}${world.type === "Moon" && world.parent ? " of " + world.parent : ""} · ${world.systemName} · <span style="color:var(--orange)">TERRAFORMED</span></div>

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

    <div class="modal-section-title">BIOSPHERE DATA</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Life Status</div><div class="modal-field-val">${lifeStatusText(lifeExists)}</div></div>
      ${lifeExtra}
    </div>
  `;

  modal.classList.add("open");
}

function populateOriginFilter() {
  const sel = document.getElementById("filterOrigin");
  const origins = [];
  for (const key in TERRAFORMED_WORLDS) {
    const world = TERRAFORMED_WORLDS[key];
    if (
      world.life &&
      world.life.origin &&
      !origins.includes(world.life.origin)
    ) {
      origins.push(world.life.origin);
    }
  }
  origins.sort();
  for (const origin of origins) {
    const opt = document.createElement("option");
    opt.value = origin;
    opt.textContent = origin;
    sel.appendChild(opt);
  }
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
  const originFilter = document.getElementById("filterOrigin").value;
  const sortVal = document.getElementById("sortSelect").value;

  const grid = document.getElementById("terraformedGrid");
  grid.innerHTML = "";

  let entries = Object.entries(TERRAFORMED_WORLDS);
  entries = entries.filter(([name, world]) => {
    const matchText =
      !query ||
      name.toLowerCase().includes(query) ||
      (world.systemName || "").toLowerCase().includes(query) ||
      ((world.life && world.life.biome) || "").toLowerCase().includes(query);

    const matchType = !typeFilter || world.type === typeFilter;
    const matchOrigin =
      !originFilter || (world.life && world.life.origin) === originFilter;

    return matchText && matchType && matchOrigin;
  });

  entries = applySort(entries, sortVal);

  document.getElementById("resultsCount").textContent =
    entries.length + " world" + (entries.length !== 1 ? "s" : "");

  if (entries.length === 0) {
    grid.innerHTML = '<div class="empty-state">NO MATCHING RECORDS</div>';
    return;
  }

  for (const [name, world] of entries) {
    grid.appendChild(makeCard(name, world));
  }
}

window.addEventListener("DOMContentLoaded", () => {
  populateOriginFilter();
  filterAndRender();

  document
    .getElementById("searchBox")
    .addEventListener("input", filterAndRender);
  document
    .getElementById("filterType")
    .addEventListener("change", filterAndRender);
  document
    .getElementById("filterOrigin")
    .addEventListener("change", filterAndRender);
  document
    .getElementById("sortSelect")
    .addEventListener("change", filterAndRender);

  const modal = document.getElementById("modal");
  document
    .getElementById("modalClose")
    .addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
});
