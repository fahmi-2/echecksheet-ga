import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface ToiletInspectionData {
  id?: string;
  user_id: string;
  area_code: string;
  area_name: string;
  inspection_date: string;
  inspection_time: string;
  toilet_type: 'laki_perempuan' | 'wanita_only';
  inspector_name: string;
  inspector_nik?: string;
  
  // Item 1-10 dengan format: item_X_hasil_l, item_X_keterangan_l, item_X_foto_l, item_X_tindakan_l, item_X_pic_l
  // dan item_X_hasil_p, item_X_keterangan_p, item_X_foto_p, item_X_tindakan_p, item_X_pic_p
  [key: string]: any;
}

export async function POST(request: Request) {
  try {
    const data: ToiletInspectionData = await request.json();

    if (!data.area_code || !data.inspection_date || !data.inspection_time || !data.toilet_type) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Data yang diperlukan tidak lengkap' 
        },
        { status: 400 }
      );
    }

    // Generate ID atau gunakan yang sudah ada
    const id = data.id || `${data.area_code}-${data.inspection_date}-${data.toilet_type}-${Date.now()}`;

    // Check if already exists
    const [existing] = await pool.query(
      `SELECT id FROM toilet_inspections 
       WHERE area_code = ? AND inspection_date = ? AND toilet_type = ?`,
      [data.area_code, data.inspection_date, data.toilet_type]
    );

    const existingArray = existing as any[];
    
    // Hitung overall_status: jika ada salah satu item yang NG, maka overall adalah NG
    let overallStatus = 'OK';
    for (let i = 1; i <= 10; i++) {
      const hasil_l = data[`item_${i}_hasil_l`];
      const hasil_p = data[`item_${i}_hasil_p`];
      
      if (hasil_l === 'NG' || hasil_p === 'NG') {
        overallStatus = 'NG';
        break;
      }
    }

    if (existingArray.length > 0) {
      // Update existing record
      const updateId = existingArray[0].id;
      
      // Build dynamic update query
      const updateFields = [
        'user_id', 'area_name', 'inspection_time', 'inspector_name', 'inspector_nik',
        ...Array.from({ length: 10 }, (_, i) => {
          const num = i + 1;
          return [
            `item_${num}_hasil_l`, `item_${num}_keterangan_l`, `item_${num}_foto_l`, `item_${num}_tindakan_l`, `item_${num}_pic_l`,
            `item_${num}_hasil_p`, `item_${num}_keterangan_p`, `item_${num}_foto_p`, `item_${num}_tindakan_p`, `item_${num}_pic_p`
          ];
        }).flat(),
        'overall_status'
      ];

      const setClause = updateFields.map(f => `${f} = ?`).join(', ');
      const updateValues = updateFields.map(f => data[f] || null);
      updateValues.push(id);

      await pool.query(
        `UPDATE toilet_inspections SET ${setClause}, updated_at = NOW() WHERE id = ?`,
        [...updateValues, updateId]
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Data checksheet berhasil diperbarui',
          id: updateId
        },
        { status: 200 }
      );
    } else {
      // Insert new record
      const columns = [
        'id', 'user_id', 'area_code', 'area_name', 'inspection_date', 'inspection_time',
        'toilet_type', 'inspector_name', 'inspector_nik',
        ...Array.from({ length: 10 }, (_, i) => {
          const num = i + 1;
          return [
            `item_${num}_hasil_l`, `item_${num}_keterangan_l`, `item_${num}_foto_l`, `item_${num}_tindakan_l`, `item_${num}_pic_l`,
            `item_${num}_hasil_p`, `item_${num}_keterangan_p`, `item_${num}_foto_p`, `item_${num}_tindakan_p`, `item_${num}_pic_p`
          ];
        }).flat(),
        'overall_status'
      ];

      const placeholders = columns.map(() => '?').join(', ');
      const values = [
        id, data.user_id, data.area_code, data.area_name, data.inspection_date, data.inspection_time,
        data.toilet_type, data.inspector_name, data.inspector_nik || null,
        ...Array.from({ length: 10 }, (_, i) => {
          const num = i + 1;
          return [
            data[`item_${num}_hasil_l`] || 'OK',
            data[`item_${num}_keterangan_l`] || null,
            data[`item_${num}_foto_l`] || null,
            data[`item_${num}_tindakan_l`] || null,
            data[`item_${num}_pic_l`] || null,
            data[`item_${num}_hasil_p`] || 'OK',
            data[`item_${num}_keterangan_p`] || null,
            data[`item_${num}_foto_p`] || null,
            data[`item_${num}_tindakan_p`] || null,
            data[`item_${num}_pic_p`] || null
          ];
        }).flat(),
        overallStatus
      ];

      const [insertResult] = await pool.query(
        `INSERT INTO toilet_inspections (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Data checksheet berhasil disimpan',
          id
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Submit checksheet error:', error);
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
