// app/api/toilet-inspections/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // ✅ DEKLARASIKAN data DENGAN BENAR
    const data = await request.json(); // Ini adalah baris yang harus ada!
    console.log('📥 Received data:', data);

    // ✅ Validasi minimal
    if (!data.area_code || !data.inspection_date || !data.inspection_time || !data.toilet_type) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // ✅ Generate ID
    const id = data.id || `${data.area_code}-${data.inspection_date}-${data.toilet_type}-${Date.now()}`;

    // ✅ Hitung overall_status
    let overallStatus = 'OK';
    for (let i = 1; i <= 10; i++) {
      if (data[`item_${i}_hasil_l`] === 'NG' || data[`item_${i}_hasil_p`] === 'NG') {
        overallStatus = 'NG';
        break;
      }
    }

    // ✅ Cek duplikat
    const existingResult = await pool.query(
      `SELECT id FROM toilet_inspections 
       WHERE area_code = $1 AND inspection_date = $2 AND toilet_type = $3`,
      [data.area_code, data.inspection_date, data.toilet_type]
    );

    let result;
    let isUpdate = false;

    if (existingResult.rows.length > 0) {
      // UPDATE
      isUpdate = true;
      const updateId = existingResult.rows[0].id;
      
      const updateQuery = `
        UPDATE toilet_inspections SET
          user_id = $1, area_name = $2, inspection_time = $3, inspector_name = $4, inspector_nik = $5,
          item_1_hasil_l = $6, item_1_keterangan_l = $7, item_1_foto_l = $8, item_1_tindakan_l = $9, item_1_pic_l = $10,
          item_2_hasil_l = $11, item_2_keterangan_l = $12, item_2_foto_l = $13, item_2_tindakan_l = $14, item_2_pic_l = $15,
          item_3_hasil_l = $16, item_3_keterangan_l = $17, item_3_foto_l = $18, item_3_tindakan_l = $19, item_3_pic_l = $20,
          item_4_hasil_l = $21, item_4_keterangan_l = $22, item_4_foto_l = $23, item_4_tindakan_l = $24, item_4_pic_l = $25,
          item_5_hasil_l = $26, item_5_keterangan_l = $27, item_5_foto_l = $28, item_5_tindakan_l = $29, item_5_pic_l = $30,
          item_6_hasil_l = $31, item_6_keterangan_l = $32, item_6_foto_l = $33, item_6_tindakan_l = $34, item_6_pic_l = $35,
          item_7_hasil_l = $36, item_7_keterangan_l = $37, item_7_foto_l = $38, item_7_tindakan_l = $39, item_7_pic_l = $40,
          item_8_hasil_l = $41, item_8_keterangan_l = $42, item_8_foto_l = $43, item_8_tindakan_l = $44, item_8_pic_l = $45,
          item_9_hasil_l = $46, item_9_keterangan_l = $47, item_9_foto_l = $48, item_9_tindakan_l = $49, item_9_pic_l = $50,
          item_10_hasil_l = $51, item_10_keterangan_l = $52, item_10_foto_l = $53, item_10_tindakan_l = $54, item_10_pic_l = $55,
          item_1_hasil_p = $56, item_1_keterangan_p = $57, item_1_foto_p = $58, item_1_tindakan_p = $59, item_1_pic_p = $60,
          item_2_hasil_p = $61, item_2_keterangan_p = $62, item_2_foto_p = $63, item_2_tindakan_p = $64, item_2_pic_p = $65,
          item_3_hasil_p = $66, item_3_keterangan_p = $67, item_3_foto_p = $68, item_3_tindakan_p = $69, item_3_pic_p = $70,
          item_4_hasil_p = $71, item_4_keterangan_p = $72, item_4_foto_p = $73, item_4_tindakan_p = $74, item_4_pic_p = $75,
          item_5_hasil_p = $76, item_5_keterangan_p = $77, item_5_foto_p = $78, item_5_tindakan_p = $79, item_5_pic_p = $80,
          item_6_hasil_p = $81, item_6_keterangan_p = $82, item_6_foto_p = $83, item_6_tindakan_p = $84, item_6_pic_p = $85,
          item_7_hasil_p = $86, item_7_keterangan_p = $87, item_7_foto_p = $88, item_7_tindakan_p = $89, item_7_pic_p = $90,
          item_8_hasil_p = $91, item_8_keterangan_p = $92, item_8_foto_p = $93, item_8_tindakan_p = $94, item_8_pic_p = $95,
          item_9_hasil_p = $96, item_9_keterangan_p = $97, item_9_foto_p = $98, item_9_tindakan_p = $99, item_9_pic_p = $100,
          item_10_hasil_p = $101, item_10_keterangan_p = $102, item_10_foto_p = $103, item_10_tindakan_p = $104, item_10_pic_p = $105,
          overall_status = $106,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $107
        RETURNING id, area_code, inspection_date, toilet_type, overall_status
      `;

      const values = [
        data.user_id, data.area_name, data.inspection_time, data.inspector_name, data.inspector_nik || null,
        data.item_1_hasil_l || 'OK', data.item_1_keterangan_l || null, data.item_1_foto_l || null, data.item_1_tindakan_l || null, data.item_1_pic_l || null,
        data.item_2_hasil_l || 'OK', data.item_2_keterangan_l || null, data.item_2_foto_l || null, data.item_2_tindakan_l || null, data.item_2_pic_l || null,
        data.item_3_hasil_l || 'OK', data.item_3_keterangan_l || null, data.item_3_foto_l || null, data.item_3_tindakan_l || null, data.item_3_pic_l || null,
        data.item_4_hasil_l || 'OK', data.item_4_keterangan_l || null, data.item_4_foto_l || null, data.item_4_tindakan_l || null, data.item_4_pic_l || null,
        data.item_5_hasil_l || 'OK', data.item_5_keterangan_l || null, data.item_5_foto_l || null, data.item_5_tindakan_l || null, data.item_5_pic_l || null,
        data.item_6_hasil_l || 'OK', data.item_6_keterangan_l || null, data.item_6_foto_l || null, data.item_6_tindakan_l || null, data.item_6_pic_l || null,
        data.item_7_hasil_l || 'OK', data.item_7_keterangan_l || null, data.item_7_foto_l || null, data.item_7_tindakan_l || null, data.item_7_pic_l || null,
        data.item_8_hasil_l || 'OK', data.item_8_keterangan_l || null, data.item_8_foto_l || null, data.item_8_tindakan_l || null, data.item_8_pic_l || null,
        data.item_9_hasil_l || 'OK', data.item_9_keterangan_l || null, data.item_9_foto_l || null, data.item_9_tindakan_l || null, data.item_9_pic_l || null,
        data.item_10_hasil_l || 'OK', data.item_10_keterangan_l || null, data.item_10_foto_l || null, data.item_10_tindakan_l || null, data.item_10_pic_l || null,
        data.item_1_hasil_p || 'OK', data.item_1_keterangan_p || null, data.item_1_foto_p || null, data.item_1_tindakan_p || null, data.item_1_pic_p || null,
        data.item_2_hasil_p || 'OK', data.item_2_keterangan_p || null, data.item_2_foto_p || null, data.item_2_tindakan_p || null, data.item_2_pic_p || null,
        data.item_3_hasil_p || 'OK', data.item_3_keterangan_p || null, data.item_3_foto_p || null, data.item_3_tindakan_p || null, data.item_3_pic_p || null,
        data.item_4_hasil_p || 'OK', data.item_4_keterangan_p || null, data.item_4_foto_p || null, data.item_4_tindakan_p || null, data.item_4_pic_p || null,
        data.item_5_hasil_p || 'OK', data.item_5_keterangan_p || null, data.item_5_foto_p || null, data.item_5_tindakan_p || null, data.item_5_pic_p || null,
        data.item_6_hasil_p || 'OK', data.item_6_keterangan_p || null, data.item_6_foto_p || null, data.item_6_tindakan_p || null, data.item_6_pic_p || null,
        data.item_7_hasil_p || 'OK', data.item_7_keterangan_p || null, data.item_7_foto_p || null, data.item_7_tindakan_p || null, data.item_7_pic_p || null,
        data.item_8_hasil_p || 'OK', data.item_8_keterangan_p || null, data.item_8_foto_p || null, data.item_8_tindakan_p || null, data.item_8_pic_p || null,
        data.item_9_hasil_p || 'OK', data.item_9_keterangan_p || null, data.item_9_foto_p || null, data.item_9_tindakan_p || null, data.item_9_pic_p || null,
        data.item_10_hasil_p || 'OK', data.item_10_keterangan_p || null, data.item_10_foto_p || null, data.item_10_tindakan_p || null, data.item_10_pic_p || null,
        overallStatus, updateId
      ];

      result = await pool.query(updateQuery, values);
      console.log('✅ Updated:', result.rows[0]);

    } else {
      // INSERT
      const insertQuery = `
        INSERT INTO toilet_inspections (
          id, user_id, area_code, area_name, inspection_date, inspection_time,
          toilet_type, inspector_name, inspector_nik,
          item_1_hasil_l, item_1_keterangan_l, item_1_foto_l, item_1_tindakan_l, item_1_pic_l,
          item_2_hasil_l, item_2_keterangan_l, item_2_foto_l, item_2_tindakan_l, item_2_pic_l,
          item_3_hasil_l, item_3_keterangan_l, item_3_foto_l, item_3_tindakan_l, item_3_pic_l,
          item_4_hasil_l, item_4_keterangan_l, item_4_foto_l, item_4_tindakan_l, item_4_pic_l,
          item_5_hasil_l, item_5_keterangan_l, item_5_foto_l, item_5_tindakan_l, item_5_pic_l,
          item_6_hasil_l, item_6_keterangan_l, item_6_foto_l, item_6_tindakan_l, item_6_pic_l,
          item_7_hasil_l, item_7_keterangan_l, item_7_foto_l, item_7_tindakan_l, item_7_pic_l,
          item_8_hasil_l, item_8_keterangan_l, item_8_foto_l, item_8_tindakan_l, item_8_pic_l,
          item_9_hasil_l, item_9_keterangan_l, item_9_foto_l, item_9_tindakan_l, item_9_pic_l,
          item_10_hasil_l, item_10_keterangan_l, item_10_foto_l, item_10_tindakan_l, item_10_pic_l,
          item_1_hasil_p, item_1_keterangan_p, item_1_foto_p, item_1_tindakan_p, item_1_pic_p,
          item_2_hasil_p, item_2_keterangan_p, item_2_foto_p, item_2_tindakan_p, item_2_pic_p,
          item_3_hasil_p, item_3_keterangan_p, item_3_foto_p, item_3_tindakan_p, item_3_pic_p,
          item_4_hasil_p, item_4_keterangan_p, item_4_foto_p, item_4_tindakan_p, item_4_pic_p,
          item_5_hasil_p, item_5_keterangan_p, item_5_foto_p, item_5_tindakan_p, item_5_pic_p,
          item_6_hasil_p, item_6_keterangan_p, item_6_foto_p, item_6_tindakan_p, item_6_pic_p,
          item_7_hasil_p, item_7_keterangan_p, item_7_foto_p, item_7_tindakan_p, item_7_pic_p,
          item_8_hasil_p, item_8_keterangan_p, item_8_foto_p, item_8_tindakan_p, item_8_pic_p,
          item_9_hasil_p, item_9_keterangan_p, item_9_foto_p, item_9_tindakan_p, item_9_pic_p,
          item_10_hasil_p, item_10_keterangan_p, item_10_foto_p, item_10_tindakan_p, item_10_pic_p,
          overall_status
        ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9,

            -- item L (1–10) = 50
           $10, $11, $12, $13, $14,
$15, $16, $17, $18, $19,
$20, $21, $22, $23, $24,
$25, $26, $27, $28, $29,
$30, $31, $32, $33, $34,
$35, $36, $37, $38, $39,
$40, $41, $42, $43, $44,
$45, $46, $47, $48, $49,
$50, $51, $52, $53, $54,
$55, $56, $57, $58, $59,

            -- item P (1–10) = 50
            $60, $61, $62, $63, $64,
$65, $66, $67, $68, $69,
$70, $71, $72, $73, $74,
$75, $76, $77, $78, $79,
$80, $81, $82, $83, $84,
$85, $86, $87, $88, $89,
$90, $91, $92, $93, $94,
$95, $96, $97, $98, $99,
$100, $101, $102, $103, $104,
$105, $106, $107, $108, $109,

            -- overall
            $110
          )
        RETURNING id, area_code, inspection_date, toilet_type, overall_status
      `;

      const values = [
        id, data.user_id, data.area_code, data.area_name, data.inspection_date, data.inspection_time,
        data.toilet_type, data.inspector_name, data.inspector_nik || null,
        data.item_1_hasil_l || 'OK', data.item_1_keterangan_l || null, data.item_1_foto_l || null, data.item_1_tindakan_l || null, data.item_1_pic_l || null,
        data.item_2_hasil_l || 'OK', data.item_2_keterangan_l || null, data.item_2_foto_l || null, data.item_2_tindakan_l || null, data.item_2_pic_l || null,
        data.item_3_hasil_l || 'OK', data.item_3_keterangan_l || null, data.item_3_foto_l || null, data.item_3_tindakan_l || null, data.item_3_pic_l || null,
        data.item_4_hasil_l || 'OK', data.item_4_keterangan_l || null, data.item_4_foto_l || null, data.item_4_tindakan_l || null, data.item_4_pic_l || null,
        data.item_5_hasil_l || 'OK', data.item_5_keterangan_l || null, data.item_5_foto_l || null, data.item_5_tindakan_l || null, data.item_5_pic_l || null,
        data.item_6_hasil_l || 'OK', data.item_6_keterangan_l || null, data.item_6_foto_l || null, data.item_6_tindakan_l || null, data.item_6_pic_l || null,
        data.item_7_hasil_l || 'OK', data.item_7_keterangan_l || null, data.item_7_foto_l || null, data.item_7_tindakan_l || null, data.item_7_pic_l || null,
        data.item_8_hasil_l || 'OK', data.item_8_keterangan_l || null, data.item_8_foto_l || null, data.item_8_tindakan_l || null, data.item_8_pic_l || null,
        data.item_9_hasil_l || 'OK', data.item_9_keterangan_l || null, data.item_9_foto_l || null, data.item_9_tindakan_l || null, data.item_9_pic_l || null,
        data.item_10_hasil_l || 'OK', data.item_10_keterangan_l || null, data.item_10_foto_l || null, data.item_10_tindakan_l || null, data.item_10_pic_l || null,
        data.item_1_hasil_p || 'OK', data.item_1_keterangan_p || null, data.item_1_foto_p || null, data.item_1_tindakan_p || null, data.item_1_pic_p || null,
        data.item_2_hasil_p || 'OK', data.item_2_keterangan_p || null, data.item_2_foto_p || null, data.item_2_tindakan_p || null, data.item_2_pic_p || null,
        data.item_3_hasil_p || 'OK', data.item_3_keterangan_p || null, data.item_3_foto_p || null, data.item_3_tindakan_p || null, data.item_3_pic_p || null,
        data.item_4_hasil_p || 'OK', data.item_4_keterangan_p || null, data.item_4_foto_p || null, data.item_4_tindakan_p || null, data.item_4_pic_p || null,
        data.item_5_hasil_p || 'OK', data.item_5_keterangan_p || null, data.item_5_foto_p || null, data.item_5_tindakan_p || null, data.item_5_pic_p || null,
        data.item_6_hasil_p || 'OK', data.item_6_keterangan_p || null, data.item_6_foto_p || null, data.item_6_tindakan_p || null, data.item_6_pic_p || null,
        data.item_7_hasil_p || 'OK', data.item_7_keterangan_p || null, data.item_7_foto_p || null, data.item_7_tindakan_p || null, data.item_7_pic_p || null,
        data.item_8_hasil_p || 'OK', data.item_8_keterangan_p || null, data.item_8_foto_p || null, data.item_8_tindakan_p || null, data.item_8_pic_p || null,
        data.item_9_hasil_p || 'OK', data.item_9_keterangan_p || null, data.item_9_foto_p || null, data.item_9_tindakan_p || null, data.item_9_pic_p || null,
        data.item_10_hasil_p || 'OK', data.item_10_keterangan_p || null, data.item_10_foto_p || null, data.item_10_tindakan_p || null, data.item_10_pic_p || null,
        overallStatus
      ];

      result = await pool.query(insertQuery, values);
      console.log('✅ Inserted:', result.rows[0]);
    }

    return NextResponse.json(
      {
        success: true,
        message: isUpdate ? 'Data berhasil diperbarui' : 'Data berhasil disimpan',
        data: result.rows[0],
      },
      { status: isUpdate ? 200 : 201 }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    
    // ✅ Selalu return JSON, bahkan saat error
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan',
        error: error.message || 'Unknown error',
        code: error.code || 'unknown',
      },
      { status: 500 }
    );
  }
}