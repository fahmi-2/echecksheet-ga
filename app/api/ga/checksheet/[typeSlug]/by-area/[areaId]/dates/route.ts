// app/api/ga/checksheet/[typeSlug]/by-area/[areaId]/dates/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { typeSlug: string; areaId: string } }
) {
  try {
    const { typeSlug, areaId } = await params;

    console.log('🔍 Fetching available dates for type:', typeSlug, 'area:', areaId);

    // Cek type
    const [types]: any = await pool.query(
      `SELECT id FROM ga_checksheet_types WHERE slug = ?`,
      [typeSlug]
    );

    if (types.length === 0) {
      console.error('❌ Type not found:', typeSlug);
      return NextResponse.json(
        { success: false, message: 'Jenis checksheet tidak ditemukan' },
        { status: 404 }
      );
    }

    const typeId = types[0].id;

    // Ambil semua tanggal yang ada untuk area ini
    const [dates]: any = await pool.query(
      `
      SELECT DISTINCT DATE_FORMAT(check_date, '%Y-%m-%d') as date
      FROM ga_checksheet_headers
      WHERE type_id = ? AND area_id = ?
      ORDER BY check_date DESC
      `,
      [typeId, areaId]
    );

    const availableDates = dates.map((row: any) => row.date);

    console.log('✅ Found', availableDates.length, 'dates');
    return NextResponse.json({ 
      success: true, 
      data: availableDates
    });
  } catch (error) {
    console.error('❌ Error fetching available dates:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data tanggal' },
      { status: 500 }
    );
  }
}