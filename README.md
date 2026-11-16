# Sistem Tiket Event

Web app sederhana untuk mengelola penjualan tiket event (FastAPI + HTML/CSS/JS).

## Struktur Project

```
Tiket/
├── backend/
│   ├── main.py          # FastAPI app + semua endpoint
│   └── requirements.txt
├── frontend/
│   ├── index.html       # Shell HTML + sidebar
│   └── static/
│       ├── style.css    # Design system (cream/amber/rust/navy)
│       ├── api.js       # Thin fetch wrapper
│       ├── events.js    # Halaman Event (list + form + detail)
│       ├── buyers.js    # Halaman Pembeli (list + form + detail)
│       ├── orders.js    # Halaman Pesanan (list + beli + ubah)
│       └── app.js       # Router / navigasi sidebar
└── run.bat              # Script jalankan server (Windows)
```

## Cara Menjalankan

### 1. Install dependencies (sekali saja)
```bash
pip install -r backend/requirements.txt
```

### 2. Jalankan server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --app-dir backend
```
Atau double-click **`run.bat`**.

### 3. Buka browser
```
http://localhost:8000
```

> Data kembali ke seed awal setiap kali server di-restart (tidak ada database).

## Entitas & Endpoint

| Entitas  | Endpoint |
|----------|----------|
| Event    | `GET/POST /events`, `GET/PUT/DELETE /events/{id}` |
| Pembeli  | `GET/POST /buyers`, `GET/PUT/DELETE /buyers/{id}` |
| Pesanan  | `GET /orders[?buyer_id=&event_id=]`, `POST /orders`, `GET/PUT/DELETE /orders/{id}` |

Docs interaktif: http://localhost:8000/docs

## Fitur

| No | Fitur | Entitas |
|----|-------|---------|
| 1 | Tambah event | Event |
| 2 | Lihat daftar & detail event | Event |
| 3 | Ubah data event | Event |
| 4 | Hapus event (ditolak jika ada pesanan) | Event, Pesanan |
| 5 | Tambah pembeli | Pembeli |
| 6 | Lihat daftar & detail pembeli | Pembeli |
| 7 | Ubah data pembeli | Pembeli |
| 8 | Hapus pembeli (ditolak jika ada pesanan) | Pembeli, Pesanan |
| 9 | Beli tiket (stok otomatis berkurang) | Pesanan, Pembeli, Event |
| 10 | Lihat daftar pesanan (filter per pembeli/event) | Pesanan, Pembeli, Event |
| 11 | Ubah pesanan (jumlah/status, stok menyesuaikan) | Pesanan, Event |
| 12 | Hapus pesanan (stok dikembalikan) | Pesanan, Event |
