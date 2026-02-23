// app/api/fire-alarm/history/route.ts
import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zona = searchParams.get('zona');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build dynamic query
    const filters = [];
    const params = [];

    if (zona) {
      filters.push('r.zona = $1');
      params.push(zona);
    }
    
    if (date) {
      filters.push('r.date = $' + (params.length + 1));
      params.push(date);
    }

    const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
    
    // Query with proper parameter indexing
    const query = `
      SELECT 
        r.id, r.date, r.zona, r.checker, r.checker_nik, r.submitted_at, r.updated_at,
        jsonb_agg(jsonb_build_object(
          'no', i.no,
          'zona', i.zona,
          'lokasi', i.lokasi,
          'alarmBell', i.alarm_bell,
          'indicatorLamp', i.indicator_lamp,
          'manualCallPoint', i.manual_call_point,
          'idZona', i.id_zona,
          'kebersihan', i.kebersihan,
          'kondisiNok', i.kondisi_nok,
          'tindakanPerbaikan', i.tindakan_perbaikan,
          'pic', i.pic,
          'foto', i.foto
        )) as items
      FROM fire_alarm_records r
      LEFT JOIN fire_alarm_items i ON r.id = i.record_id
      ${whereClause}
      GROUP BY r.id
      ORDER BY r.submitted_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;

    params.push(limit);
    params.push(offset);

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
      limit,
      offset
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil riwayat' },
      { status: 500 }
    );
  }
}