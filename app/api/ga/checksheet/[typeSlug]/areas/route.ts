// app/api/ga/checksheet/[typeSlug]/areas/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

type RouteParams = {
  typeSlug: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    // ⬇️ WAJIB await params (Next.js 15+)
    const { typeSlug } = await params;

    // Debug log
    console.log('🔍 Fetching areas for type:', typeSlug);

    if (!typeSlug) {
      return NextResponse.json(
        { success: false, message: 'Type slug tidak ditemukan' },
        { status: 400 }
      );
    }

    // ✅ PostgreSQL: Gunakan $1 bukan ?
    const typesResult = await pool.query(
      `SELECT id FROM ga_checksheet_types WHERE slug = $1 AND is_active = TRUE`,
      [typeSlug]
    );

    if (!typesResult.rows || typesResult.rows.length === 0) {
      console.error('❌ Type not found:', typeSlug);
      return NextResponse.json(
        { success: false, message: 'Jenis checksheet tidak ditemukan' },
        { status: 404 }
      );
    }

    const typeId = typesResult.rows[0].id;
    console.log('✅ Type ID:', typeId);

    // ✅ PostgreSQL: result.rows untuk mengakses data
    const areasResult = await pool.query(
      `
      SELECT id, no, name, location
      FROM ga_checksheet_areas
      WHERE type_id = $1 AND is_active = TRUE
      ORDER BY no ASC
      `,
      [typeId]
    );

    console.log('✅ Found', areasResult.rows.length, 'areas');

    return NextResponse.json({
      success: true,
      data: areasResult.rows,
    });
  } catch (error) {
    console.error('❌ Error fetching areas:', error);

    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data area' },
      { status: 500 }
    );
  }
}