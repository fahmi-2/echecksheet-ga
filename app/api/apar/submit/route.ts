// app/api/apar/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface AparItem {
  no: number;
  jenisApar: string;
  lokasi: string;
  noApar: string;
  expDate: string;
  check1: string;
  check2: string;
  check3: string;
  check4: string;
  check5: string;
  check6: string;
  check7: string;
  check8: string;
  check9: string;
  check10: string;
  check11: string;
  check12: string;
  keterangan?: string;
  tindakanPerbaikan?: string;
  pic: string;
  foto?: string;
}

interface SubmitData {
  date: string;
  slug: string; // ✅ GUNAKAN SLUG (bukan area)
  checker: string;
  checkerNik?: string;
  items: AparItem[];
}

export async function POST(request: NextRequest) {
  try {
    const data: SubmitData = await request.json();

    // ✅ VALIDASI: Gunakan slug, bukan area
    if (!data.date || !data.slug || !data.checker || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap: date, slug, checker, dan items wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi semua item harus diisi
    for (const item of data.items) {
      for (let i = 1; i <= 12; i++) {
        const checkValue = item[`check${i}` as keyof AparItem] as string;
        if (!checkValue || !['O', 'X'].includes(checkValue)) {
          return NextResponse.json(
            { success: false, message: `Check item ${i} harus diisi dengan 'O' atau 'X'` },
            { status: 400 }
          );
        }
      }
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Generate unique ID menggunakan slug
      const recordId = `apar-${data.slug}-${Date.now()}`;

      // ✅ INSERT: Simpan slug di kolom area (karena kolom area di DB menyimpan slug)
      await connection.query(
        `INSERT INTO apar_records (
          id, date, area, checker, checker_nik, submitted_at, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [recordId, data.date, data.slug, data.checker, data.checkerNik || null]
      );

      // Insert items ke apar_items
      for (const item of data.items) {
        await connection.query(
          `INSERT INTO apar_items (
            record_id, no, jenis_apar, lokasi, no_apar, exp_date,
            check1, check2, check3, check4, check5, check6,
            check7, check8, check9, check10, check11, check12,
            keterangan, tindakan_perbaikan, pic, foto, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            recordId,
            item.no,
            item.jenisApar,
            item.lokasi,
            item.noApar,
            item.expDate,
            item.check1,
            item.check2,
            item.check3,
            item.check4,
            item.check5,
            item.check6,
            item.check7,
            item.check8,
            item.check9,
            item.check10,
            item.check11,
            item.check12,
            item.keterangan || null,
            item.tindakanPerbaikan || null,
            item.pic,
            item.foto || null
          ]
        );
      }

      await connection.commit();
      
      // Cek apakah ada item dengan status NG (X)
      const hasNg = data.items.some(
        (item) =>
          item.check1 === 'X' || item.check2 === 'X' || item.check3 === 'X' ||
          item.check4 === 'X' || item.check5 === 'X' || item.check6 === 'X' ||
          item.check7 === 'X' || item.check8 === 'X' || item.check9 === 'X' ||
          item.check10 === 'X' || item.check11 === 'X' || item.check12 === 'X'
      );

      console.log('✅ Data berhasil disimpan:', { id: recordId, hasNg });

      return NextResponse.json(
        {
          success: true,
          message: 'Data berhasil disimpan',
          data: {
            id: recordId,
            hasNg: hasNg
          }
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
    console.error('Submit APAR error:', error);
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