# Peta Interaktif Wilayah Administrasi Indonesia

Aplikasi web untuk memvisualisasikan peta wilayah administrasi Indonesia secara interaktif. Proyek ini dibangun menggunakan Next.js dan Leaflet untuk merender peta serta PostgreSQL (PostGIS) sebagai database spasial.

## Fitur Utama

- **Peta Interaktif:** Navigasi peta dengan antarmuka yang responsif, dilengkapi *Zoom Control* (kanan bawah) untuk kemudahan navigasi.
- **Hierarki Navigasi Cerdas:** Memilih wilayah berjenjang (Provinsi -> Kota -> Kecamatan -> Desa) dengan *dropdown* dinamis yang mendukung fitur *reset/clear* di setiap tingkatan.
- **Data Spasial Super Cepat:** Menampilkan poligon batas, luas area, dan titik koordinat dengan proses *loading* yang instan berkat hasil kalkulasi geometri dari PostGIS yang telah di-*pre-calculate*.
- **Desain Modern & Aksesibel:** Menggunakan font Geist, serta menghadirkan elemen visual yang jelas (seperti *tooltip* dengan *text-shadow* agar selalu terbaca).

## Teknologi yang Digunakan

- **Frontend:** [Next.js](https://nextjs.org/) (App Router), [React Leaflet](https://react-leaflet.js.org/), React
- **Backend & Database:** Node.js, [PostgreSQL](https://www.postgresql.org/) dengan ekstensi [PostGIS](https://postgis.net/), modul `pg`
- **Lainnya:** ESLint, Dotenv

## Prasyarat

Pastikan Anda telah menginstal dan mengkonfigurasi:
- [Node.js](https://nodejs.org/) (versi 18.x atau terbaru)
- [PostgreSQL](https://www.postgresql.org/) dengan ekstensi PostGIS aktif
- Database dan tabel spasial yang sudah diimpor datanya.

## Cara Menjalankan (Getting Started)

1. **Persiapkan Konfigurasi Environment:**
   Pastikan Anda memiliki file `.env.local` di direktori utama dengan variabel koneksi database yang benar (misalnya konfigurasi koneksi PostgreSQL).

2. **Instal Dependensi:**
   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```

3. **Jalankan Server Development:**
   ```bash
   npm run dev
   # atau
   yarn dev
   # atau
   pnpm dev
   ```

4. **Buka Aplikasi:**
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

## Log Optimasi yang Telah Diterapkan (Changelog)
Proyek ini telah melalui tahap optimasi dan perbaikan, di antaranya:
- **Optimasi Performa Database:** Kalkulasi luas wilayah (`ST_Area(geom::geography)`) yang dulunya dihitung *on-the-fly* kini telah disimpan secara permanen di kolom baru (`shape_area_km2`). Hal ini mempercepat loading API secara dramatis dari ~9 detik menjadi ~0.1 detik.
- **Perbaikan UX/UI (*User Experience*):**
  - Mengubah opsi awal *dropdown* (placeholder) menjadi fitur *Reset/Clear* agar pengguna bisa membatalkan pilihan sebelumnya (mundur selangkah) dengan mulus.
  - Menambahkan tombol "Reset Pilihan" berukuran besar untuk membersihkan peta sekaligus.
  - Mempertebal dan memberi bayangan hitam (*shadow*) pada tulisan area wilayah di peta agar tetap terbaca walau latar belakang peta berwarna cerah.
  - Menambahkan kembali *Zoom Control* (tombol `+` dan `-`) pada pojok kanan bawah peta.
- **Resolusi Bug:** Menuntaskan peringatan *Hydration Mismatch Error* pada Next.js akibat *extension* peramban pihak ketiga (seperti Grammarly).