// Terraformed worlds page
// 1 parsec = 3.26156 light-years
const PC_TO_LY = 3.26156;

function pcToLy(pc) {
  if (pc == null) return null;
  return Math.round(pc * PC_TO_LY * 100) / 100;
}

function fmtDist(pc) {
  if (pc == null) return '—';
  if (pc === 0) return '< 0.01 ly';
  const ly = pcToLy(pc);
  return ly.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' ly';
}

function spectralColor(sc) {
  if (!sc) return '#7a92b8';
  const c = sc[0].toUpperCase();
  const map = { O:'#b0d4ff', B:'#cce0ff', A:'#e8f0ff', F:'#fffde0', G:'#ffe87a', K:'#ffaa44', M:'#ff6633', L:'#cc3300', T:'#661100', Y:'#330000', P:'#a070ff', D:'#88aacc' };
  return map[c] || '#7a92b8';
}

function calculateDensity(radiusKm, massEarths) {
  const radiusEarths = radiusKm / 6378.14;
  const EARTH_DENSITY = 5.5136;
  const density = EARTH_DENSITY * (massEarths / Math.pow(radiusEarths, 3));
  return density.toFixed(3);
}

function lifeBadge(exists) {
  if (exists === true)      return `<span class="badge badge-life">● LIFE</span>`;
  if (exists === 'pending') return `<span class="badge badge-pending">◌ PENDING</span>`;
  return '';
}

function lifeStatusText(exists) {
  if (exists === true)      return '<span style="color:var(--green)">CONFIRMED</span>';
  if (exists === 'pending') return '<span style="color:var(--yellow)">PENDING REVIEW</span>';
  return '<span style="color:#f87171">ABSENT</span>';
}

function getDensity(world) {
  if (world.radius != null && world.mass != null) {
    return parseFloat(calculateDensity(world.radius, world.mass));
  }
  return null;
}

function makeCard(name, world) {
  const density = getDensity(world);
  const div = document.createElement('div');
  div.className = 'planet-card';
  div.innerHTML = `
    ${world.thumbnail
      ? `<img class="planet-card-img" src="${world.thumbnail}" alt="${name}" onerror="this.style.display='none'">`
      : `<div class="planet-card-img-placeholder">🌱</div>`}
    <div class="planet-card-body">
      <div class="planet-card-name">${name}</div>
      <div class="planet-card-system">${world.systemName} · ${world.parentStar}</div>
      <div class="planet-card-meta">
        <div class="planet-card-row"><span class="planet-card-row-label">Type</span><span class="planet-card-row-val">${world.type || '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Mass</span><span class="planet-card-row-val">${world.mass != null ? world.mass + ' M⊕' : '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Radius</span><span class="planet-card-row-val">${world.radius != null ? world.radius.toLocaleString() + ' km' : '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Density</span><span class="planet-card-row-val">${density != null ? density + ' g/cm³' : '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">SMA</span><span class="planet-card-row-val">${world.sma != null ? world.sma + ' AU' : '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Moons</span><span class="planet-card-row-val">${world.moonCount ?? '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Star</span><span class="planet-card-row-val" style="color:${spectralColor(world.spectralClass)}">${world.spectralClass}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Biome</span><span class="planet-card-row-val">${world.life?.biome || '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Life Origin</span><span class="planet-card-row-val" style="color:var(--orange)">${world.life?.origin || '—'}</span></div>
      </div>
      <div class="planet-card-badges">
        <span class="badge" style="background:var(--orange-dim);color:var(--orange);border:1px solid rgba(249,115,22,0.25)">🌱 TERRAFORMED</span>
        ${lifeBadge(world.life?.exists)}
      </div>
    </div>
  `;
  div.addEventListener('click', () => openModal(name, world));
  return div;
}

function openModal(name, world) {
  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');
  const density = getDensity(world);

  content.innerHTML = `
    ${world.thumbnail ? `<img class="modal-thumb" src="${world.thumbnail}" alt="${name}" onerror="this.remove()">` : ''}
    <div class="modal-title">${name}</div>
    <div class="modal-sub">${world.type} · ${world.systemName} · <span style="color:var(--orange)">TERRAFORMED</span></div>
    <div class="modal-section-title">PHYSICAL DATA</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Object Type</div><div class="modal-field-val">${world.type || '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Semi-Major Axis</div><div class="modal-field-val">${world.sma != null ? world.sma + ' AU' : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Mass</div><div class="modal-field-val">${world.mass != null ? world.mass + ' M⊕' : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Radius</div><div class="modal-field-val">${world.radius != null ? world.radius.toLocaleString() + ' km' : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Density</div><div class="modal-field-val">${density != null ? density + ' g/cm³' : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Moon Count</div><div class="modal-field-val">${world.moonCount ?? '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">System Type</div><div class="modal-field-val">${world.systemType || '—'}</div></div>
    </div>
    <div class="modal-section-title">STELLAR CONTEXT</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">System</div><div class="modal-field-val">${world.systemName}</div></div>
      <div class="modal-field"><div class="modal-field-label">Parent Star</div><div class="modal-field-val">${world.parentStar}</div></div>
      <div class="modal-field"><div class="modal-field-label">Spectral Class</div><div class="modal-field-val" style="color:${spectralColor(world.spectralClass)}">${world.spectralClass}</div></div>
      <div class="modal-field"><div class="modal-field-label">Distance from Phebe</div><div class="modal-field-val">${fmtDist(world.distToSun)}</div></div>
    </div>
    <div class="modal-section-title">BIOSPHERE DATA</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Life Status</div><div class="modal-field-val">${lifeStatusText(world.life?.exists)}</div></div>
      ${world.life?.exists === true ? `
        <div class="modal-field"><div class="modal-field-label">Life Type</div><div class="modal-field-val">${world.life.type || '—'}</div></div>
        <div class="modal-field"><div class="modal-field-label">Biome</div><div class="modal-field-val">${world.life.biome || '—'}</div></div>
        <div class="modal-field"><div class="modal-field-label">Life Origin</div><div class="modal-field-val" style="color:var(--orange)">${world.life.origin || '—'}</div></div>
      ` : ''}
    </div>
  `;

  modal.classList.add('open');
}

function populateOriginFilter() {
  const sel = document.getElementById('filterOrigin');
  const origins = new Set();
  for (const world of Object.values(TERRAFORMED_WORLDS)) {
    if (world.life?.origin) origins.add(world.life.origin);
  }
  for (const o of [...origins].sort()) {
    const opt = document.createElement('option');
    opt.value = o; opt.textContent = o;
    sel.appendChild(opt);
  }
}

function applySort(entries, sortVal) {
  const sorted = [...entries];
  switch (sortVal) {
    case 'dist-asc':     sorted.sort((a, b) => (a[1].distToSun ?? Infinity) - (b[1].distToSun ?? Infinity)); break;
    case 'dist-desc':    sorted.sort((a, b) => (b[1].distToSun ?? -Infinity) - (a[1].distToSun ?? -Infinity)); break;
    case 'radius-asc':   sorted.sort((a, b) => (a[1].radius ?? Infinity) - (b[1].radius ?? Infinity)); break;
    case 'radius-desc':  sorted.sort((a, b) => (b[1].radius ?? -Infinity) - (a[1].radius ?? -Infinity)); break;
    case 'mass-asc':     sorted.sort((a, b) => (a[1].mass ?? Infinity) - (b[1].mass ?? Infinity)); break;
    case 'mass-desc':    sorted.sort((a, b) => (b[1].mass ?? -Infinity) - (a[1].mass ?? -Infinity)); break;
    case 'density-asc':  sorted.sort((a, b) => (getDensity(a[1]) ?? Infinity) - (getDensity(b[1]) ?? Infinity)); break;
    case 'density-desc': sorted.sort((a, b) => (getDensity(b[1]) ?? -Infinity) - (getDensity(a[1]) ?? -Infinity)); break;
    case 'alpha-asc':    sorted.sort((a, b) => a[0].localeCompare(b[0])); break;
    case 'alpha-desc':   sorted.sort((a, b) => b[0].localeCompare(a[0])); break;
  }
  return sorted;
}

function filterAndRender() {
  const query        = document.getElementById('searchBox').value.toLowerCase();
  const typeFilter   = document.getElementById('filterType').value;
  const originFilter = document.getElementById('filterOrigin').value;
  const sortVal      = document.getElementById('sortSelect').value;

  const grid = document.getElementById('terraformedGrid');
  grid.innerHTML = '';

  let entries = Object.entries(TERRAFORMED_WORLDS);
  entries = entries.filter(([name, world]) => {
    const matchText   = !query || name.toLowerCase().includes(query)
      || (world.systemName || '').toLowerCase().includes(query)
      || (world.life?.biome || '').toLowerCase().includes(query);
    const matchType   = !typeFilter   || world.type === typeFilter;
    const matchOrigin = !originFilter || world.life?.origin === originFilter;
    return matchText && matchType && matchOrigin;
  });

  entries = applySort(entries, sortVal);

  document.getElementById('resultsCount').textContent = `${entries.length} world${entries.length !== 1 ? 's' : ''}`;

  if (entries.length === 0) {
    grid.innerHTML = '<div class="empty-state">NO MATCHING RECORDS</div>';
    return;
  }

  for (const [name, world] of entries) {
    grid.appendChild(makeCard(name, world));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  populateOriginFilter();
  filterAndRender();

  document.getElementById('searchBox').addEventListener('input', filterAndRender);
  document.getElementById('filterType').addEventListener('change', filterAndRender);
  document.getElementById('filterOrigin').addEventListener('change', filterAndRender);
  document.getElementById('sortSelect').addEventListener('change', filterAndRender);

  document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('open');
  });
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === document.getElementById('modal')) {
      document.getElementById('modal').classList.remove('open');
    }
  });
});
