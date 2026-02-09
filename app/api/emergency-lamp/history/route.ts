// app/api/emergency-lamp/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const lokasi = searchParams.get('lokasi');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!area) {
      return NextResponse.json(
        { success: false, message: 'Parameter area diperlukan' },
        { status: 400 }
      );
    }

    // Query untuk mendapatkan records
    let query = `
      SELECT r.*, 
             COUNT(i.id) as item_count,
             SUM(CASE WHEN i.kondisi_lampu = 'NG' OR i.indicator_lamp = 'NG' OR 
                            i.battery_charger = 'NG' OR i.id_number = 'NG' OR 
                            i.kebersihan = 'NG' OR i.kondisi_kabel = 'NG' 
                      THEN 1 ELSE 0 END) as ng_count
      FROM emergency_lamp_records r
      LEFT JOIN emergency_lamp_items i ON r.id = i.record_id
      WHERE r.area = ?
    `;
    
    const params: any[] = [area];

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
      `SELECT COUNT(*) as total FROM emergency_lamp_records WHERE area = ?
       ${dateFrom ? ' AND date >= ?' : ''}
       ${dateTo ? ' AND date <= ?' : ''}`,
      [
        area,
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
      let itemQuery = `
        SELECT * FROM emergency_lamp_items 
        WHERE record_id = ?
      `;
      const itemParams: any[] = [record.id];

      if (lokasi) {
        itemQuery += ' AND lokasi = ?';
        itemParams.push(lokasi);
      }

      itemQuery += ' ORDER BY no ASC';
      
      const [items] = await pool.query(itemQuery, itemParams);

      // Konversi ke format yang diharapkan frontend
      return {
        id: record.id,
        date: record.date,
        area: record.area,
        checker: record.checker,
        checkerNik: record.checker_nik,
        submittedAt: record.submitted_at,
        itemCount: record.item_count,
        ngCount: record.ng_count,
        items: (items as any[]).map((item: any) => ({
          no: item.no,
          lokasi: item.lokasi,
          id: item.id_lamp,
          kondisiLampu: item.kondisi_lampu,
          indicatorLamp: item.indicator_lamp,
          batteryCharger: item.battery_charger,
          idNumber: item.id_number,
          kebersihan: item.kebersihan,
          kondisiKabel: item.kondisi_kabel,
          keterangan: item.keterangan || "",
          tindakanPerbaikan: item.tindakan_perbaikan || "",
          pic: item.pic,
          foto: item.foto ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}` : null
        }))
      };
    }));

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
    console.error('Get emergency lamp history error:', error);
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