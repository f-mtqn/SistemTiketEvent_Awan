/* api.js — thin fetch wrapper */
const API = (() => {
  const BASE = '';

  async function request(method, path, body) {
    const opts = {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        msg = data.detail || JSON.stringify(data);
      } catch (_) {}
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  return {
    get: (path)         => request('GET', path),
    post: (path, body)  => request('POST', path, body),
    put: (path, body)   => request('PUT', path, body),
    del: (path)         => request('DELETE', path),
  };
})();

/* Helpers */
function fmt_rupiah(n) {
  if (n === 0) return 'Gratis';
  return 'Rp\u202f' + Number(n).toLocaleString('id-ID');
}

function chip(status) {
  const cls = { pending: 'chip-pending', lunas: 'chip-lunas', batal: 'chip-batal' }[status] || '';
  return `<span class="chip ${cls}">${status}</span>`;
}

function confirm_del(msg) {
  return window.confirm(msg);
}
