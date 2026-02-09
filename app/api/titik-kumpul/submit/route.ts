import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface TitikKumpulItem {
  lokasi: string;
  areaAman: 'OK' | 'NG';
  identitasTitikKumpul: 'OK' | 'NG';
  areaMobilPMK: 'OK' | 'NG';
  keterangan?: string;
  tindakanPerbaikan?: string;
  pic: string;
  foto?: string;
}

interface JalurEvakuasiItem {
  pertanyaan: string;
  no: number;
  hasilCek: 'OK' | 'NG';
  keterangan?: string;
  tindakanPerbaikan?: string;
  pic: string;
  foto?: string;
}

interface SubmitData {
  date: string;
  checker: string;
  nik?: string;
  department?: string;
  titikKumpul: TitikKumpulItem[];
  jalurEvakuasi: JalurEvakuasiItem[];
}

export async function POST(request: NextRequest) {
  try {
    const data: SubmitData = await request.json();

    // ✅ Validasi dasar
    if (!data.date || !data.checker) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap: tanggal dan checker wajib diisi' },
        { status: 400 }
      );
    }

    if ((!data.titikKumpul || data.titikKumpul.length === 0) && 
        (!data.jalurEvakuasi || data.jalurEvakuasi.length === 0)) {
      return NextResponse.json(
        { success: false, message: 'Data Titik Kumpul atau Jalur Evakuasi harus diisi' },
        { status: 400 }
      );
    }

    // ✅ Cek duplikat tanggal
    const [existingRows]: any = await pool.query(
      'SELECT id FROM titik_kumpul_checklists WHERE checklist_date = ?',
      [data.date]
    );
    
    if (existingRows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Data untuk tanggal ini sudah ada' },
        { status: 409 }
      );
    }

    // ✅ Start transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // ✅ Insert header (TANPA ID manual)
      const [headerResult]: any = await connection.query(
        `INSERT INTO titik_kumpul_checklists (
          checklist_date, checker_name, checker_nik, checker_dept, submitted_at, created_at
        ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [data.date, data.checker, data.nik || null, data.department || null]
      );

      // ✅ Dapatkan auto-generated ID
      const checklistId = headerResult.insertId;
      console.log('✅ Generated Titik Kumpul ID:', checklistId);

      // ✅ Insert Titik Kumpul items
      if (data.titikKumpul && data.titikKumpul.length > 0) {
        for (const item of data.titikKumpul) {
          const [locRows]: any = await connection.query(
            'SELECT id FROM locations WHERE name = ? AND type = ?',
            [item.lokasi, 'titik-kumpul']
          );
          
          const locationId = locRows[0]?.id || null;

          await connection.query(
            `INSERT INTO titik_kumpul_items (
              checklist_id, location_id, location_name,
              area_aman, identitas_titik_kumpul, area_mobil_pmk,
              keterangan, tindakan_perbaikan, pic, foto_data, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              checklistId,
              locationId,
              item.lokasi,
              item.areaAman,
              item.identitasTitikKumpul,
              item.areaMobilPMK,
              item.keterangan || '',
              item.tindakanPerbaikan || '',
              item.pic || '',
              item.foto || null
            ]
          );
        }
      }

      // ✅ Insert Jalur Evakuasi items
      if (data.jalurEvakuasi && data.jalurEvakuasi.length > 0) {
        for (const item of data.jalurEvakuasi) {
          const [qRows]: any = await connection.query(
            'SELECT id FROM jalur_evakuasi_questions WHERE question_text = ?',
            [item.pertanyaan]
          );
          
          const questionId = qRows[0]?.id || null;

          await connection.query(
            `INSERT INTO jalur_evakuasi_items (
              checklist_id, question_id, question_text, order_number,
              hasil_cek, keterangan, tindakan_perbaikan, pic, foto_data, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              checklistId,
              questionId,
              item.pertanyaan,
              item.no,
              item.hasilCek,
              item.keterangan || '',
              item.tindakanPerbaikan || '',
              item.pic || '',
              item.foto || null
            ]
          );
        }
      }

      await connection.commit();
      
      // ✅ Cek NG
      const hasNg = 
        (data.titikKumpul?.some(item => 
          item.areaAman === 'NG' || 
          item.identitasTitikKumpul === 'NG' || 
          item.areaMobilPMK === 'NG'
        )) || 
        (data.jalurEvakuasi?.some(item => item.hasilCek === 'NG'));

      console.log('✅ Titik Kumpul data saved:', { checklistId, hasNg });

      return NextResponse.json(
        {
          success: true,
          message: 'Data berhasil disimpan',
          id: checklistId,
          hasNg
        },
        { status: 201 }
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Submit Titik Kumpul error:', error);
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