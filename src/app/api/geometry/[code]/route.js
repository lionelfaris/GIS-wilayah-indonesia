import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  const { code } = await params;

  try {
    const result = await query(`
      SELECT ST_AsGeoJSON(geom) as geometry 
      FROM regions 
      WHERE code = $1
    `, [code]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Wilayah tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      type: "Feature",
      geometry: JSON.parse(result.rows[0].geometry)
    });

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: 'Gagal memuat peta' }, { status: 500 });
  }
}
