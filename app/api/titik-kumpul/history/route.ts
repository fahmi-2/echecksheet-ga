import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const location = searchParams.get('location');

    // ✅ Query Titik Kumpul
    let queryTK = `
      SELECT 
        c.id,
        c.checklist_date as date,
        c.checker_name as checker,
        c.checker_nik as nik,
        c.checker_dept as department,
        c.submitted_at as submittedAt,
        i.id as item_id,
        i.location_name as lokasi,
        i.area_aman as areaAman,
        i.identitas_titik_kumpul as identitasTitikKumpul,
        i.area_mobil_pmk as areaMobilPMK,
        i.keterangan,
        i.tindakan_perbaikan as tindakanPerbaikan,
        i.pic,
        i.foto_data as foto
      FROM titik_kumpul_checklists c
      JOIN titik_kumpul_items i ON c.id = i.checklist_id
      WHERE 1=1
    `;
    
    // ✅ Query Jalur Evakuasi
    let queryJE = `
      SELECT 
        c.id,
        c.checklist_date as date,
        c.checker_name as checker,
        c.checker_nik as nik,
        c.checker_dept as department,
        c.submitted_at as submittedAt,
        i.id as item_id,
        i.question_text as pertanyaan,
        i.order_number as no,
        i.hasil_cek as hasilCek,
        i.keterangan,
        i.tindakan_perbaikan as tindakanPerbaikan,
        i.pic,
        i.foto_data as foto
      FROM titik_kumpul_checklists c
      JOIN jalur_evakuasi_items i ON c.id = i.checklist_id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (date) {
      queryTK += ' AND c.checklist_date = ?';
      queryJE += ' AND c.checklist_date = ?';
      params.push(date);
    }

    if (location) {
      queryTK += ' AND i.location_name = ?';
      params.push(location);
    }

    queryTK += ' ORDER BY c.checklist_date DESC, i.id ASC';
    queryJE += ' ORDER BY c.checklist_date DESC, i.order_number ASC';

    const [[rowsTK], [rowsJE]]: any = await Promise.all([
      pool.query(queryTK, [...params]),
      pool.query(queryJE, [...params])
    ]);

    // ✅ Group data
    const grouped: any = {};

    // Process Titik Kumpul
    rowsTK.forEach((row: any) => {
      if (!grouped[row.date]) {
        grouped[row.date] = {
          id: row.id,
          date: row.date,
          checker: row.checker,
          nik: row.nik,
          department: row.department,
          submittedAt: row.submittedAt,
          titikKumpul: [],
          jalurEvakuasi: []
        };
      }
      grouped[row.date].titikKumpul.push({
        no: row.item_id,
        lokasi: row.lokasi,
        areaAman: row.areaAman,
        identitasTitikKumpul: row.identitasTitikKumpul,
        areaMobilPMK: row.areaMobilPMK,
        keterangan: row.keterangan || '',
        tindakanPerbaikan: row.tindakanPerbaikan || '',
        pic: row.pic || '',
        foto: row.foto || ''
      });
    });

    // Process Jalur Evakuasi
    rowsJE.forEach((row: any) => {
      if (!grouped[row.date]) {
        grouped[row.date] = {
          id: row.id,
          date: row.date,
          checker: row.checker,
          nik: row.nik,
          department: row.department,
          submittedAt: row.submittedAt,
          titikKumpul: [],
          jalurEvakuasi: []
        };
      }
      grouped[row.date].jalurEvakuasi.push({
        no: row.no,
        pertanyaan: row.pertanyaan,
        hasilCek: row.hasilCek,
        keterangan: row.keterangan || '',
        tindakanPerbaikan: row.tindakanPerbaikan || '',
        pic: row.pic || '',
        foto: row.foto || ''
      });
    });

    const result = Object.values(grouped);

    console.log('✅ Titik Kumpul history loaded:', {
      totalRecords: result.length,
      titikKumpulItems: result.reduce((sum: number, rec: any) => sum + (rec.titikKumpul?.length || 0), 0),
      jalurEvakuasiItems: result.reduce((sum: number, rec: any) => sum + (rec.jalurEvakuasi?.length || 0), 0)
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Titik Kumpul history error:', error);
    return NextResponse.json({ 
      error: 'Gagal memuat riwayat',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}