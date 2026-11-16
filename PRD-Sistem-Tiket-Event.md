# PRD: Sistem Tiket Event

## 1. Problem

Pengelolaan penjualan tiket pada event berskala kecil atau komunitas sering masih dilakukan secara manual melalui chat dan spreadsheet, sehingga data event, pembeli, dan pesanan tersebar dan mudah tidak sinkron. Akibatnya, stok tiket kerap salah hitung, satu pembeli bisa tercatat ganda, dan perubahan atau pembatalan pesanan tidak langsung memperbarui sisa tiket. Masalah ini penting diselesaikan karena kesalahan stok berujung pada tiket yang terjual melebihi kapasitas atau tiket yang sebenarnya tersedia tetapi dianggap habis, yang merugikan panitia maupun pembeli. Solusinya adalah web app sederhana dengan backend yang menyimpan data event, pembeli, dan pesanan secara terstruktur, serta mengurangi dan mengembalikan stok tiket secara otomatis setiap kali pesanan dibuat, diubah, atau dibatalkan, dengan frontend untuk mengelola ketiganya dalam satu tempat.

## 2. Ruang Lingkup

Aplikasi ini hanya untuk penggunaan internal kami sendiri (bukan publik), sehingga tidak ada login, pembayaran asli, atau fitur lain di luar daftar fitur pada bagian 5.

## 3. Syarat Aplikasi

| Syarat | Pemenuhan |
|---|---|
| CRUD untuk tiap entitas | Event, Pembeli, dan Pesanan masing-masing punya Create, Read, Update, Delete |
| Minimal 3 entitas | 3 entitas: Event, Pembeli, Pesanan |
| Tanpa database | Data disimpan hardcoded di memori backend (dict/list Python). Data awal (seed) berupa contoh data, dan kembali ke data awal saat server restart |
| Frontend dan backend | Backend: Python FastAPI (REST API). Frontend: HTML, CSS, JavaScript yang memanggil API |
| Tabel fitur | Lihat bagian 5 |
| Fitur melibatkan 2 entitas atau lebih di backend | Beli tiket, Ubah pesanan, dan Hapus pesanan (melibatkan Pesanan, Event, dan Pembeli) |
| Sketsa frontend | Dibuat terpisah dari PRD ini (menyusul), daftar halaman ada di bagian 7 |

## 4. Entitas dan Data

### Event
| Field | Tipe | Keterangan |
|---|---|---|
| id | integer | Dibuat otomatis |
| nama | string | Wajib |
| tanggal | date (YYYY-MM-DD) | Wajib |
| lokasi | string | Wajib |
| harga | integer | Harga per tiket, minimal 0 |
| stok | integer | Sisa tiket tersedia, minimal 0 |

### Pembeli
| Field | Tipe | Keterangan |
|---|---|---|
| id | integer | Dibuat otomatis |
| nama | string | Wajib |
| email | string | Wajib, format email valid |

### Pesanan
| Field | Tipe | Keterangan |
|---|---|---|
| id | integer | Dibuat otomatis |
| pembeli_id | integer | Referensi ke Pembeli |
| event_id | integer | Referensi ke Event |
| jumlah | integer | Jumlah tiket, minimal 1 |
| status | string | `pending`, `lunas`, atau `batal` (default saat dibuat: `pending`) |
| total_harga | integer | Dihitung otomatis oleh backend: jumlah x harga event |

Relasi: satu Pembeli dapat memiliki banyak Pesanan, dan satu Event dapat memiliki banyak Pesanan.

## 5. Tabel Fitur

| No | Feature | Description | Entity involved |
|---|---|---|---|
| 1 | Tambah event | Menambah event baru (nama, tanggal, lokasi, harga, stok tiket) | Event |
| 2 | Lihat daftar dan detail event | Menampilkan semua event dan detail satu event | Event |
| 3 | Ubah data event | Mengubah nama, tanggal, lokasi, harga, atau stok event | Event |
| 4 | Hapus event | Menghapus event. Ditolak jika event masih memiliki pesanan | Event, Pesanan |
| 5 | Tambah pembeli | Menambah pembeli baru (nama, email) | Pembeli |
| 6 | Lihat daftar dan detail pembeli | Menampilkan semua pembeli dan detail satu pembeli | Pembeli |
| 7 | Ubah data pembeli | Mengubah nama atau email pembeli | Pembeli |
| 8 | Hapus pembeli | Menghapus pembeli. Ditolak jika pembeli masih memiliki pesanan | Pembeli, Pesanan |
| 9 | Beli tiket | Memilih pembeli, event, dan jumlah. Pesanan dibuat dengan status `pending`, total harga dihitung otomatis, dan stok event berkurang sebanyak jumlah. Ditolak jika stok kurang | Pesanan, Pembeli, Event |
| 10 | Lihat daftar pesanan | Menampilkan semua pesanan, dapat difilter per pembeli atau per event | Pesanan, Pembeli, Event |
| 11 | Ubah pesanan | Mengubah jumlah tiket atau status (`pending`, `lunas`, `batal`). Stok event menyesuaikan sesuai aturan pada bagian 6 | Pesanan, Event |
| 12 | Batalkan/hapus pesanan | Menghapus pesanan. Stok tiket dikembalikan ke event | Pesanan, Event |

## 6. Aturan Bisnis

**Validasi umum**
- Semua field wajib diisi. `jumlah` bilangan bulat minimal 1, `harga` dan `stok` bilangan bulat minimal 0, `email` berformat valid.
- Referensi `pembeli_id` dan `event_id` pada pesanan harus menunjuk data yang ada.

**Stok (fitur 9, 11, 12)**
- Beli tiket: ditolak jika `jumlah` lebih besar dari stok event. Jika berhasil, stok berkurang sebanyak `jumlah`.
- Ubah jumlah pada pesanan aktif (`pending` atau `lunas`): stok disesuaikan sebesar selisih (jumlah baru dikurangi jumlah lama). Ditolak jika selisih penambahan melebihi stok tersedia. `total_harga` dihitung ulang.
- Ubah status ke `batal`: stok dikembalikan sebanyak `jumlah`.
- Ubah status dari `batal` ke `pending` atau `lunas`: stok dikurangi sebanyak `jumlah`. Ditolak jika stok kurang.
- Perpindahan antara `pending` dan `lunas` tidak mengubah stok.
- Jumlah pada pesanan berstatus `batal` tidak dapat diubah.
- Hapus pesanan: jika status bukan `batal`, stok dikembalikan sebanyak `jumlah`. Jika sudah `batal`, stok tidak berubah (sudah dikembalikan sebelumnya).

**Penghapusan berelasi (fitur 4 dan 8)**
- Event atau pembeli yang masih memiliki pesanan (apa pun statusnya) tidak dapat dihapus. Backend mengembalikan pesan error.

## 7. Arsitektur dan Halaman

**Backend (FastAPI)**: endpoint REST per entitas, data disimpan di dict Python.

| Entitas | Endpoint |
|---|---|
| Event | `GET /events`, `GET /events/{id}`, `POST /events`, `PUT /events/{id}`, `DELETE /events/{id}` |
| Pembeli | `GET /buyers`, `GET /buyers/{id}`, `POST /buyers`, `PUT /buyers/{id}`, `DELETE /buyers/{id}` |
| Pesanan | `GET /orders` (filter: `?buyer_id=` atau `?event_id=`), `GET /orders/{id}`, `POST /orders`, `PUT /orders/{id}`, `DELETE /orders/{id}` |

**Frontend (HTML, CSS, JavaScript)**: halaman yang perlu disketsa (sketsa dibuat terpisah, menyusul):
1. Daftar event (+ tombol tambah, ubah, hapus)
2. Form tambah/ubah event dan detail event
3. Daftar pembeli (+ tombol tambah, ubah, hapus)
4. Form tambah/ubah pembeli dan detail pembeli
5. Daftar pesanan dengan filter per pembeli atau per event
6. Form beli tiket (pilih pembeli, event, jumlah) dan form ubah pesanan (jumlah, status)
