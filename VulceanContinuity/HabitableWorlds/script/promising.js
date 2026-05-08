// Promising worlds (Terrania 2.0 candidates) page
// 1 parsec = 3.26156 light-years
const PC_TO_LY = 3.26156;
// 1 Earth radius = 6371 km
const EARTH_RADIUS_KM = 6371;

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

function fmtRadius(radiusKm) {
  if (radiusKm == null) return '—';
  const re = (radiusKm / EARTH_RADIUS_KM).toFixed(3);
  return `${re} R⊕`;
}

function spectralColor(sc) {
  if (!sc) return '#7a92b8';
  const c = sc[0].toUpperCase();
  const map = { O:'#b0d4ff', B:'#cce0ff', A:'#e8f0ff', F:'#fffde0', G:'#ffe87a', K:'#ffaa44', M:'#ff6633', L:'#cc3300', T:'#661100', Y:'#330000', P:'#a070ff', D:'#88aacc' };
  return map[c] || '#7a92b8';
}

function lifeBadge(exists) {
  if (exists === true)      return `<span class="badge badge-life">● LIFE CONFIRMED</span>`;
  if (exists === 'pending') return `<span class="badge badge-pending">◌ LIFE PENDING</span>`;
  return `<span class="badge badge-nolife">✕ NO LIFE</span>`;
}

function lifeStatusText(exists) {
  if (exists === true)      return '<span style="color:var(--green)">CONFIRMED</span>';
  if (exists === 'pending') return '<span style="color:var(--yellow)">PENDING REVIEW</span>';
  return '<span style="color:#f87171">NOT DETECTED</span>';
}

function calculateDensity(radiusKm, massEarths) {
  const radiusEarths = radiusKm / 6378.14;
  const EARTH_DENSITY = 5.5136;
  const density = EARTH_DENSITY * (massEarths / Math.pow(radiusEarths, 3));
  return density.toFixed(3);
}

function getDensity(world) {
  const r = world.physical?.radius;
  const m = world.physical?.mass;
  if (r != null && m != null) return parseFloat(calculateDensity(r, m));
  return null;
}

function makeCard(name, world) {
  const density = getDensity(world);
  const mass    = world.physical?.mass;
  const radius  = world.physical?.radius;
  const sma     = world.orbit?.sma;
  const div = document.createElement('div');
  div.className = 'planet-card';
  div.innerHTML = `
    ${world.thumbnail
      ? `<img class="planet-card-img" src="${world.thumbnail}" alt="${name}" onerror="this.style.display='none'">`
      : `<div class="planet-card-img-placeholder">🌍</div>`}
    <div class="planet-card-body">
      <div class="planet-card-name">${name}</div>
      <div class="planet-card-system">${world.systemName} · ${world.parentStar}</div>
      <div class="planet-card-meta">
        <div class="planet-card-row"><span class="planet-card-row-label">Type</span><span class="planet-card-row-val">${world.type || '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Mass</span><span class="planet-card-row-val">${mass != null ? mass + ' M⊕' : '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Radius</span><span class="planet-card-row-val">${fmtRadius(radius)}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Density</span><span class="planet-card-row-val">${density != null ? density + ' g/cm³' : '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">SMA</span><span class="planet-card-row-val">${sma != null ? sma + ' AU' : '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Moons</span><span class="planet-card-row-val">${world.moonCount ?? '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Star</span><span class="planet-card-row-val" style="color:${spectralColor(world.spectralClass)}">${world.spectralClass || '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Distance</span><span class="planet-card-row-val">${fmtDist(world.distToSun)}</span></div>
      </div>
      <div class="planet-card-badges">
        ${lifeBadge(world.life?.exists)}
      </div>
    </div>
  `;
  div.addEventListener('click', () => openModal(name, world));
  return div;
}

function openModal(name, world) {
  const modal   = document.getElementById('modal');
  const content = document.getElementById('modalContent');
  const density = getDensity(world);
  const mass    = world.physical?.mass;
  const radius  = world.physical?.radius;
  const sma     = world.orbit?.sma;
  const period  = world.orbit?.period;
  const ecc     = world.orbit?.eccentricity;

  content.innerHTML = `
    ${world.thumbnail ? `<img class="modal-thumb" src="${world.thumbnail}" alt="${name}" onerror="this.remove()">` : ''}
    <div class="modal-title">${name}</div>
    <div class="modal-sub">${world.type} · ${world.systemName}</div>

    <div class="modal-section-title">PHYSICAL DATA</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Object Type</div><div class="modal-field-val">${world.type || '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Mass</div><div class="modal-field-val">${mass != null ? mass + ' M⊕' : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Radius</div><div class="modal-field-val">${fmtRadius(radius)}</div></div>
      <div class="modal-field"><div class="modal-field-label">Density</div><div class="modal-field-val">${density != null ? density + ' g/cm³' : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Moon Count</div><div class="modal-field-val">${world.moonCount ?? '—'}</div></div>
    </div>

    <div class="modal-section-title">ORBITAL DATA</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Semi-Major Axis</div><div class="modal-field-val">${sma != null ? sma + ' AU' : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Orbital Period</div><div class="modal-field-val">${period != null ? period + ' yr' : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Eccentricity</div><div class="modal-field-val">${ecc != null ? ecc : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">System Type</div><div class="modal-field-val">${world.systemType || '—'}</div></div>
    </div>

    <div class="modal-section-title">STELLAR CONTEXT</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">System</div><div class="modal-field-val">${world.systemName}</div></div>
      <div class="modal-field"><div class="modal-field-label">Parent Star</div><div class="modal-field-val">${world.parentStar}</div></div>
      <div class="modal-field"><div class="modal-field-label">Spectral Class</div><div class="modal-field-val" style="color:${spectralColor(world.spectralClass)}">${world.spectralClass || '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Distance from Phebe</div><div class="modal-field-val">${fmtDist(world.distToSun)}</div></div>
    </div>

    <div class="modal-section-title">LIFE ASSESSMENT</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Life Status</div><div class="modal-field-val">${lifeStatusText(world.life?.exists)}</div></div>
      ${world.life?.exists === true ? `
        <div class="modal-field"><div class="modal-field-label">Life Type</div><div class="modal-field-val">${world.life.type || '—'}</div></div>
        <div class="modal-field"><div class="modal-field-label">Biome</div><div class="modal-field-val">${world.life.biome || '—'}</div></div>
        <div class="modal-field"><div class="modal-field-label">Life Origin</div><div class="modal-field-val">${world.life.origin || '—'}</div></div>
      ` : ''}
    </div>
  `;

  modal.classList.add('open');
}

function applySort(entries, sortVal) {
  const sorted = [...entries];
  switch (sortVal) {
    case 'dist-asc':     sorted.sort((a, b) => (a[1].distToSun ?? Infinity) - (b[1].distToSun ?? Infinity)); break;
    case 'dist-desc':    sorted.sort((a, b) => (b[1].distToSun ?? -Infinity) - (a[1].distToSun ?? -Infinity)); break;
    case 'radius-asc':   sorted.sort((a, b) => (a[1].physical?.radius ?? Infinity) - (b[1].physical?.radius ?? Infinity)); break;
    case 'radius-desc':  sorted.sort((a, b) => (b[1].physical?.radius ?? -Infinity) - (a[1].physical?.radius ?? -Infinity)); break;
    case 'mass-asc':     sorted.sort((a, b) => (a[1].physical?.mass ?? Infinity) - (b[1].physical?.mass ?? Infinity)); break;
    case 'mass-desc':    sorted.sort((a, b) => (b[1].physical?.mass ?? -Infinity) - (a[1].physical?.mass ?? -Infinity)); break;
    case 'density-asc':  sorted.sort((a, b) => (getDensity(a[1]) ?? Infinity) - (getDensity(b[1]) ?? Infinity)); break;
    case 'density-desc': sorted.sort((a, b) => (getDensity(b[1]) ?? -Infinity) - (getDensity(a[1]) ?? -Infinity)); break;
    case 'alpha-asc':    sorted.sort((a, b) => a[0].localeCompare(b[0])); break;
    case 'alpha-desc':   sorted.sort((a, b) => b[0].localeCompare(a[0])); break;
  }
  return sorted;
}

function filterAndRender() {
  const query      = document.getElementById('searchBox').value.toLowerCase();
  const typeFilter = document.getElementById('filterType').value;
  const lifeFilter = document.getElementById('filterLife').value;
  const sortVal    = document.getElementById('sortSelect').value;

  const grid = document.getElementById('promisingGrid');
  grid.innerHTML = '';

  let entries = Object.entries(PROMISING_WORLDS);
  entries = entries.filter(([name, world]) => {
    const matchText = !query || name.toLowerCase().includes(query)
      || (world.systemName || '').toLowerCase().includes(query)
      || (world.life?.type || '').toLowerCase().includes(query);
    const matchType = !typeFilter || world.type === typeFilter;
    const matchLife = !lifeFilter || String(world.life?.exists) === lifeFilter;
    return matchText && matchType && matchLife;
  });

  entries = applySort(entries, sortVal);

  document.getElementById('resultsCount').textContent = `${entries.length} candidate${entries.length !== 1 ? 's' : ''}`;

  if (entries.length === 0) {
    grid.innerHTML = '<div class="empty-state">NO MATCHING CANDIDATES</div>';
    return;
  }

  for (const [name, world] of entries) {
    grid.appendChild(makeCard(name, world));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  filterAndRender();

  document.getElementById('searchBox').addEventListener('input', filterAndRender);
  document.getElementById('filterType').addEventListener('change', filterAndRender);
  document.getElementById('filterLife').addEventListener('change', filterAndRender);
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
