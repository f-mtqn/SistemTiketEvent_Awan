/* buyers.js — Pembeli pages */

const Buyers = (() => {

  /* ── List ─────────────────────────────────────────────────────────────── */
  async function renderList() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Pembeli</h1>
          <p class="page-subtitle">Daftar semua pembeli terdaftar</p>
        </div>
        <button class="btn btn-primary" id="btn-add-buyer">Tambah pembeli</button>
      </div>
      <div id="buyers-table-wrap"></div>
      <p class="note">Pembeli yang masih memiliki pesanan tidak dapat dihapus.</p>
    `;

    document.getElementById('btn-add-buyer').addEventListener('click', () => renderForm(null));
    await loadTable();
  }

  async function loadTable() {
    const wrap = document.getElementById('buyers-table-wrap');
    wrap.innerHTML = '<p style="color:var(--slate);font-size:.9rem">Memuat...</p>';
    let data;
    try { data = await API.get('/buyers'); }
    catch (e) { wrap.innerHTML = `<p class="note note-danger">Gagal memuat: ${e.message}</p>`; return; }

    if (data.length === 0) {
      wrap.innerHTML = `<div class="table-wrap"><table><tbody><tr><td class="table-empty">Belum ada data</td></tr></tbody></table></div>`;
      return;
    }

    const rows = data.map(b => {
      const canDel = b.jumlah_pesanan === 0;
      return `<tr>
        <td><span class="table-link" data-id="${b.id}">${b.nama}</span></td>
        <td>${b.email}</td>
        <td class="num">${b.jumlah_pesanan}</td>
        <td class="actions">
          <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${b.id}">Ubah</button>
          <button class="btn btn-danger btn-sm" data-action="del" data-id="${b.id}"
            ${canDel ? '' : 'disabled title="Masih ada pesanan"'}>Hapus</button>
        </td>
      </tr>`;
    }).join('');

    wrap.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nama</th><th>Email</th><th class="num">Pesanan</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    wrap.querySelectorAll('.table-link').forEach(el =>
      el.addEventListener('click', () => renderForm(Number(el.dataset.id))));
    wrap.querySelectorAll('[data-action="edit"]').forEach(el =>
      el.addEventListener('click', () => renderForm(Number(el.dataset.id))));
    wrap.querySelectorAll('[data-action="del"]').forEach(el =>
      el.addEventListener('click', () => delBuyer(Number(el.dataset.id))));
  }

  async function delBuyer(id) {
    if (!confirm_del('Hapus pembeli ini?')) return;
    try {
      await API.del(`/buyers/${id}`);
      await loadTable();
    } catch (e) {
      alert(e.message);
    }
  }

  /* ── Form / Detail ────────────────────────────────────────────────────── */
  async function renderForm(id) {
    const isNew = id === null;
    const main = document.getElementById('main-content');

    let buyer = null;
    if (!isNew) {
      try { buyer = await API.get(`/buyers/${id}`); }
      catch (e) { alert(e.message); return; }
    }

    const title = isNew ? 'Tambah pembeli' : 'Ubah pembeli';

    main.innerHTML = `
      <span class="back-link" id="back-link">Daftar pembeli</span>
      <div class="page-header"><h1 class="page-title">${title}</h1></div>
      <div class="form-row">
        <!-- Form card -->
        <div class="card">
          <div class="field-group">
            <label for="f-nama">Nama</label>
            <input id="f-nama" type="text" value="${buyer?.nama || ''}" />
            <span class="field-error" id="e-nama"></span>
          </div>
          <div class="field-group">
            <label for="f-email">Email</label>
            <input id="f-email" type="email" value="${buyer?.email || ''}" />
            <span class="field-error" id="e-email"></span>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" id="btn-save">Simpan</button>
            <button class="btn btn-secondary" id="btn-cancel">Batal</button>
          </div>
          <span class="field-error" id="e-global" style="margin-top:8px;display:block"></span>
        </div>

        <!-- Detail card -->
        ${isNew ? '' : renderDetailCard(buyer)}
      </div>
    `;

    document.getElementById('back-link').addEventListener('click', () => renderList());
    document.getElementById('btn-cancel').addEventListener('click', () => renderList());
    document.getElementById('btn-save').addEventListener('click', () => saveBuyer(id));

    if (!isNew) {
      const btnDel = document.getElementById('btn-del-buyer');
      if (btnDel) btnDel.addEventListener('click', () => delBuyerFromDetail(id));
    }
  }

  function renderDetailCard(buyer) {
    const pesananRows = (buyer.pesanan || []).map(o =>
      `<tr>
        <td>${o.event_nama}</td>
        <td class="num">${o.jumlah}</td>
        <td>${chip(o.status)}</td>
        <td class="num">${fmt_rupiah(o.total_harga)}</td>
      </tr>`
    ).join('') || `<tr><td colspan="4" class="table-empty">Tidak ada pesanan</td></tr>`;

    const canDel = (buyer.pesanan || []).length === 0;
    const pesananCount = (buyer.pesanan || []).length;

    return `
      <div class="card">
        <h2 class="section-title">Detail pembeli</h2>
        <div class="detail-list">
          <div class="detail-item"><span class="detail-label">Nama</span><span class="detail-value">${buyer.nama}</span></div>
          <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${buyer.email}</span></div>
        </div>
        <h2 class="section-title" style="margin-top:20px">Riwayat pesanan</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Event</th><th class="num">Jumlah</th><th>Status</th><th class="num">Total</th></tr></thead>
            <tbody>${pesananRows}</tbody>
          </table>
        </div>
        <div style="margin-top:20px">
          <button class="btn btn-danger" id="btn-del-buyer" ${canDel ? '' : 'disabled'}>Hapus pembeli</button>
          ${!canDel ? `<p class="note note-danger" style="margin-top:8px">Pembeli ini masih punya ${pesananCount} pesanan, jadi belum bisa dihapus.</p>` : ''}
        </div>
      </div>`;
  }

  function clearErrors() {
    ['e-nama','e-email','e-global'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
  }

  async function saveBuyer(id) {
    clearErrors();
    const nama  = document.getElementById('f-nama').value.trim();
    const email = document.getElementById('f-email').value.trim();

    let valid = true;
    if (!nama) { document.getElementById('e-nama').textContent = 'Nama wajib diisi'; valid = false; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRe.test(email)) { document.getElementById('e-email').textContent = 'Email tidak valid'; valid = false; }
    if (!valid) return;

    const body = { nama, email };
    try {
      if (id === null) await API.post('/buyers', body);
      else             await API.put(`/buyers/${id}`, body);
      renderList();
    } catch (e) {
      document.getElementById('e-global').textContent = e.message;
    }
  }

  async function delBuyerFromDetail(id) {
    if (!confirm_del('Hapus pembeli ini?')) return;
    try {
      await API.del(`/buyers/${id}`);
      renderList();
    } catch (e) {
      alert(e.message);
    }
  }

  return { renderList };
})();
