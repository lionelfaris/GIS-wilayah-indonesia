import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level'); 
  const parent = searchParams.get('parent'); // Optional: filter by parent_code
  
  if (!level) return NextResponse.json({ error: 'Level diperlukan' }, { status: 400 });

  try {
    // Menghitung luas asli dalam Km Persegi
    // ST_Area(geom::geography) menghitung luas dalam Meter Persegi di permukaan bumi nyata
    // Dibagi 1.000.000 untuk mengubahnya menjadi Kilometer Persegi
    let sql = `
      SELECT 
        code, name, level, parent_code, 
        shape_area_km2 as shape_area, 
        shape_leng, 
        ST_X(centroid) as x, ST_Y(centroid) as y 
      FROM regions 
      WHERE level = $1
    `;
    const params = [level];

    if (parent) {
      sql += ` AND parent_code = $2`;
      params.push(parent);
    }

    sql += ` ORDER BY name ASC`;

    const result = await query(sql, params);

    const mapped = result.rows.map(row => {
      let parentKey = '';
      if (level === 'adm2') parentKey = 'adm1_code';
      if (level === 'adm3') parentKey = 'adm2_code';
      if (level === 'adm4') parentKey = 'adm3_code';

      return { ...row, [parentKey]: row.parent_code };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 });
  }
}
