// Catalogued systems page

const PC_TO_LY = 3.26156;

function fmtDist(pc) {
  if (pc == null) return "—";
  const ly = pc * PC_TO_LY;
  return ly.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " ly";
}

// rough colour per spectral class, matches real star colours
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

// rogue systems use spectral class "P" (no parent star)
function isRogue(sys) {
  return sys.spectralClass && sys.spectralClass[0].toUpperCase() === "P";
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
  const tbody = document.getElementById("catalogueBody");
  tbody.innerHTML = "";

  const countEl = document.getElementById("resultsCount");

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="11" style="text-align:center;padding:3rem;color:var(--text-dimmer);font-family:var(--font-mono);font-size:0.75rem;">NO MATCHING RECORDS</td></tr>';
    countEl.textContent = "0 systems";
    return;
  }

  countEl.textContent =
    data.length + " system" + (data.length !== 1 ? "s" : "");

  for (const [name, sys] of data) {
    const rogue = isRogue(sys);

    let moonCell =
      '<span style="color:var(--text-dimmer);font-size:0.65rem">N/A</span>';
    if (rogue) {
      moonCell = sys.moonCount
        ? sys.moonCount.major + " maj / " + sys.moonCount.dwarf + " dwf"
        : "—";
    }

    const thumbHtml = sys.thumbnail
      ? `<img class="td-thumb" src="${sys.thumbnail}" alt="${name}" onerror="this.style.display='none'">`
      : '<div class="td-thumb-placeholder">⬡</div>';

    const tr = document.createElement("tr");
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
    tr.addEventListener("click", () => openModal(name, sys));
    tbody.appendChild(tr);
  }
}

function openModal(name, sys) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  const rogue = isRogue(sys);

  let moonFields = "";
  if (rogue) {
    moonFields = `
    <div class="modal-field"><div class="modal-field-label">Major Moons</div><div class="modal-field-val">${sys.moonCount ? sys.moonCount.major : "—"}</div></div>
    <div class="modal-field"><div class="modal-field-label">Dwarf Moons</div><div class="modal-field-val">${sys.moonCount ? sys.moonCount.dwarf : "—"}</div></div>
  `;
  }

  const lifeExists = sys.life ? sys.life.exists : undefined;

  let lifeExtra = "";
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
  const sorted = [...entries];

  if (sortVal === "dist-asc") {
    sorted.sort(
      (a, b) => (a[1].distToSun ?? Infinity) - (b[1].distToSun ?? Infinity),
    );
  } else if (sortVal === "dist-desc") {
    sorted.sort(
      (a, b) => (b[1].distToSun ?? -Infinity) - (a[1].distToSun ?? -Infinity),
    );
  } else if (sortVal === "alpha-asc") {
    sorted.sort((a, b) => a[0].localeCompare(b[0]));
  } else if (sortVal === "alpha-desc") {
    sorted.sort((a, b) => b[0].localeCompare(a[0]));
  }

  return sorted;
}

function filterAndRender() {
  const query = document.getElementById("searchBox").value.toLowerCase();
  const typeFilter = document.getElementById("filterType").value;
  const lifeFilter = document.getElementById("filterLife").value;
  const sortVal = document.getElementById("sortSelect").value;

  let entries = Object.entries(CATALOGUED_SYSTEMS);

  entries = entries.filter(([name, sys]) => {
    const matchText =
      !query ||
      name.toLowerCase().includes(query) ||
      (sys.designation || "").toLowerCase().includes(query) ||
      (sys.pioneer || "").toLowerCase().includes(query) ||
      (sys.spectralClass || "").toLowerCase().includes(query);

    const matchType = !typeFilter || sys.systemType === typeFilter;

    const lifeVal = sys.life ? sys.life.exists : undefined;
    const matchLife = !lifeFilter || String(lifeVal) === lifeFilter;

    return matchText && matchType && matchLife;
  });

  renderTable(applySort(entries, sortVal));
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
  document
    .getElementById("modalClose")
    .addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
});
