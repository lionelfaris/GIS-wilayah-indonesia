/**
 * Pre-process GeoJSON data dari geojson-id repo.
 * 
 * Memecah file besar JSON menjadi:
 * 1. metadata.json  → daftar nama & kode wilayah (untuk dropdown)
 * 2. geometry/[code].json → koordinat polygon per wilayah (load on demand)
 * 
 * Jalankan: node scripts/preprocess-data.js
 */

const fs = require('fs');
const path = require('path');

// Path ke data geojson-id
const DATA_BASE = path.join(__dirname, '../../geojson-id/data');
const OUTPUT_DIR = path.join(__dirname, '../public/data');

// Pastikan folder output ada
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Parse double-encoded GeoJSON coordinates
function parseCoordinates(coordStr) {
  try {
    const featureCollection = JSON.parse(coordStr);
    const feature = featureCollection.features[0];
    const geometry = JSON.parse(feature.geometry);
    return geometry;
  } catch (e) {
    console.error('Error parsing coordinates:', e.message);
    return null;
  }
}

// Process satu level administratif
function processLevel(filename, level) {
  const filePath = path.join(DATA_BASE, `${filename}`, `${filename}`);
  
  console.log(`\n📂 Processing ${filename}...`);
  console.log(`   Path: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`   ❌ File not found: ${filePath}`);
    return;
  }
  
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  
  console.log(`   📊 Found ${data.length} entries`);
  
  // 1. Extract metadata (tanpa coordinates) untuk dropdown
  const metadata = data.map(item => ({
    name: item.name,
    code: item.code,
    adm0: item.adm0,
    adm0_code: item.adm0_code,
    adm1: item.adm1,
    adm1_code: item.adm1_code,
    ...(item.adm2 && { adm2: item.adm2, adm2_code: item.adm2_code }),
    ...(item.adm3 && { adm3: item.adm3, adm3_code: item.adm3_code }),
    x: item.x,
    y: item.y,
    shape_area: item.shape_area,
    shape_leng: item.shape_leng,
  }));
  
  // Save metadata
  const metaDir = path.join(OUTPUT_DIR, level);
  ensureDir(metaDir);
  fs.writeFileSync(
    path.join(metaDir, 'metadata.json'),
    JSON.stringify(metadata, null, 0) // minified
  );
  console.log(`   ✅ Metadata saved: ${level}/metadata.json (${metadata.length} entries)`);
  
  // 2. Extract geometry per wilayah
  const geomDir = path.join(OUTPUT_DIR, level, 'geometry');
  ensureDir(geomDir);
  
  let successCount = 0;
  let errorCount = 0;
  
  data.forEach(item => {
    const geometry = parseCoordinates(item.coordinates);
    if (geometry) {
      const geojson = {
        type: "Feature",
        properties: {
          name: item.name,
          code: item.code,
          shape_area: item.shape_area,
          shape_leng: item.shape_leng,
          x: item.x,
          y: item.y,
        },
        geometry: geometry,
      };
      
      fs.writeFileSync(
        path.join(geomDir, `${item.code}.json`),
        JSON.stringify(geojson)
      );
      successCount++;
    } else {
      errorCount++;
    }
  });
  
  console.log(`   ✅ Geometry saved: ${successCount} files`);
  if (errorCount > 0) {
    console.log(`   ⚠️  Errors: ${errorCount} files`);
  }
}

// Main
console.log('🗺️  GeoJSON Indonesia Data Preprocessor');
console.log('========================================');

ensureDir(OUTPUT_DIR);

// Process semua level
processLevel('adm1.json', 'adm1');  // Provinsi
processLevel('adm2.json', 'adm2');  // Kabupaten/Kota
processLevel('adm3.json', 'adm3');  // Kecamatan

// adm4 dipecah jadi 3 file, gabungkan
console.log('\n📂 Processing adm4 (Desa/Kelurahan)...');
const adm4Files = ['adm4_1.json', 'adm4_2.json', 'adm4_3.json'];
const adm4Metadata = [];
const adm4GeomDir = path.join(OUTPUT_DIR, 'adm4', 'geometry');
ensureDir(adm4GeomDir);

let adm4Success = 0;
let adm4Error = 0;

adm4Files.forEach(filename => {
  const filePath = path.join(DATA_BASE, filename, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`   ❌ File not found: ${filePath}`);
    return;
  }
  
  console.log(`   📄 Reading ${filename}...`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  console.log(`   📊 Found ${data.length} entries`);
  
  data.forEach(item => {
    // Metadata
    adm4Metadata.push({
      name: item.name,
      code: item.code,
      adm0: item.adm0,
      adm0_code: item.adm0_code,
      adm1: item.adm1,
      adm1_code: item.adm1_code,
      adm2: item.adm2,
      adm2_code: item.adm2_code,
      adm3: item.adm3,
      adm3_code: item.adm3_code,
      x: item.x,
      y: item.y,
      shape_area: item.shape_area,
      shape_leng: item.shape_leng,
    });
    
    // Geometry
    const geometry = parseCoordinates(item.coordinates);
    if (geometry) {
      const geojson = {
        type: "Feature",
        properties: {
          name: item.name,
          code: item.code,
          shape_area: item.shape_area,
          shape_leng: item.shape_leng,
          x: item.x,
          y: item.y,
        },
        geometry: geometry,
      };
      
      fs.writeFileSync(
        path.join(adm4GeomDir, `${item.code}.json`),
        JSON.stringify(geojson)
      );
      adm4Success++;
    } else {
      adm4Error++;
    }
  });
});

// Save adm4 metadata
const adm4MetaDir = path.join(OUTPUT_DIR, 'adm4');
ensureDir(adm4MetaDir);
fs.writeFileSync(
  path.join(adm4MetaDir, 'metadata.json'),
  JSON.stringify(adm4Metadata, null, 0)
);
console.log(`   ✅ adm4 Metadata: ${adm4Metadata.length} entries`);
console.log(`   ✅ adm4 Geometry: ${adm4Success} files`);
if (adm4Error > 0) {
  console.log(`   ⚠️  Errors: ${adm4Error} files`);
}

console.log('\n========================================');
console.log('🎉 Done! Data saved to public/data/');
