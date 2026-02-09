// app/api/lift-barang/inspeksi/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

interface InspectionItem {
  status: "OK" | "NG";
  keterangan?: string;
  solusi?: string;
  foto_path?: string;
}

interface SubmitData {
  inspection_date: string;
  inspector: string;
  inspector_nik?: string;
  data: Record<string, InspectionItem>;
}

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    
    // ✅ Tambahkan validasi JSON parsing
    let data: SubmitData;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    console.log('🔍 Data diterima:', {
      inspection_date: data.inspection_date,
      inspector: data.inspector,
      has_data: !!data.data,
      data_keys: data.data ? Object.keys(data.data) : null
    });

    // ✅ Validasi data dasar
    if (!data.inspection_date || !data.inspector) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap: tanggal dan inspector wajib diisi' },
        { status: 400 }
      );
    }

    // ✅ Validasi data object
    if (!data.data || typeof data.data !== 'object' || Object.keys(data.data).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data items tidak valid atau kosong' },
        { status: 400 }
      );
    }

    // ✅ Validasi setiap item
    for (const [subItemId, item] of Object.entries(data.data)) {
      // Pastikan item adalah object
      if (!item || typeof item !== 'object') {
        return NextResponse.json(
          { success: false, message: `Item ${subItemId} tidak valid` },
          { status: 400 }
        );
      }

      // Validasi status
      if (!item.status || !['OK', 'NG'].includes(item.status)) {
        return NextResponse.json(
          { success: false, message: `Status untuk ${subItemId} harus diisi dengan 'OK' atau 'NG'` },
          { status: 400 }
        );
      }
      
      // Jika NG, keterangan dan solusi wajib diisi
      if (item.status === 'NG') {
        const keterangan = item.keterangan?.trim() || '';
        const solusi = item.solusi?.trim() || '';
        
        if (!keterangan || !solusi) {
          return NextResponse.json(
            { success: false, message: `Untuk ${subItemId} kondisi NG, keterangan dan solusi wajib diisi` },
            { status: 400 }
          );
        }
      }
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Generate unique ID
      const inspectionId = `lift-barang-inspeksi-${Date.now()}`;

      // Insert ke lift_barang_inspections dengan inspection_type = 'inspeksi'
      await connection.query(
        `INSERT INTO lift_barang_inspections (
          id, inspection_type, inspection_date, inspector, inspector_nik, submitted_at, created_at
        ) VALUES (?, 'inspeksi', ?, ?, ?, NOW(), NOW())`,
        [inspectionId, data.inspection_date, data.inspector, data.inspector_nik || null]
      );

      // Insert items ke lift_barang_inspection_items
      for (const [subItemId, item] of Object.entries(data.data)) {
        // Extract itemId from subItemId (e.g., "1A" -> "1")
        const itemIdMatch = subItemId.match(/^(\d+)/);
        const itemId = itemIdMatch ? itemIdMatch[1] : subItemId;

        await connection.query(
          `INSERT INTO lift_barang_inspection_items (
            inspection_id, item_id, sub_item_id, status, keterangan, solusi, foto_path, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            inspectionId,
            itemId,
            subItemId,
            item.status,
            item.status === 'NG' ? (item.keterangan || '') : null,
            item.status === 'NG' ? (item.solusi || '') : null,
            item.foto_path || null
          ]
        );
      }

      await connection.commit();
      
      // Cek apakah ada item dengan status NG
      const hasNg = Object.values(data.data).some(item => item.status === 'NG');

      console.log('✅ Data inspeksi berhasil disimpan:', { id: inspectionId, hasNg });

      return NextResponse.json(
        {
          success: true,
          message: 'Data inspeksi berhasil disimpan',
          id: inspectionId,
          hasNg: hasNg
        },
        { status: 200 }
      );
    } catch (error) {
      await connection.rollback();
      console.error('Transaction error:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Submit lift barang inspeksi error:', error);
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