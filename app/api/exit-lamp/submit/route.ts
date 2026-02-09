import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface ExitLampItem {
  no: number;
  id: string;
  lokasi: string;
  kondisiLampu: 'OK' | 'NG';
  indikatorLampu: 'OK' | 'NG';
  kebersihan: 'OK' | 'NG';
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
  items: ExitLampItem[];
}

export async function POST(request: NextRequest) {
  try {
    const data: SubmitData = await request.json();

    // ✅ Validasi data
    if (!data.date || !data.checker || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap: tanggal, checker, dan items wajib diisi' },
        { status: 400 }
      );
    }

    // ✅ Validasi setiap item
    for (const item of data.items) {
      if (!item.kondisiLampu || !item.indikatorLampu || !item.kebersihan) {
        return NextResponse.json(
          { success: false, message: `Item ${item.lokasi} tidak lengkap. Semua status wajib diisi.` },
          { status: 400 }
        );
      }
    }

    // ✅ Cek duplikat tanggal
    const [existingRows]: any = await pool.query(
      'SELECT id FROM exit_lamp_checklists WHERE checklist_date = ?',
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

      // ✅ Insert header ke exit_lamp_checklists (TANPA id manual)
      const [headerResult]: any = await connection.query(
        `INSERT INTO exit_lamp_checklists (
          checklist_date, checker_name, checker_nik, checker_dept, submitted_at, created_at
        ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [data.date, data.checker, data.nik || null, data.department || null]
      );

      // ✅ DAPATKAN auto-generated ID dari database
      const checklistId = headerResult.insertId;  // ✅ INI YANG BENAR!

      console.log('✅ Generated checklist ID:', checklistId);

      // ✅ Insert items ke exit_lamp_checklist_items
      for (const item of data.items) {
        // Dapatkan location_id dari tabel locations
        const [locRows]: any = await connection.query(
          'SELECT id FROM locations WHERE code = ? AND type = ?',
          [item.id, 'exit-lamp']
        );
        
        const locationId = locRows[0]?.id || null;

        await connection.query(
          `INSERT INTO exit_lamp_checklist_items (
            checklist_id, location_id, location_code, location_name,
            kondisi_lampu, indikator_lampu, kebersihan,
            keterangan, tindakan_perbaikan, pic, foto_data, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            checklistId,  // ✅ Gunakan integer ID yang benar
            locationId,
            item.id,
            item.lokasi,
            item.kondisiLampu,
            item.indikatorLampu,
            item.kebersihan,
            item.keterangan || '',
            item.tindakanPerbaikan || '',
            item.pic || '',
            item.foto || null
          ]
        );
      }

      await connection.commit();
      
      // ✅ Cek apakah ada item NG
      const hasNg = data.items.some(
        item => item.kondisiLampu === 'NG' || 
                item.indikatorLampu === 'NG' || 
                item.kebersihan === 'NG'
      );

      console.log('✅ Exit Lamp data saved:', { checklistId, hasNg, itemsCount: data.items.length });

      return NextResponse.json(
        {
          success: true,
          message: 'Data berhasil disimpan',
          id: checklistId,  // ✅ Return integer ID
          hasNg,
          itemsCount: data.items.length
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
    console.error('Submit Exit Lamp error:', error);
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

// ✅ Health check
export async function GET() {
  try {
    const [rows]: any = await pool.query('SELECT NOW() as time');
    return NextResponse.json({
      status: 'ok',
      time: rows[0].time,
      message: 'Exit Lamp API is running'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Database connection failed' },
      { status: 500 }
    );
  }
}