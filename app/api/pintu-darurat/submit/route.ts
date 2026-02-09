import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface PintuDaratItem {
  lokasi: string;
  kondisiPintu: 'OK' | 'NG';
  areaSekitar: 'OK' | 'NG';
  paluAlatBantu: 'OK' | 'NG';
  identitasPintu: 'OK' | 'NG';
  idPeringatan: 'OK' | 'NG';
  doorCloser: 'OK' | 'NG';
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
  items: PintuDaratItem[];
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
      if (!item.kondisiPintu || !item.areaSekitar || !item.paluAlatBantu || 
          !item.identitasPintu || !item.idPeringatan || !item.doorCloser) {
        return NextResponse.json(
          { success: false, message: `Item ${item.lokasi} tidak lengkap` },
          { status: 400 }
        );
      }
    }

    // ✅ Cek duplikat tanggal
    const [existingRows]: any = await pool.query(
      'SELECT id FROM pintu_darurat_checklists WHERE checklist_date = ?',
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
        `INSERT INTO pintu_darurat_checklists (
          checklist_date, checker_name, checker_nik, checker_dept, submitted_at, created_at
        ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [data.date, data.checker, data.nik || null, data.department || null]
      );

      // ✅ Dapatkan auto-generated ID
      const checklistId = headerResult.insertId;
      console.log('✅ Generated Pintu Darurat ID:', checklistId);

      // ✅ Insert items
      for (const item of data.items) {
        // Dapatkan location_id
        const [locRows]: any = await connection.query(
          'SELECT id FROM locations WHERE name = ? AND type = ?',
          [item.lokasi, 'pintu-darurat']
        );
        
        const locationId = locRows[0]?.id || null;

        await connection.query(
          `INSERT INTO pintu_darurat_checklist_items (
            checklist_id, location_id, location_name,
            kondisi_pintu, area_sekitar, palu_alat_bantu,
            identitas_pintu, id_peringatan, door_closer,
            keterangan, tindakan_perbaikan, pic, foto_data, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            checklistId,
            locationId,
            item.lokasi,
            item.kondisiPintu,
            item.areaSekitar,
            item.paluAlatBantu,
            item.identitasPintu,
            item.idPeringatan,
            item.doorCloser,
            item.keterangan || '',
            item.tindakanPerbaikan || '',
            item.pic || '',
            item.foto || null
          ]
        );
      }

      await connection.commit();
      
      // ✅ Cek NG
      const hasNg = data.items.some(
        item => item.kondisiPintu === 'NG' || 
                item.areaSekitar === 'NG' || 
                item.paluAlatBantu === 'NG' ||
                item.identitasPintu === 'NG' ||
                item.idPeringatan === 'NG' ||
                item.doorCloser === 'NG'
      );

      console.log('✅ Pintu Darurat data saved:', { checklistId, hasNg, itemsCount: data.items.length });

      return NextResponse.json(
        {
          success: true,
          message: 'Data berhasil disimpan',
          id: checklistId,
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
    console.error('Submit Pintu Darurat error:', error);
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