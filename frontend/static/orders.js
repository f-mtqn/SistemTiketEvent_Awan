/* orders.js — Pesanan pages */

const Orders = (() => {

  /* ── List ─────────────────────────────────────────────────────────────── */
  async function renderList() {
    const main = document.getElementById('main-content');

    // Load buyers & events for filter dropdowns
    let buyers_data = [], events_data = [];
    try {
      [buyers_data, events_data] = await Promise.all([API.get('/buyers'), API.get('/events')]);
    } catch (_) {}

    const buyerOpts = buyers_data.map(b => `<option value="${b.id}">${b.nama}</option>`).join('');
    const eventOpts = events_data.map(e => `<option value="${e.id}">${e.nama}</option>`).join('');

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Pesanan</h1>
          <p class="page-subtitle">Daftar semua pesanan tiket</p>
        </div>
        <button class="btn btn-primary" id="btn-add-order">Beli tiket</button>
      </div>

      <div class="filter-bar">
        <div class="field">
          <label for="filter-buyer">Pembeli</label>
          <select id="filter-buyer">
            <option value="">Semua pembeli</option>
            ${buyerOpts}
          </select>
        </div>
        <div class="field">
          <label for="filter-event">Event</label>
          <select id="filter-event">
            <option value="">Semua event</option>
            ${eventOpts}
          </select>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-reset-filter" style="align-self:flex-end">Reset</button>
      </div>

      <div id="orders-table-wrap"></div>
    `;

    document.getElementById('btn-add-order').addEventListener('click', () => renderFormBuy());
    document.getElementById('filter-buyer').addEventListener('change', loadTable);
    document.getElementById('filter-event').addEventListener('change', loadTable);
    document.getElementById('btn-reset-filter').addEventListener('click', () => {
      document.getElementById('filter-buyer').value = '';
      document.getElementById('filter-event').value = '';
      loadTable();
    });

    await loadTable();
  }

  async function loadTable() {
    const wrap = document.getElementById('orders-table-wrap');
    wrap.innerHTML = '<p style="color:var(--slate);font-size:.9rem">Memuat...</p>';

    const buyerId = document.getElementById('filter-buyer')?.value || '';
    const eventId = document.getElementById('filter-event')?.value || '';
    let qs = '';
    if (buyerId) qs += `?buyer_id=${buyerId}`;
    else if (eventId) qs += `?event_id=${eventId}`;
    // If both, add second filter client-side (API only supports one at a time)
    let data;
    try { data = await API.get('/orders' + qs); }
    catch (e) { wrap.innerHTML = `<p class="note note-danger">Gagal memuat: ${e.message}</p>`; return; }

    // Client-side second filter
    if (buyerId && eventId) data = data.filter(o => String(o.event_id) === eventId);

    if (data.length === 0) {
      wrap.innerHTML = `<div class="table-wrap"><table><tbody><tr><td class="table-empty">Belum ada data</td></tr></tbody></table></div>`;
      return;
    }

    const rows = data.map(o => `<tr>
      <td class="num">${o.id}</td>
      <td>${o.pembeli_nama}</td>
      <td>${o.event_nama}</td>
      <td class="num">${o.jumlah}</td>
      <td class="num">${fmt_rupiah(o.total_harga)}</td>
      <td>${chip(o.status)}</td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${o.id}">Ubah</button>
        <button class="btn btn-danger btn-sm" data-action="del" data-id="${o.id}">Hapus</button>
      </td>
    </tr>`).join('');

    wrap.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="num">ID</th><th>Pembeli</th><th>Event</th>
              <th class="num">Jumlah</th><th class="num">Total harga</th><th>Status</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    wrap.querySelectorAll('[data-action="edit"]').forEach(el =>
      el.addEventListener('click', () => renderFormEdit(Number(el.dataset.id))));
    wrap.querySelectorAll('[data-action="del"]').forEach(el =>
      el.addEventListener('click', () => delOrder(Number(el.dataset.id))));
  }

  async function delOrder(id) {
    if (!confirm_del('Hapus pesanan ini? Stok tiket akan dikembalikan jika pesanan bukan batal.')) return;
    try {
      await API.del(`/orders/${id}`);
      await loadTable();
    } catch (e) {
      alert(e.message);
    }
  }

  /* ── Form Beli Tiket ──────────────────────────────────────────────────── */
  async function renderFormBuy() {
    const main = document.getElementById('main-content');

    let buyers_data = [], events_data = [];
    try {
      [buyers_data, events_data] = await Promise.all([API.get('/buyers'), API.get('/events')]);
    } catch (e) { alert('Gagal memuat data: ' + e.message); return; }

    const buyerOpts = buyers_data.map(b => `<option value="${b.id}">${b.nama}</option>`).join('');
    const eventOpts = events_data.map(e =>
      `<option value="${e.id}" data-harga="${e.harga}" data-stok="${e.stok}">${e.nama} (stok: ${e.stok})</option>`
    ).join('');

    main.innerHTML = `
      <span class="back-link" id="back-link">Daftar pesanan</span>
      <div class="page-header"><h1 class="page-title">Beli tiket</h1></div>
      <div class="form-row">
        <div class="card">
          <div class="field-group">
            <label for="f-buyer">Pembeli</label>
            <select id="f-buyer">
              <option value="">Pilih pembeli</option>
              ${buyerOpts}
            </select>
            <span class="field-error" id="e-buyer"></span>
          </div>
          <div class="field-group">
            <label for="f-event">Event</label>
            <select id="f-event">
              <option value="">Pilih event</option>
              ${eventOpts}
            </select>
            <span class="field-error" id="e-event"></span>
          </div>
          <div class="field-group">
            <label for="f-jumlah">Jumlah tiket</label>
            <input id="f-jumlah" type="number" min="1" value="1" />
            <span class="field-hint" id="hint-stok"></span>
            <span class="field-error" id="e-jumlah"></span>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" id="btn-save">Beli tiket</button>
            <button class="btn btn-secondary" id="btn-cancel">Batal</button>
          </div>
          <span class="field-error" id="e-global" style="margin-top:8px;display:block"></span>
        </div>

        <!-- Summary card -->
        <div class="card" id="summary-card">
          <h2 class="section-title">Ringkasan</h2>
          <p style="color:var(--slate);font-size:.9rem">Pilih event untuk melihat ringkasan.</p>
        </div>
      </div>
    `;

    document.getElementById('back-link').addEventListener('click', () => renderList());
    document.getElementById('btn-cancel').addEventListener('click', () => renderList());
    document.getElementById('btn-save').addEventListener('click', () => saveBuy(events_data));
    document.getElementById('f-event').addEventListener('change', () => updateSummaryBuy(events_data));
    document.getElementById('f-jumlah').addEventListener('input', () => updateSummaryBuy(events_data));
  }

  function updateSummaryBuy(events_data) {
    const eventId = Number(document.getElementById('f-event').value);
    const jumlah  = Number(document.getElementById('f-jumlah').value) || 0;
    const event   = events_data.find(e => e.id === eventId);
    const wrap    = document.getElementById('summary-card');
    const hintEl  = document.getElementById('hint-stok');

    if (!event) {
      wrap.innerHTML = '<h2 class="section-title">Ringkasan</h2><p style="color:var(--slate);font-size:.9rem">Pilih event untuk melihat ringkasan.</p>';
      hintEl.textContent = '';
      return;
    }

    hintEl.textContent = `Stok tersedia: ${event.stok}`;
    const total = jumlah * event.harga;
    const sisaStok = event.stok - jumlah;

    wrap.innerHTML = `
      <h2 class="section-title">Ringkasan</h2>
      <div class="summary-row"><span>Harga per tiket</span><span class="mono">${fmt_rupiah(event.harga)}</span></div>
      <div class="summary-row"><span>Stok tersedia</span><span class="mono">${event.stok}</span></div>
      <div class="summary-row"><span>Jumlah tiket</span><span class="mono">${jumlah}</span></div>
      <div class="summary-row"><span>Total harga</span><span class="mono">${fmt_rupiah(total)}</span></div>
      <div class="summary-row"><span>Stok setelah pembelian</span><span class="mono ${sisaStok < 0 ? 'stock-zero' : ''}">${sisaStok}</span></div>
      <div class="summary-row"><span>Status awal</span><span>${chip('pending')}</span></div>
    `;
  }

  async function saveBuy(events_data) {
    ['e-buyer','e-event','e-jumlah','e-global'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });

    const buyerId = Number(document.getElementById('f-buyer').value);
    const eventId = Number(document.getElementById('f-event').value);
    const jumlah  = Number(document.getElementById('f-jumlah').value);

    let valid = true;
    if (!buyerId) { document.getElementById('e-buyer').textContent = 'Pembeli wajib dipilih'; valid = false; }
    if (!eventId) { document.getElementById('e-event').textContent = 'Event wajib dipilih'; valid = false; }
    if (!jumlah || jumlah < 1) { document.getElementById('e-jumlah').textContent = 'Jumlah minimal 1'; valid = false; }

    const event = events_data.find(e => e.id === eventId);
    if (event && jumlah > event.stok) {
      document.getElementById('e-jumlah').textContent = `Melebihi stok. Stok tersedia: ${event.stok}`;
      valid = false;
    }
    if (!valid) return;

    try {
      await API.post('/orders', { pembeli_id: buyerId, event_id: eventId, jumlah });
      renderList();
    } catch (e) {
      document.getElementById('e-global').textContent = e.message;
    }
  }

  /* ── Form Ubah Pesanan ────────────────────────────────────────────────── */
  async function renderFormEdit(id) {
    const main = document.getElementById('main-content');

    let order, event_data;
    try {
      order = await API.get(`/orders/${id}`);
      event_data = await API.get(`/events/${order.event_id}`);
    } catch (e) { alert(e.message); return; }

    const isBatal = order.status === 'batal';

    main.innerHTML = `
      <span class="back-link" id="back-link">Daftar pesanan</span>
      <div class="page-header"><h1 class="page-title">Ubah pesanan #${id}</h1></div>
      <div class="form-row">
        <div class="card">
          <div class="field-group">
            <label>Pembeli</label>
            <input type="text" value="${order.pembeli_nama}" disabled />
          </div>
          <div class="field-group">
            <label>Event</label>
            <input type="text" value="${order.event_nama}" disabled />
          </div>
          <div class="field-group">
            <label for="f-jumlah">Jumlah tiket</label>
            <input id="f-jumlah" type="number" min="1"
              value="${order.jumlah}"
              ${isBatal ? 'disabled' : ''} />
            ${isBatal ? '<span class="field-hint">Jumlah tidak dapat diubah saat status batal.</span>' : ''}
            <span class="field-error" id="e-jumlah"></span>
          </div>
          <div class="field-group">
            <label>Status</label>
            <div class="radio-group">
              ${['pending','lunas','batal'].map(s => `
                <label>
                  <input type="radio" name="status" value="${s}" ${order.status === s ? 'checked' : ''} />
                  ${s}
                </label>`).join('')}
            </div>
            <span class="field-error" id="e-status"></span>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" id="btn-save">Simpan perubahan</button>
            <button class="btn btn-secondary" id="btn-cancel">Batal</button>
          </div>
          <span class="field-error" id="e-global" style="margin-top:8px;display:block"></span>
        </div>

        <!-- Impact summary -->
        <div class="card" id="summary-card">
          <h2 class="section-title">Ringkasan dampak</h2>
          ${renderImpactSummary(order, event_data)}
        </div>
      </div>
    `;

    document.getElementById('back-link').addEventListener('click', () => renderList());
    document.getElementById('btn-cancel').addEventListener('click', () => renderList());
    document.getElementById('btn-save').addEventListener('click', () => saveEdit(id, order, event_data));

    const jumlahEl = document.getElementById('f-jumlah');
    const radios = document.querySelectorAll('input[name="status"]');
    const updateImpact = () => {
      document.getElementById('summary-card').innerHTML =
        '<h2 class="section-title">Ringkasan dampak</h2>' +
        renderImpactSummary(order, event_data, Number(jumlahEl.value), getStatus());
    };
    if (!isBatal) jumlahEl.addEventListener('input', updateImpact);
    radios.forEach(r => r.addEventListener('change', updateImpact));
  }

  function getStatus() {
    const checked = document.querySelector('input[name="status"]:checked');
    return checked ? checked.value : 'pending';
  }

  function renderImpactSummary(order, event_data, newJumlah, newStatus) {
    newJumlah  = newJumlah  ?? order.jumlah;
    newStatus  = newStatus  ?? order.status;
    const harga = event_data.harga;
    const oldJ  = order.jumlah;
    const oldS  = order.status;

    // Stok change
    let stockDelta = 0;
    if (oldS === 'batal' && newStatus !== 'batal') {
      stockDelta = -newJumlah;
    } else if (oldS !== 'batal' && newStatus === 'batal') {
      stockDelta = +oldJ;
    } else if (oldS !== 'batal' && newStatus !== 'batal') {
      stockDelta = -(newJumlah - oldJ);
    }

    const stokSetelah = event_data.stok + stockDelta;
    const totalBaru   = newStatus === 'batal' ? 0 : newJumlah * harga;

    const deltaStr = stockDelta === 0 ? '±0' : (stockDelta > 0 ? `+${stockDelta}` : `${stockDelta}`);

    return `
      <div class="summary-row"><span>Jumlah lama</span><span class="mono">${oldJ}</span></div>
      <div class="summary-row"><span>Jumlah baru</span><span class="mono">${newJumlah}</span></div>
      <div class="summary-row"><span>Perubahan stok</span><span class="mono">${deltaStr}</span></div>
      <div class="summary-row"><span>Stok event setelah</span><span class="mono ${stokSetelah < 0 ? 'stock-zero':''}">${stokSetelah}</span></div>
      <div class="summary-row"><span>Total harga baru</span><span class="mono">${fmt_rupiah(totalBaru)}</span></div>
      <p class="note" style="margin-top:12px">
        Status <em>batal</em> mengembalikan stok. Reaktivasi dari batal mengurangi stok.
        Perpindahan pending &harr; lunas tidak mengubah stok.
      </p>`;
  }

  async function saveEdit(id, order, event_data) {
    ['e-jumlah','e-status','e-global'].forEach(eid => {
      const el = document.getElementById(eid);
      if (el) el.textContent = '';
    });

    const jumlah = Number(document.getElementById('f-jumlah').value);
    const status = getStatus();

    let valid = true;
    if (!jumlah || jumlah < 1) { document.getElementById('e-jumlah').textContent = 'Jumlah minimal 1'; valid = false; }
    if (!status) { document.getElementById('e-status').textContent = 'Status wajib dipilih'; valid = false; }
    if (!valid) return;

    const body = {};
    if (jumlah !== order.jumlah) body.jumlah = jumlah;
    if (status !== order.status) body.status = status;

    try {
      await API.put(`/orders/${id}`, body);
      renderList();
    } catch (e) {
      document.getElementById('e-global').textContent = e.message;
    }
  }

  return { renderList };
})();
