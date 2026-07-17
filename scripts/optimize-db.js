require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function optimizeDB() {
  console.log("Memulai proses optimasi database (Opsi 1)...");
  
  try {
    // 1. Menambahkan kolom baru jika belum ada
    console.log("1. Membuat kolom shape_area_km2 di tabel regions...");
    await pool.query(`ALTER TABLE regions ADD COLUMN IF NOT EXISTS shape_area_km2 double precision;`);
    
    // 2. Menghitung dan menyimpan luas area ke kolom baru
    console.log("2. Menghitung ST_Area dan menyimpannya (Ini mungkin memakan waktu beberapa detik)...");
    const updateRes = await pool.query(`
      UPDATE regions 
      SET shape_area_km2 = (ST_Area(geom::geography) / 1000000) 
      WHERE shape_area_km2 IS NULL;
    `);
    
    console.log(`Berhasil memperbarui ${updateRes.rowCount} baris wilayah.`);
    console.log("Selesai! Database Anda sekarang sudah dioptimalkan.");
  } catch (err) {
    console.error("Terjadi error saat optimasi:", err);
  } finally {
    await pool.end();
  }
}

optimizeDB();
