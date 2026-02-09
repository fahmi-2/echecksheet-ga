// app/api/apar/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug'); // ✅ GUNAKAN SLUG
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'Parameter slug diperlukan' },
        { status: 400 }
      );
    }

    // Query untuk mendapatkan records (filter berdasarkan slug di kolom area)
    let query = `
      SELECT r.*, 
             COUNT(i.id) as item_count,
             SUM(CASE WHEN i.check1 = 'X' OR i.check2 = 'X' OR i.check3 = 'X' OR 
                            i.check4 = 'X' OR i.check5 = 'X' OR i.check6 = 'X' OR
                            i.check7 = 'X' OR i.check8 = 'X' OR i.check9 = 'X' OR
                            i.check10 = 'X' OR i.check11 = 'X' OR i.check12 = 'X'
                      THEN 1 ELSE 0 END) as ng_count
      FROM apar_records r
      LEFT JOIN apar_items i ON r.id = i.record_id
      WHERE r.area = ?  -- ✅ area di sini berisi slug
    `;
    
    const params: any[] = [slug]; // ✅ Gunakan slug untuk filter

    // Filter by date range
    if (dateFrom) {
      query += ' AND r.date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ' AND r.date <= ?';
      params.push(dateTo);
    }

    query += ' GROUP BY r.id ORDER BY r.submitted_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM apar_records WHERE area = ?
       ${dateFrom ? ' AND date >= ?' : ''}
       ${dateTo ? ' AND date <= ?' : ''}`,
      [
        slug,
        ...dateFrom ? [dateFrom] : [],
        ...dateTo ? [dateTo] : []
      ]
    );
    const countResultArray = countResult as any[];
    const total = countResultArray[0].total;

    // Get records
    const [records] = await pool.query(query, params);
    const recordsArray = records as any[];

    // Ambil items untuk setiap record
    const recordsWithItems = await Promise.all(recordsArray.map(async (record: any) => {
      const [items] = await pool.query(
        `SELECT * FROM apar_items WHERE record_id = ? ORDER BY no ASC`,
        [record.id]
      );

      // Konversi ke format yang diharapkan frontend
      return {
        id: record.id,
        date: record.date,
        area: record.area, // Ini adalah slug yang disimpan di database
        checker: record.checker,
        checkerNik: record.checker_nik,
        submittedAt: record.submitted_at,
        itemCount: record.item_count,
        ngCount: record.ng_count,
        items: (items as any[]).map((item: any) => ({
          no: item.no,
          jenisApar: item.jenis_apar,
          lokasi: item.lokasi,
          noApar: item.no_apar,
          expDate: item.exp_date,
          check1: item.check1,
          check2: item.check2,
          check3: item.check3,
          check4: item.check4,
          check5: item.check5,
          check6: item.check6,
          check7: item.check7,
          check8: item.check8,
          check9: item.check9,
          check10: item.check10,
          check11: item.check11,
          check12: item.check12,
          keterangan: item.keterangan || "",
          tindakanPerbaikan: item.tindakan_perbaikan || "",
          pic: item.pic,
          foto: item.foto ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}` : null
        }))
      };
    }));

    console.log('✅ History loaded:', { slug, total: recordsWithItems.length });

    return NextResponse.json(
      {
        success: true,
        data: recordsWithItems,
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
    console.error('Get APAR history error:', error);
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