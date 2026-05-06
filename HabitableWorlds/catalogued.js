// Catalogued systems page

function spectralColor(sc) {
  if (!sc) return '#7a92b8';
  const c = sc[0].toUpperCase();
  const map = { O:'#b0d4ff', B:'#cce0ff', A:'#e8f0ff', F:'#fffde0', G:'#ffe87a', K:'#ffaa44', M:'#ff6633', L:'#cc3300', T:'#661100', Y:'#330000', P:'#a070ff', D:'#88aacc' };
  return map[c] || '#7a92b8';
}

function renderTable(data) {
  const tbody = document.getElementById('catalogueBody');
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:3rem;color:var(--text-dimmer);font-family:var(--font-mono);font-size:0.75rem;">NO MATCHING RECORDS</td></tr>`;
    document.getElementById('resultsCount').textContent = '0 systems';
    return;
  }

  document.getElementById('resultsCount').textContent = `${data.length} system${data.length !== 1 ? 's' : ''}`;

  for (const [name, sys] of data) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sys.thumbnail ? `<img class="td-thumb" src="${sys.thumbnail}" alt="${name}" onerror="this.style.display='none'">` : `<div class="td-thumb-placeholder">⬡</div>`}</td>
      <td class="td-desig">${sys.designation || '—'}</td>
      <td class="td-name">${name}</td>
      <td>${sys.systemType || '—'}</td>
      <td style="color:${spectralColor(sys.spectralClass)};font-family:var(--font-mono)">${sys.spectralClass || '—'}</td>
      <td>${sys.distToSun != null ? sys.distToSun.toLocaleString() : '—'}</td>
      <td>${sys.planetCount ? `${sys.planetCount.major} maj / ${sys.planetCount.dwarf} dwf` : '—'}</td>
      <td>${sys.moonCount ? `${sys.moonCount.major} maj / ${sys.moonCount.dwarf} dwf` : '—'}</td>
      <td style="font-size:0.65rem">${sys.discDate ? sys.discDate.split(' ')[0] : '—'}</td>
      <td style="color:var(--accent-bright)">${sys.pioneer || '—'}</td>
      <td>${sys.life?.exists
        ? `<span class="badge badge-life">● CONFIRMED</span>`
        : `<span class="badge badge-nolife">✕ NONE</span>`}</td>
    `;
    tr.addEventListener('click', () => openModal(name, sys));
    tbody.appendChild(tr);
  }
}

function openModal(name, sys) {
  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');

  content.innerHTML = `
    ${sys.thumbnail ? `<img class="modal-thumb" src="${sys.thumbnail}" alt="${name}" onerror="this.remove()">` : ''}
    <div class="modal-title">${name}</div>
    <div class="modal-sub">${sys.designation || 'No Designation'}</div>
    <div class="modal-section-title">SYSTEM DATA</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">System Type</div><div class="modal-field-val">${sys.systemType || '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Spectral Class</div><div class="modal-field-val" style="color:${spectralColor(sys.spectralClass)}">${sys.spectralClass || '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Distance from Phebe (ly)</div><div class="modal-field-val">${sys.distToSun != null ? sys.distToSun.toLocaleString() : '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Parent Sun</div><div class="modal-field-val">${sys.parentSun || '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Major Planets</div><div class="modal-field-val">${sys.planetCount?.major ?? '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Dwarf Planets</div><div class="modal-field-val">${sys.planetCount?.dwarf ?? '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Major Moons</div><div class="modal-field-val">${sys.moonCount?.major ?? '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Dwarf Moons</div><div class="modal-field-val">${sys.moonCount?.dwarf ?? '—'}</div></div>
    </div>
    <div class="modal-section-title">DISCOVERY</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Discovery Date</div><div class="modal-field-val">${sys.discDate || '—'}</div></div>
      <div class="modal-field"><div class="modal-field-label">Method</div><div class="modal-field-val">${sys.discMethod || '—'}</div></div>
      <div class="modal-field" style="grid-column:1/-1"><div class="modal-field-label">Pioneer</div><div class="modal-field-val">${sys.pioneer || '—'}</div></div>
    </div>
    <div class="modal-section-title">LIFE STATUS</div>
    <div class="modal-grid">
      <div class="modal-field"><div class="modal-field-label">Life Exists</div><div class="modal-field-val">${sys.life?.exists ? '<span style="color:var(--green)">CONFIRMED</span>' : '<span style="color:#f87171">NOT DETECTED</span>'}</div></div>
      ${sys.life?.exists ? `
        <div class="modal-field"><div class="modal-field-label">Objects with Life</div><div class="modal-field-val">${sys.life.objectsWithLife}</div></div>
        <div class="modal-field" style="grid-column:1/-1"><div class="modal-field-label">Life Types</div><div class="modal-field-val">${sys.life.types || '—'}</div></div>
      ` : ''}
    </div>
  `;

  modal.classList.add('open');
}

function filterAndRender() {
  const query = document.getElementById('searchBox').value.toLowerCase();
  const typeFilter = document.getElementById('filterType').value;
  const lifeFilter = document.getElementById('filterLife').value;

  let entries = Object.entries(CATALOGUED_SYSTEMS);

  entries = entries.filter(([name, sys]) => {
    const matchText = !query || name.toLowerCase().includes(query)
      || (sys.designation || '').toLowerCase().includes(query)
      || (sys.pioneer || '').toLowerCase().includes(query)
      || (sys.spectralClass || '').toLowerCase().includes(query);
    const matchType = !typeFilter || sys.systemType === typeFilter;
    const matchLife = !lifeFilter || String(sys.life?.exists) === lifeFilter;
    return matchText && matchType && matchLife;
  });

  renderTable(entries);
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
