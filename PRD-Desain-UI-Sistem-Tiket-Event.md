# PRD Desain UI: Sistem Tiket Event

Dokumen ini melengkapi `PRD-Sistem-Tiket-Event.md` dan hanya membahas tampilan frontend (HTML, CSS, JavaScript). Fitur, entitas, dan aturan bisnis mengikuti PRD utama. Sketsa/wireframe dibuat terpisah setelah dokumen ini disepakati.

## 1. Tujuan Desain

Aplikasi dipakai internal oleh kelompok sendiri, jadi desain dibuat **jelas, rapi, dan cepat dipakai**, bukan untuk menarik pengunjung baru. Tidak ada landing page, hero, ilustrasi dekoratif, atau animasi berlebihan.

## 2. Prinsip Desain (anti "AI slop")

1. **Satu sistem desain.** Semua halaman memakai palet, font, jarak, dan komponen yang sama (bagian 3 sampai 5). Tidak ada gaya baru per halaman.
2. **Isi nyata, bukan hiasan.** Tampilan hanya berisi data dan kontrol yang ada di PRD utama. Tidak ada statistik, grafik, atau kartu ringkasan yang tidak diminta.
3. **Warna punya fungsi.** Amber hanya untuk aksi utama dan penanda aktif, rust hanya untuk bahaya/stok habis/status batal, navy dan slate untuk struktur dan teks. Tidak ada gradien, bayangan tebal, atau efek kaca.
4. **Tidak bergantung pada warna saja.** Status selalu ditulis dengan teks (`pending`, `lunas`, `batal`), tidak hanya dibedakan lewat warna.
5. **Tanpa emoji dan tanpa ikon dekoratif.** Tombol memakai teks yang jelas ("Tambah event", "Simpan perubahan", "Hapus").
6. **Pola berulang yang konsisten.** Daftar selalu berbentuk tabel, form selalu satu kolom dengan label di atas input, pesan error selalu di bawah field terkait.

Catatan: repo `taste-skill` yang kamu sebut dirancang untuk website perusahaan/landing page (foto, hero, efek shader), sehingga tidak cocok untuk aplikasi CRUD internal. Yang dipakai dari pendekatannya hanya prinsip di atas (satu sistem desain, tanpa hiasan, konten nyata).

## 3. Palet Warna

| Nama | Hex | Pemakaian |
|---|---|---|
| Cream | `#EEE9DF` | Latar halaman, latar header tabel |
| Sand | `#C9C1B1` | Garis pembatas tabel dan kartu, teks menu non-aktif di sidebar |
| Slate | `#2C3B4D` | Teks sekunder, border input dan tombol sekunder, menu aktif di sidebar, status `lunas` |
| Amber | `#FFB162` | Tombol aksi utama, penanda menu aktif, status `pending` |
| Rust | `#A35139` | Tombol hapus, pesan error, stok 0, status `batal` |
| Navy | `#1B2632` | Teks utama, latar sidebar |

Turunan tambahan (hanya dua, agar tetap satu palet):
- Permukaan kartu dan tabel: `#F7F4ED` (cream lebih terang)
- Latar input: `#FBF9F5`

Pasangan warna teks yang dipakai (semua lolos kontras WCAG AA 4.5:1):
- Navy di atas Cream, Navy di atas Amber
- Cream di atas Slate, Cream di atas Navy
- Cream di atas Rust (tombol/chip), Rust di atas Cream atau permukaan kartu

Aturan fokus: garis fokus tebal (3px) berwarna Slate, dan Amber khusus di atas sidebar Navy.

## 4. Tipografi

| Peran | Font | Ukuran/bobot |
|---|---|---|
| Judul halaman, judul kartu | Space Grotesk | 34px / 600 dan 20px / 600 |
| Teks isi, label, tabel | IBM Plex Sans | 15 sampai 16px / 400 sampai 600 |
| Angka (harga, stok, jumlah, total, ID) | IBM Plex Mono | 15px / 500, rata kanan, angka sejajar |

Semua font dimuat dari Google Fonts. Label kolom tabel memakai huruf kapital kecil (12px, 600, jarak antar huruf renggang).

## 5. Komponen

**Tata letak umum:** sidebar Navy di kiri (lebar 240px) berisi nama aplikasi dan tiga menu (Event, Pembeli, Pesanan), konten di kanan di atas latar Cream. Pada layar sempit sidebar berada di atas konten.

| Komponen | Spesifikasi |
|---|---|
| Tombol utama | Latar Amber, teks Navy, tebal 600, tinggi minimal 44px, sudut 8px. Satu per halaman (contoh: "Tambah event") |
| Tombol sekunder | Transparan, border Slate 1.5px, teks Navy ("Ubah", "Batal") |
| Tombol hapus | Transparan, border dan teks Rust ("Hapus") |
| Tombol nonaktif | Redup, kursor tidak boleh diklik, dipakai saat event/pembeli tidak bisa dihapus |
| Kartu | Latar `#F7F4ED`, border Sand 1px, sudut 12px |
| Tabel | Header Cream dengan garis Sand, baris dipisah garis Sand, dibungkus kotak yang bisa digeser horizontal di layar sempit |
| Input, select | Tinggi minimal 48px, border Slate 1.5px, sudut 8px, latar `#FBF9F5`, label di atas field |
| Chip status | `pending`: latar Amber, teks Navy. `lunas`: latar Slate, teks Cream. `batal`: latar Rust, teks Cream |
| Pesan error | Teks Rust di bawah field yang bermasalah |
| Tautan nama (di tabel) | Teks Navy tebal, garis bawah Sand, mengarah ke halaman form/detail |

## 6. Rancangan Halaman

Enam halaman mengikuti PRD utama bagian 7. Semua memakai tata letak umum bagian 5.

### 6.1 Daftar Event
- Header: judul "Event", subjudul singkat, tombol utama "Tambah event" di kanan.
- Tabel kolom: Nama event, Tanggal, Lokasi, Harga, Stok, Aksi (Ubah, Hapus).
- Harga dan Stok rata kanan memakai font angka. Stok 0 ditulis tebal berwarna Rust.
- Catatan di bawah tabel: event yang masih punya pesanan tidak bisa dihapus.
- Hapus event yang punya pesanan menampilkan pesan error dari backend.

### 6.2 Form Tambah/Ubah Event dan Detail Event
- Tautan kembali "Daftar event" dan judul ("Tambah event" atau "Ubah event").
- Dua kolom (menumpuk di layar sempit):
  - Kiri, kartu form: Nama event, Tanggal, Lokasi, Harga per tiket, Stok tiket. Tombol "Simpan" (utama) dan "Batal" (sekunder).
  - Kanan, kartu detail: Tanggal, Lokasi, Harga, Stok tersisa, daftar pesanan terkait (pembeli, jumlah, chip status), dan tombol "Hapus event".
- Jika event punya pesanan, tombol "Hapus event" nonaktif disertai keterangan "Event ini masih punya N pesanan, jadi belum bisa dihapus."
- Saat mode tambah, kartu detail disembunyikan.

### 6.3 Daftar Pembeli
- Header: judul "Pembeli", tombol utama "Tambah pembeli".
- Tabel kolom: Nama, Email, Jumlah pesanan, Aksi (Ubah, Hapus).
- Tombol "Hapus" nonaktif pada pembeli yang masih punya pesanan. Catatan di bawah tabel menjelaskan aturannya.

### 6.4 Form Tambah/Ubah Pembeli dan Detail Pembeli
- Struktur sama dengan 6.2.
- Kartu form: Nama, Email. Kartu detail: email, riwayat pesanan (event, jumlah, chip status, total harga), dan tombol "Hapus pembeli" dengan aturan nonaktif yang sama.

### 6.5 Daftar Pesanan
- Header: judul "Pesanan", tombol utama "Beli tiket".
- Baris filter di atas tabel: pilihan Pembeli ("Semua pembeli" sebagai default), pilihan Event ("Semua event" sebagai default), dan tombol "Reset".
- Tabel kolom: ID, Pembeli, Event, Jumlah, Total harga, Status (chip), Aksi (Ubah, Hapus).
- Jumlah dan Total harga rata kanan memakai font angka.

### 6.6 Form Beli Tiket dan Form Ubah Pesanan
Dua form di satu halaman PRD, dibuat sebagai dua tampilan dengan struktur yang sama (kartu form di kiri, kartu ringkasan di kanan).

**Beli tiket**
- Form: Pembeli (pilihan), Event (pilihan), Jumlah. Keterangan di bawah Jumlah: batas maksimal sesuai stok tersedia.
- Ringkasan: harga per tiket, stok tersedia, total harga (dihitung otomatis), stok setelah pembelian, dan status awal `pending`.
- Pembelian melebihi stok menampilkan pesan error di bawah field Jumlah.

**Ubah pesanan**
- Pembeli dan Event hanya ditampilkan (tidak bisa diubah). Yang bisa diubah: Jumlah dan Status (tiga pilihan radio: `pending`, `lunas`, `batal`).
- Ringkasan dampak: jumlah lama dan baru, perubahan stok event, total harga baru.
- Keterangan aturan stok: status `batal` mengembalikan stok, dari `batal` ke `pending`/`lunas` mengurangi stok lagi, jumlah pesanan `batal` tidak bisa diubah (field Jumlah nonaktif).

## 7. Perilaku Antarmuka

- Data diambil dari backend lewat `fetch` ke endpoint di PRD utama, lalu tabel digambar ulang tanpa memuat ulang halaman.
- Hapus selalu meminta konfirmasi singkat ("Hapus event ini?") sebelum request dikirim.
- Error dari backend (stok kurang, data masih berelasi, field tidak valid) ditampilkan sebagai teks Rust di dekat bagian yang bermasalah, bukan `alert`.
- Setelah simpan berhasil, pengguna kembali ke halaman daftar yang bersangkutan.
- Tabel kosong menampilkan satu baris teks "Belum ada data" dan tombol tambah tetap tersedia.

## 8. Aksesibilitas dan Responsif

- Semua kontrol memakai elemen asli (`button`, `a`, `input`, `select`, `label`), target sentuh minimal 44px.
- Menu aktif ditandai dengan teks dan warna (`aria-current="page"`).
- Layar sempit: sidebar menumpuk di atas, form dan detail menjadi satu kolom, tabel digeser horizontal.
- Fokus keyboard selalu terlihat (bagian 3).

## 9. Di Luar Lingkup

Mode gelap, animasi, grafik/dashboard, login, notifikasi, dan fitur lain yang tidak ada di PRD utama.
