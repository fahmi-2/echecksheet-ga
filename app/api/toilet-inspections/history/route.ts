// app/api/toilet-inspections/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaCode = searchParams.get('area_code');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ Validasi required parameters
    if (!areaCode) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'area_code diperlukan' 
        },
        { status: 400 }
      );
    }

    // ✅ Validasi limit dan offset
    if (isNaN(limit) || limit <= 0 || limit > 1000) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Limit harus antara 1-1000' 
        },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Offset tidak valid' 
        },
        { status: 400 }
      );
    }

    console.log('🔍 Querying history for area:', areaCode, 'limit:', limit, 'offset:', offset);

    // ✅ Cek apakah tabel ada terlebih dahulu
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'toilet_inspections'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        console.error('❌ Table toilet_inspections does not exist');
        return NextResponse.json(
          { 
            success: false, 
            message: 'Tabel toilet_inspections belum ada di database. Hubungi administrator.',
            error: 'table_not_found'
          },
          { status: 500 }
        );
      }
    } catch (tableError) {
      console.error('❌ Table check error:', tableError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Gagal memeriksa tabel database',
          error: 'database_error'
        },
        { status: 500 }
      );
    }

    // ✅ PostgreSQL: Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total 
       FROM toilet_inspections
       WHERE area_code = $1`,
      [areaCode]
    );

    const total = parseInt(countResult.rows[0].total);
    console.log('📊 Total records:', total);

    // ✅ PostgreSQL: Get paginated data dengan LIMIT dan OFFSET
    const dataResult = await pool.query(
      `SELECT 
        id, user_id, area_code, area_name, 
        inspection_date, inspection_time, 
        toilet_type, inspector_name, inspector_nik,
        overall_status, created_at, updated_at
       FROM toilet_inspections
       WHERE area_code = $1
       ORDER BY inspection_date DESC, inspection_time DESC
       LIMIT $2 OFFSET $3`,
      [areaCode, limit, offset]
    );

    console.log('✅ Retrieved', dataResult.rowCount, 'records');

    return NextResponse.json(
      {
        success: true,
        data: dataResult.rows,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Get history error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      position: error.position,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });

    // ✅ PostgreSQL specific error handling
    if (error.code === '42P01') { // Undefined table
      return NextResponse.json(
        { 
          success: false, 
          message: 'Tabel tidak ditemukan. Hubungi administrator.',
          error: 'table_not_found'
        },
        { status: 500 }
      );
    }

    if (error.code === '42703') { // Undefined column
      return NextResponse.json(
        { 
          success: false, 
          message: 'Kolom tidak ditemukan di tabel. Hubungi administrator.',
          error: 'column_not_found'
        },
        { status: 500 }
      );
    }

    if (error.code === '22P02') { // Invalid input syntax
      return NextResponse.json(
        { 
          success: false, 
          message: 'Format input tidak valid',
          error: 'invalid_input'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server',
        error: process.env.NODE_ENV === 'development' 
          ? {
              message: error.message,
              code: error.code,
              detail: error.detail
            } 
          : 'internal_server_error'
      },
      { status: 500 }
    );
  }
}