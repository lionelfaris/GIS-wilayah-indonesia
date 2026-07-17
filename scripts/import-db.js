require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function importData() {
  await client.connect();
  console.log('✅ Terhubung ke database geotsat_db');

  // 1. Buat Tabel PostGIS
  console.log('📦 Membuat tabel regions...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS regions (
      code VARCHAR(20) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      level VARCHAR(10) NOT NULL,
      parent_code VARCHAR(20),
      shape_area FLOAT,
      shape_leng FLOAT,
      centroid GEOMETRY(Point, 4326),
      geom GEOMETRY(Geometry, 4326)
    );
  `);
  console.log('✅ Tabel regions siap');

  // 2. Fungsi untuk import berdasarkan level
  async function processLevel(level, parentField) {
    console.log(`\n⏳ Mengimpor data ${level}...`);
    const metaPath = path.join(__dirname, `../public/data/${level}/metadata.json`);
    if (!fs.existsSync(metaPath)) {
      console.log(`❌ File ${metaPath} tidak ditemukan, skip.`);
      return;
    }

    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    let count = 0;

    for (const item of metadata) {
      // Lewati kalau data sudah ada (mencegah error kalau di-run 2x)
      const check = await client.query('SELECT code FROM regions WHERE code = $1', [item.code]);
      if (check.rows.length > 0) continue; 

      const geomPath = path.join(__dirname, `../public/data/${level}/geometry/${item.code}.json`);
      if (!fs.existsSync(geomPath)) continue;

      const geojson = JSON.parse(fs.readFileSync(geomPath, 'utf8'));
      const geomString = JSON.stringify(geojson.geometry);
      const parentCode = parentField ? item[parentField] : null;

      try {
        await client.query(`
          INSERT INTO regions (code, name, level, parent_code, shape_area, shape_leng, centroid, geom)
          VALUES (
            $1, $2, $3, $4, $5, $6,
            ST_SetSRID(ST_MakePoint($7, $8), 4326),
            ST_GeomFromGeoJSON($9)
          )
        `, [
          item.code, item.name, level, parentCode, 
          item.shape_area, item.shape_leng, 
          item.x, item.y, geomString
        ]);
        
        count++;
        if (count % 50 === 0) process.stdout.write('.'); // Titik penanda progress
      } catch (err) {
        console.error(`\n❌ Error insert ${item.code}:`, err.message);
      }
    }
    console.log(`\n✅ Berhasil insert ${count} data ${level}`);
  }

  // Import semua data wilayah
  await processLevel('adm1', null);
  await processLevel('adm2', 'adm1_code');
  await processLevel('adm3', 'adm2_code');
  await processLevel('adm4', 'adm3_code'); // Butuh waktu sangat lama (80.000+ desa)

  await client.end();
  console.log('\n🎉 Selesai import data ke database!');
}

importData().catch(console.error);
