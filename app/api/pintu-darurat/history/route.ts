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
        i.kondisi_pintu as kondisiPintu,
        i.area_sekitar as areaSekitar,
        i.palu_alat_bantu as paluAlatBantu,
        i.identitas_pintu as identitasPintu,
        i.id_peringatan as idPeringatan,
        i.door_closer as doorCloser,
        i.keterangan,
        i.tindakan_perbaikan as tindakanPerbaikan,
        i.pic,
        i.foto_data as foto
      FROM pintu_darurat_checklists c
      JOIN pintu_darurat_checklist_items i ON c.id = i.checklist_id
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
        item_id: row.item_id,
        lokasi: row.lokasi,
        kondisiPintu: row.kondisiPintu,
        areaSekitar: row.areaSekitar,
        paluAlatBantu: row.paluAlatBantu,
        identitasPintu: row.identitasPintu,
        idPeringatan: row.idPeringatan,
        doorCloser: row.doorCloser,
        keterangan: row.keterangan || '',
        tindakanPerbaikan: row.tindakanPerbaikan || '',
        pic: row.pic || '',
        foto: row.foto || ''
      });
    });

    const result = Object.values(grouped);

    console.log('✅ Pintu Darurat history loaded:', {
      totalRecords: result.length,
      totalItems: result.reduce((sum: number, rec: any) => sum + rec.items.length, 0)
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Pintu Darurat history error:', error);
    return NextResponse.json({ 
      error: 'Gagal memuat riwayat',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}