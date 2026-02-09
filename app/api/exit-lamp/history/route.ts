import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const location = searchParams.get('location');

    let query = `
      SELECT 
        c.id,
        c.checklist_date as date,
        c.checker_name as checker,
        c.checker_nik as nik,
        c.checker_dept as department,
        c.submitted_at as submittedAt,
        i.id as item_id,
        i.location_name as lokasi,
        i.location_code as id,
        i.kondisi_lampu as kondisiLampu,
        i.indikator_lampu as indikatorLampu,
        i.kebersihan,
        i.keterangan,
        i.tindakan_perbaikan as tindakanPerbaikan,
        i.pic,
        i.foto_data as foto
      FROM exit_lamp_checklists c
      JOIN exit_lamp_checklist_items i ON c.id = i.checklist_id  -- ✅ Sudah benar
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (date) {
      query += ' AND c.checklist_date = ?';
      params.push(date);
    }

    if (location) {
      query += ' AND i.location_name = ?';
      params.push(location);
    }

    query += ' ORDER BY c.checklist_date DESC, i.id ASC';

    const [rows]: any = await pool.query(query, params);

    // ✅ Group by tanggal
    const grouped: any = {};
    rows.forEach((row: any) => {
      if (!grouped[row.date]) {
        grouped[row.date] = {
          id: row.id,
          date: row.date,
          checker: row.checker,
          nik: row.nik,
          department: row.department,
          submittedAt: row.submittedAt,
          items: []
        };
      }
      grouped[row.date].items.push({
        no: row.item_id,
        lokasi: row.lokasi,
        id: row.id,
        kondisiLampu: row.kondisiLampu,
        indikatorLampu: row.indikatorLampu,
        kebersihan: row.kebersihan,
        keterangan: row.keterangan || '',
        tindakanPerbaikan: row.tindakanPerbaikan || '',
        pic: row.pic || '',
        foto: row.foto || ''
      });
    });

    const result = Object.values(grouped);

    console.log('✅ History data loaded:', {
      totalRecords: result.length,
      totalItems: result.reduce((sum: number, rec: any) => sum + rec.items.length, 0)
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Exit Lamp history error:', error);
    return NextResponse.json({ 
      error: 'Gagal memuat riwayat',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}