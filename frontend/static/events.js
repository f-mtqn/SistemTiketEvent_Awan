/* events.js — Event pages */

const Events = (() => {

  /* ── List ─────────────────────────────────────────────────────────────── */
  async function renderList() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Event</h1>
          <p class="page-subtitle">Daftar semua event yang tersedia</p>
        </div>
        <button class="btn btn-primary" id="btn-add-event">Tambah event</button>
      </div>
      <div id="events-table-wrap"></div>
      <p class="note">Event yang masih memiliki pesanan tidak dapat dihapus.</p>
    `;

    document.getElementById('btn-add-event').addEventListener('click', () => renderForm(null));

    await loadTable();
  }

  async function loadTable() {
    const wrap = document.getElementById('events-table-wrap');
    wrap.innerHTML = '<p style="color:var(--slate);font-size:.9rem">Memuat...</p>';
    let data;
    try { data = await API.get('/events'); }
    catch (e) { wrap.innerHTML = `<p class="note note-danger">Gagal memuat: ${e.message}</p>`; return; }

    if (data.length === 0) {
      wrap.innerHTML = `<div class="table-wrap"><table><tbody><tr><td class="table-empty">Belum ada data</td></tr></tbody></table></div>`;
      return;
    }

    const rows = data.map(e => {
      const stokCell = e.stok === 0
        ? `<span class="stock-zero">${e.stok}</span>`
        : e.stok;
      const canDel = e.jumlah_pesanan === 0;
      return `<tr>
        <td><span class="table-link" data-id="${e.id}">${e.nama}</span></td>
        <td>${e.tanggal}</td>
        <td>${e.lokasi}</td>
        <td class="num">${fmt_rupiah(e.harga)}</td>
        <td class="num">${stokCell}</td>
        <td class="actions">
          <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${e.id}">Ubah</button>
          <button class="btn btn-danger btn-sm" data-action="del" data-id="${e.id}"
            ${canDel ? '' : 'disabled title="Masih ada pesanan"'}>Hapus</button>
        </td>
      </tr>`;
    }).join('');

    wrap.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nama event</th><th>Tanggal</th><th>Lokasi</th>
              <th class="num">Harga</th><th class="num">Stok</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    // Event delegation
    wrap.querySelectorAll('.table-link').forEach(el =>
      el.addEventListener('click', () => renderForm(Number(el.dataset.id))));
    wrap.querySelectorAll('[data-action="edit"]').forEach(el =>
      el.addEventListener('click', () => renderForm(Number(el.dataset.id))));
    wrap.querySelectorAll('[data-action="del"]').forEach(el =>
      el.addEventListener('click', () => delEvent(Number(el.dataset.id))));
  }

  async function delEvent(id) {
    if (!confirm_del('Hapus event ini?')) return;
    try {
      await API.del(`/events/${id}`);
      await loadTable();
    } catch (e) {
      alert(e.message);
    }
  }

  /* ── Form / Detail ────────────────────────────────────────────────────── */
  async function renderForm(id) {
    const isNew = id === null;
    const main = document.getElementById('main-content');

    let event = null;
    if (!isNew) {
      try { event = await API.get(`/events/${id}`); }
      catch (e) { alert(e.message); return; }
    }

    const title = isNew ? 'Tambah event' : 'Ubah event';

    main.innerHTML = `
      <span class="back-link" id="back-link">Daftar event</span>
      <div class="page-header"><h1 class="page-title">${title}</h1></div>
      <div class="form-row">
        <!-- Form card -->
        <div class="card" id="form-card">
          <div class="field-group">
            <label for="f-nama">Nama event</label>
            <input id="f-nama" type="text" value="${event?.nama || ''}" />
            <span class="field-error" id="e-nama"></span>
          </div>
          <div class="field-group">
            <label for="f-tanggal">Tanggal</label>
            <input id="f-tanggal" type="date" value="${event?.tanggal || ''}" />
            <span class="field-error" id="e-tanggal"></span>
          </div>
          <div class="field-group">
            <label for="f-lokasi">Lokasi</label>
            <input id="f-lokasi" type="text" value="${event?.lokasi || ''}" />
            <span class="field-error" id="e-lokasi"></span>
          </div>
          <div class="field-group">
            <label for="f-harga">Harga per tiket (Rp)</label>
            <input id="f-harga" type="number" min="0" value="${event?.harga ?? ''}" />
            <span class="field-error" id="e-harga"></span>
          </div>
          <div class="field-group">
            <label for="f-stok">Stok tiket</label>
            <input id="f-stok" type="number" min="0" value="${event?.stok ?? ''}" />
            <span class="field-error" id="e-stok"></span>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" id="btn-save">Simpan</button>
            <button class="btn btn-secondary" id="btn-cancel">Batal</button>
          </div>
          <span class="field-error" id="e-global" style="margin-top:8px;display:block"></span>
        </div>

        <!-- Detail card -->
        ${isNew ? '' : renderDetailCard(event)}
      </div>
    `;

    document.getElementById('back-link').addEventListener('click', () => renderList());
    document.getElementById('btn-cancel').addEventListener('click', () => renderList());
    document.getElementById('btn-save').addEventListener('click', () => saveEvent(id));

    if (!isNew) {
      const btnDel = document.getElementById('btn-del-event');
      if (btnDel) btnDel.addEventListener('click', () => delEventFromDetail(id));
    }
  }

  function renderDetailCard(event) {
    const pesananRows = (event.pesanan || []).map(o =>
      `<tr>
        <td>${o.pembeli_nama}</td>
        <td class="num">${o.jumlah}</td>
        <td>${chip(o.status)}</td>
      </tr>`
    ).join('') || `<tr><td colspan="3" class="table-empty">Tidak ada pesanan</td></tr>`;

    const canDel = (event.pesanan || []).length === 0;
    const pesananCount = (event.pesanan || []).length;

    return `
      <div class="card">
        <h2 class="section-title">Detail event</h2>
        <div class="detail-list">
          <div class="detail-item"><span class="detail-label">Tanggal</span><span class="detail-value">${event.tanggal}</span></div>
          <div class="detail-item"><span class="detail-label">Lokasi</span><span class="detail-value">${event.lokasi}</span></div>
          <div class="detail-item"><span class="detail-label">Harga</span><span class="detail-value mono">${fmt_rupiah(event.harga)}</span></div>
          <div class="detail-item"><span class="detail-label">Stok tersisa</span>
            <span class="detail-value mono ${event.stok === 0 ? 'stock-zero' : ''}">${event.stok}</span>
          </div>
        </div>
        <h2 class="section-title" style="margin-top:20px">Pesanan terkait</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Pembeli</th><th class="num">Jumlah</th><th>Status</th></tr></thead>
            <tbody>${pesananRows}</tbody>
          </table>
        </div>
        <div style="margin-top:20px">
          <button class="btn btn-danger" id="btn-del-event" ${canDel ? '' : 'disabled'}>Hapus event</button>
          ${!canDel ? `<p class="note note-danger" style="margin-top:8px">Event ini masih punya ${pesananCount} pesanan, jadi belum bisa dihapus.</p>` : ''}
        </div>
      </div>`;
  }

  function clearErrors() {
    ['e-nama','e-tanggal','e-lokasi','e-harga','e-stok','e-global'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
  }

  async function saveEvent(id) {
    clearErrors();
    const nama    = document.getElementById('f-nama').value.trim();
    const tanggal = document.getElementById('f-tanggal').value.trim();
    const lokasi  = document.getElementById('f-lokasi').value.trim();
    const harga   = document.getElementById('f-harga').value;
    const stok    = document.getElementById('f-stok').value;

    let valid = true;
    if (!nama)    { document.getElementById('e-nama').textContent = 'Nama wajib diisi'; valid = false; }
    if (!tanggal) { document.getElementById('e-tanggal').textContent = 'Tanggal wajib diisi'; valid = false; }
    if (!lokasi)  { document.getElementById('e-lokasi').textContent = 'Lokasi wajib diisi'; valid = false; }
    if (harga === '' || Number(harga) < 0) { document.getElementById('e-harga').textContent = 'Harga tidak valid'; valid = false; }
    if (stok === '' || Number(stok) < 0)   { document.getElementById('e-stok').textContent = 'Stok tidak valid'; valid = false; }
    if (!valid) return;

    const body = { nama, tanggal, lokasi, harga: Number(harga), stok: Number(stok) };
    try {
      if (id === null) await API.post('/events', body);
      else             await API.put(`/events/${id}`, body);
      renderList();
    } catch (e) {
      document.getElementById('e-global').textContent = e.message;
    }
  }

  async function delEventFromDetail(id) {
    if (!confirm_del('Hapus event ini?')) return;
    try {
      await API.del(`/events/${id}`);
      renderList();
    } catch (e) {
      alert(e.message);
    }
  }

  return { renderList };
})();
