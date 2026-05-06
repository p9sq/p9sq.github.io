// Promising worlds (Terrania 2.0 candidates) page

function spectralColor(sc) {
  if (!sc) return '#7a92b8';
  const c = sc[0].toUpperCase();
  const map = { O:'#b0d4ff', B:'#cce0ff', A:'#e8f0ff', F:'#fffde0', G:'#ffe87a', K:'#ffaa44', M:'#ff6633', L:'#cc3300', T:'#661100', Y:'#330000', P:'#a070ff', D:'#88aacc' };
  return map[c] || '#7a92b8';
}

function makeCard(name, world) {
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
        <div class="planet-card-row"><span class="planet-card-row-label">Mass</span><span class="planet-card-row-val">${world.mass != null ? world.mass + ' M⊕' : '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Radius</span><span class="planet-card-row-val">${world.radius != null ? world.radius.toLocaleString() + ' km' : '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">SMA</span><span class="planet-card-row-val">${world.sma != null ? world.sma + ' AU' : '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Moons</span><span class="planet-card-row-val">${world.moonCount ?? '—'}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Star</span><span class="planet-card-row-val" style="color:${spectralColor(world.spectralClass)}">${world.spectralClass}</span></div>
        <div class="planet-card-row"><span class="planet-card-row-label">Dist (ly)</span><span class="planet-card-row-val">${world.distToSun != null ? world.distToSun === 0 ? '< 0.01' : world.distToSun.toLocaleString() : '—'}</span></div>
      </div>
      <div class="planet-card-badges">
        ${world.life?.exists
          ? `<span class="badge badge-life">● LIFE CONFIRMED</span>`
          : `<span class="badge badge-nolife">✕ NO LIFE</span>`}
      </div>
    </div>
  `;
  div.addEventListener('click', () => openModal(name, world));
  return div;
}

function openModal(name, world) {
  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');

  content.innerHTML = `
    ${world.thumbnail ? `<img class="modal-thumb" src="${world.thumbnail}" alt="${name}" onerror="this.remove()">` : ''}
    <div class="modal-title">${name}</div>
    <div class="modal-sub">${world.type} · ${world.systemName}</div>
    <div class="modal-section-title">ORBITAL DATA</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Object Type</div><div class="modal-field-val">${world.type || '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Semi-Major Axis</div><div class="modal-field-val">${world.sma != null ? world.sma + ' AU' : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Mass</div><div class="modal-field-val">${world.mass != null ? world.mass + ' M⊕' : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Radius</div><div class="modal-field-val">${world.radius != null ? world.radius.toLocaleString() + ' km' : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Moon Count</div><div class="modal-field-val">${world.moonCount ?? '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">System Type</div><div class="modal-field-val">${world.systemType || '—'}</div></div>
    </div>
    <div class="modal-section-title">STELLAR CONTEXT</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">System</div><div class="modal-field-val">${world.systemName}</div></div>
      <div class="modal-field"><div class="modal-field-label">Parent Star</div><div class="modal-field-val">${world.parentStar}</div></div>
      <div class="modal-field"><div class="modal-field-label">Spectral Class</div><div class="modal-field-val" style="color:var(--accent-bright)">${world.spectralClass}</div></div>
      <div class="modal-field"><div class="modal-field-label">Distance from Phebe (ly)</div><div class="modal-field-val">${world.distToSun === 0 ? '< 0.01' : world.distToSun?.toLocaleString()}</div></div>
    </div>
    <div class="modal-section-title">LIFE ASSESSMENT</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Life Status</div><div class="modal-field-val">${world.life?.exists ? '<span style="color:var(--green)">CONFIRMED</span>' : '<span style="color:#f87171">NOT DETECTED</span>'}</div></div>
      ${world.life?.exists ? `
        <div class="modal-field"><div class="modal-field-label">Life Type</div><div class="modal-field-val">${world.life.type || '—'}</div></div>
        <div class="modal-field"><div class="modal-field-label">Biome</div><div class="modal-field-val">${world.life.biome || '—'}</div></div>
        <div class="modal-field"><div class="modal-field-label">Life Origin</div><div class="modal-field-val">${world.life.origin || '—'}</div></div>
      ` : ''}
    </div>
  `;

  modal.classList.add('open');
}

function filterAndRender() {
  const query = document.getElementById('searchBox').value.toLowerCase();
  const typeFilter = document.getElementById('filterType').value;
  const lifeFilter = document.getElementById('filterLife').value;

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

  document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('modal').classList.remove('open');
  });
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === document.getElementById('modal')) {
      document.getElementById('modal').classList.remove('open');
    }
  });
});
