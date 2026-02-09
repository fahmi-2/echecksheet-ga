// app/api/toilet-inspections/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const area_code = searchParams.get('area_code');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!area_code) {
      return NextResponse.json(
        { success: false, message: 'area_code diperlukan' },
        { status: 400 }
      );
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM toilet_inspections
       WHERE area_code = ?`,
      [area_code]
    );

    const countResultArray = countResult as any[];
    const total = countResultArray[0].total;

    // Get data
    const [data] = await pool.query(
      `SELECT * FROM toilet_inspections
       WHERE area_code = ?
       ORDER BY inspection_date DESC, inspection_time DESC
       LIMIT ? OFFSET ?`,
      [area_code, limit, offset]
    );

    const dataArray = data as any[];

    return NextResponse.json(
      {
        success: true,
        data: dataArray,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server',
        error: (error as any).message
      },
      { status: 500 }
    );
  }
}
