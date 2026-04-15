# Web Pemodelan Pasut

Website statis untuk membaca data pasut dari file **CSV / XLS / XLSX**, memilih **sensor**, memilih **rentang waktu**, memilih **resolusi analisis** (**1 menit, 15 menit, 30 menit, 1 jam**), lalu menampilkan **plot observasi**, **model harmonik**, **observasi vs model**, **amplitudo komponen**, **residual**, dan mengekspor **report TXT**.

Project ini dibuat supaya alur analisis pasut yang sebelumnya dijalankan lewat script MATLAB bisa dipakai langsung di browser dan mudah di-hosting ke **GitHub Pages**.

---

## 1. Tujuan project

Website ini dibuat untuk kebutuhan pemodelan pasut dengan fokus pada hal-hal berikut:

- file data harus bisa terbaca dengan mudah
- nama stasiun harus terbaca dari file
- waktu pengamatan harus terbaca dan bisa dipilih sesuai rentang data yang tersedia
- sensor pada file harus terdeteksi otomatis
- data bisa diambil ulang sesuai resolusi yang dipilih pengguna
- hasil analisis bisa langsung divisualisasikan
- hasil bisa diunduh dalam bentuk laporan teks

Jadi, inti utama website ini adalah **membaca data dengan benar terlebih dahulu**, lalu memberi antarmuka yang simpel untuk preprocessing, pemilihan resolusi, pemilihan sensor, pemodelan harmonik, dan ekspor hasil.

---

## 2. Fitur utama

### Input data
- Upload file lokal dengan format `.csv`, `.xls`, atau `.xlsx`
- Membaca **nama stasiun** dari baris pertama file
- Membaca **header kolom** dari baris kedua file
- Membaca data mulai baris ketiga
- Deteksi otomatis kolom waktu dan sensor

### Pemilihan parameter analisis
- Pilih sensor yang tersedia pada file
- Pilih **start date** dan **end date**
- Pilih resolusi analisis:
  - 1 menit
  - 15 menit
  - 30 menit
  - 1 jam
- Atur batas gap yang boleh diinterpolasi

### Proses data
- Membersihkan nilai kosong / tidak valid
- Mengurutkan data berdasarkan waktu
- Menghapus duplikat waktu
- Menyusun grid waktu reguler
- Mengisi gap pendek dengan interpolasi linear
- Resampling data ke resolusi yang dipilih
- Melakukan pemodelan harmonik pasut dengan pendekatan least squares
- Merekonstruksi sinyal pasut model

### Output
- Plot observasi
- Plot model harmonik
- Plot observasi vs model
- Plot amplitudo komponen pasut
- Plot residual
- Ekspor file `report.txt`
- Ekspor file `observasi_vs_model.txt`

---

## 3. Struktur file project

```text
pasut-web/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── style.css
    └── js/
        ├── app.js
        ├── parser.js
        └── tide.js
```

### Penjelasan tiap file

#### `index.html`
Halaman utama website. Berisi:
- judul aplikasi
- area upload file
- form pilihan sensor, tanggal, resolusi, dan parameter lain
- area grafik
- tombol ekspor hasil

#### `assets/css/style.css`
Mengatur tampilan website, seperti:
- layout halaman
- style form input
- style tombol
- kartu ringkasan
- tampilan area grafik

#### `assets/js/parser.js`
Mengurus pembacaan file input:
- membaca CSV
- membaca Excel
- mengekstrak nama stasiun
- mengekstrak header
- mengidentifikasi kolom waktu
- mengidentifikasi kolom sensor
- mengubah isi file menjadi objek data yang siap diproses

#### `assets/js/tide.js`
Berisi logika analisis pasut:
- preprocessing data
- grid waktu reguler
- deteksi gap
- interpolasi gap pendek
- resampling berdasarkan resolusi
- least squares harmonik
- rekonstruksi model
- pembuatan ringkasan hasil

#### `assets/js/app.js`
Menghubungkan semuanya ke antarmuka web:
- menangani upload file
- mengisi opsi sensor otomatis
- mengisi batas tanggal otomatis
- membaca input user
- menjalankan proses analisis
- menampilkan grafik
- menyiapkan file unduhan report

---

## 4. Format data yang didukung

Aplikasi ini dirancang mengikuti format data IOC / tide gauge seperti contoh kamu.

### Format umum file
- **Baris 1**: nama stasiun
- **Baris 2**: header kolom
- **Baris 3 dan seterusnya**: data observasi

### Contoh

```text
Tide gauge at Sabang
Time (UTC), bat(V), prs(m), ra2(m), rad(m), ras(m)
3/1/2026 0:00, 123, 3.16, 8.122, 8.099,
3/1/2026 0:01, 123, 3.162, 8.125, 8.102,
3/1/2026 0:02, , 3.166, 8.128, 8.105,
...
```

### Aturan pembacaan file
- Kolom pertama dianggap sebagai **waktu**
- Kolom seperti `prs(m)`, `ra2(m)`, `rad(m)`, `ras(m)` dianggap sebagai **sensor**
- Kolom `bat(V)` dikenali sebagai data baterai dan **tidak dipakai sebagai sensor analisis**
- Nilai kosong akan dianggap sebagai **missing value**
- Nama sensor akan disederhanakan dari header, misalnya:
  - `prs(m)` → `prs`
  - `ra2(m)` → `ra2`
  - `rad(m)` → `rad`
  - `ras(m)` → `ras`

### Catatan penting
Supaya pembacaan file stabil, usahakan:
- format waktu konsisten
- header ada di baris kedua
- tidak ada merge cell aneh pada file Excel
- satu sheet utama berisi data yang benar-benar akan diproses

---

## 5. Alur kerja analisis di website

Urutan proses di aplikasi adalah sebagai berikut:

1. User upload file data
2. Website membaca nama stasiun dan header
3. Website mendeteksi sensor yang tersedia
4. Website mendeteksi waktu minimum dan maksimum
5. User memilih:
   - sensor
   - start date
   - end date
   - resolusi
   - batas interpolasi gap
6. Data dibersihkan dan difilter sesuai rentang waktu
7. Dibentuk grid waktu reguler
8. Gap pendek diinterpolasi linear
9. Data di-resample ke resolusi yang dipilih
10. Dilakukan fitting harmonik dengan least squares
11. Dibentuk sinyal model / rekonstruksi
12. Hasil ditampilkan sebagai plot dan report

---

## 6. Ringkasan metode yang dipakai

Model harmonik yang dipakai secara umum berbentuk:

```text
h(t) = a0 + Σ [Ai cos(ωi t) + Bi sin(ωi t)]
```

Keterangan:
- `h(t)` = tinggi muka air pada waktu `t`
- `a0` = mean sea level / komponen rata-rata
- `Ai` dan `Bi` = koefisien harmonik
- `ωi` = frekuensi sudut tiap komponen

Dari hasil least squares, akan diperoleh:
- `a0`
- `Acos`
- `Bsin`
- amplitudo tiap komponen
- fase tiap komponen
- model pasut hasil rekonstruksi
- residual antara observasi dan model

### Komponen default
Komponen harmonik default yang digunakan saat ini:
- M2
- S2
- K1
- O1
- N2
- K2
- P1
- Q1

Komponen ini bisa diubah di file JavaScript jika nanti kamu ingin menambah atau mengurangi komponen.

---

## 7. Cara menjalankan project secara lokal

### Opsi 1 — paling cepat
Cocok untuk langsung mencoba.

1. Extract folder `pasut-web`
2. Buka file `index.html` di browser
3. Upload file data
4. Pilih sensor, rentang waktu, resolusi, dan parameter lain
5. Klik **Proses Data**
6. Lihat hasil plot dan unduh report

### Opsi 2 — pakai local server
Kadang lebih rapi, terutama kalau browser membatasi akses file tertentu.

Kalau kamu punya Python, buka terminal di folder project lalu jalankan:

```bash
python -m http.server 8000
```

Setelah itu buka:

```text
http://localhost:8000
```

---

## 8. Tutorial penggunaan website

### Langkah 1 — buka aplikasi
Buka `index.html` atau jalankan lewat local server.

### Langkah 2 — upload file
Klik tombol upload lalu pilih file CSV/XLSX berisi data pasut.

### Langkah 3 — cek data terbaca
Setelah file masuk, aplikasi akan menampilkan informasi awal seperti:
- nama stasiun
- jumlah data terbaca
- sensor yang tersedia
- rentang waktu data

### Langkah 4 — pilih sensor
Pilih salah satu sensor yang terdeteksi, misalnya:
- prs
- ra2
- rad
- ras

### Langkah 5 — pilih rentang waktu
Atur:
- tanggal mulai
- tanggal akhir

Rentang ini harus berada di dalam rentang data yang tersedia.

### Langkah 6 — pilih resolusi
Pilih resolusi yang diinginkan:
- **1 menit** untuk mempertahankan resolusi paling rapat
- **15 menit** untuk data yang lebih ringkas
- **30 menit** untuk peringkasan sedang
- **1 jam** untuk analisis hourly

### Langkah 7 — atur interpolasi gap
Masukkan batas gap pendek yang masih boleh diisi dengan interpolasi linear.

Contoh:
- kalau isi `15`, maka gap sampai 15 menit akan dicoba diinterpolasi
- gap yang lebih panjang akan tetap kosong

### Langkah 8 — proses data
Klik tombol **Proses Data**.

### Langkah 9 — baca hasil
Aplikasi akan menampilkan:
- observasi pasut
- model pasut hasil fitting
- perbandingan observasi dan model
- amplitudo komponen
- residual
- ringkasan statistik

### Langkah 10 — unduh report
Klik tombol unduh untuk menyimpan:
- `report.txt`
- `observasi_vs_model.txt`

---

## 9. Penjelasan output

### A. Plot Observasi
Menampilkan data pasang surut hasil pembacaan file setelah difilter dan disampling sesuai parameter pilihan user.

### B. Plot Model
Menampilkan sinyal pasut hasil rekonstruksi model harmonik.

### C. Plot Observasi vs Model
Menunjukkan seberapa dekat model mengikuti data observasi.

### D. Plot Amplitudo Komponen
Menampilkan besar amplitudo masing-masing komponen harmonik.

### E. Plot Residual
Residual = observasi - model. Plot ini penting untuk melihat bagian sinyal yang belum terjelaskan oleh model harmonik.

### F. `report.txt`
Berisi ringkasan seperti:
- nama stasiun
- sensor terpilih
- jumlah data mentah
- jumlah data valid
- rentang waktu analisis
- resolusi analisis
- jumlah gap
- jumlah titik interpolasi
- MSL / `a0`
- RMSE fitting
- RMSE evaluasi
- amplitudo dan fase tiap komponen

### G. `observasi_vs_model.txt`
Berisi tabel waktu dan nilai:
- waktu
- t_jam
- observasi
- model
- residual

---

## 10. Cara upload ke GitHub dan hosting di GitHub Pages

### Langkah 1 — buat repository baru
Buat repo baru di GitHub, misalnya:

```text
pasut-web
```

### Langkah 2 — upload semua isi folder
Upload semua file project ke branch `main`.

Kalau pakai Git dari terminal:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/pasut-web.git
git push -u origin main
```

Ganti `USERNAME` dengan username GitHub kamu.

### Langkah 3 — aktifkan GitHub Pages
Di repo GitHub:
1. buka **Settings**
2. pilih **Pages**
3. pada **Build and deployment** pilih:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/root`
4. klik **Save**

### Langkah 4 — tunggu deploy
Biasanya butuh 1–3 menit.

Setelah aktif, website akan tersedia di alamat seperti:

```text
https://username.github.io/pasut-web/
```

---

## 11. Cara update website setelah online

Kalau nanti kamu ingin mengganti script, tampilan, atau menambah fitur:

1. edit file di lokal
2. simpan perubahan
3. commit dan push ulang ke branch `main`
4. GitHub Pages akan update otomatis

Contoh:

```bash
git add .
git commit -m "Update parser dan README"
git push
```

---

## 12. Troubleshooting

### Masalah 1 — sensor tidak muncul
Kemungkinan penyebab:
- header tidak ada di baris kedua
- nama sensor tidak berada pada format kolom biasa
- file Excel punya sheet atau format yang aneh

Yang perlu dicek:
- pastikan baris 2 berisi header
- pastikan kolom sensor tidak merge
- pastikan nama kolom seperti `prs(m)`, `ra2(m)`, `rad(m)`, `ras(m)`

### Masalah 2 — waktu tidak terbaca
Kemungkinan penyebab:
- format tanggal tidak konsisten
- ada karakter tambahan di kolom waktu
- Excel menyimpan waktu dalam format campuran

Yang perlu dicek:
- pastikan kolom pertama benar-benar berisi tanggal dan jam
- pastikan tidak ada teks tambahan selain nilai waktu

### Masalah 3 — hasil plot kosong
Kemungkinan penyebab:
- rentang waktu yang dipilih tidak berisi data valid
- sensor yang dipilih banyak nilai kosong
- semua data pada rentang itu hilang setelah filtering

Solusi:
- perluas rentang waktu
- coba sensor lain
- cek file sumber

### Masalah 4 — hasil model jelek
Kemungkinan penyebab:
- data terlalu pendek
- data terlalu banyak gap
- resolusi terlalu kasar
- komponen harmonik kurang cocok

Solusi:
- gunakan data yang lebih panjang
- kurangi gap missing value
- coba resolusi berbeda
- sesuaikan komponen harmonik

### Masalah 5 — file Excel tidak terbaca sempurna
Solusi cepat:
- simpan ulang file sebagai `.csv`
- lalu upload CSV tersebut ke website

---

## 13. Kustomisasi yang bisa kamu lakukan nanti

Beberapa pengembangan yang mudah ditambahkan:

- tombol **pilih semua komponen** / **hapus semua komponen**
- pilihan komponen harmonik manual
- ekspor grafik ke PNG
- ekspor hasil ke CSV
- pilihan metode resampling:
  - exact
  - nearest
  - average
  - linear
- multi sheet Excel
- multi stasiun dalam satu workbook
- validasi kualitas data yang lebih detail
- statistik tambahan seperti MAE, R², atau persentase missing data
- mode tampilan yang lebih formal untuk keperluan tugas / laporan

---

## 14. Catatan teknis

- Website ini adalah **frontend-only application**
- Semua proses berjalan di browser pengguna
- File tidak perlu diunggah ke server eksternal
- Cocok untuk GitHub Pages karena tidak memerlukan backend
- Perhitungan numerik dilakukan dengan JavaScript di sisi client
- Untuk file Excel, aplikasi memakai library JavaScript pembaca workbook di browser

---

## 15. Saran penggunaan untuk tugasmu

Untuk kebutuhan tugas atau presentasi, alur paling aman adalah:

1. siapkan data mentah dengan format rapi
2. pastikan nama stasiun ada di baris pertama
3. pastikan header sensor ada di baris kedua
4. uji dulu file secara lokal
5. setelah parser sudah aman, baru upload ke GitHub Pages
6. pakai link GitHub Pages itu sebagai demo online

Kalau nanti ternyata ada perbedaan format file dari stasiun lain, biasanya cukup diperbaiki di bagian parser, bukan di semua script.

---

## 16. Roadmap pengembangan

Versi berikutnya bisa diarahkan menjadi:

### Versi 1
- baca file
- pilih sensor
- pilih waktu
- pilih resolusi
- tampilkan plot
- unduh report

### Versi 2
- pilihan komponen harmonik manual
- statistik evaluasi lebih lengkap
- export plot PNG
- layout lebih rapi

### Versi 3
- multi-file
- multi-station
- penyimpanan project / session
- report otomatis format lebih formal

---

## 17. Lisensi dan penggunaan

Project ini dibuat untuk kebutuhan pembelajaran, pengembangan tugas, dan demonstrasi analisis pasut berbasis web. Silakan modifikasi sesuai kebutuhan penelitian, praktikum, atau presentasi.

Kalau project ini nanti mau dipakai lebih luas, sebaiknya ditambahkan:
- file lisensi resmi
- catatan versi
- changelog
- dokumentasi format data yang lebih formal

---

## 18. Ringkasan singkat

Dengan project ini, kamu bisa:
- upload data pasut langsung dari browser
- membaca nama stasiun dan sensor otomatis
- memilih rentang waktu analisis
- memilih resolusi menit sampai hourly
- memodelkan pasut dengan pendekatan harmonik
- melihat hasil plot secara langsung
- mengekspor hasil ke file teks
- meng-host aplikasi secara gratis lewat GitHub Pages

