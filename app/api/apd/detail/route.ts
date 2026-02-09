// app/api/apd/detail/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID diperlukan' },
        { status: 400 }
      );
    }

    // Get record
    const [recordResult] = await pool.query(
      `SELECT * FROM apd_records WHERE id = ?`,
      [id]
    );

    const recordArray = recordResult as any[];
    if (recordArray.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get items
    const [itemsResult] = await pool.query(
      `SELECT * FROM apd_items WHERE record_id = ? ORDER BY no ASC`,
      [id]
    );

    const itemsArray = itemsResult as any[];

    return NextResponse.json(
      {
        success: true,
        data: {
          ...recordArray[0],
          items: itemsArray
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get detail error:', error);
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