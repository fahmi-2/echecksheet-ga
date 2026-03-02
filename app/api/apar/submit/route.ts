// app/api/apar/submit/route.ts
declare const process: {
  env: {
    NODE_ENV: string;
    NEXT_PUBLIC_BASE_URL?: string;
    [key: string]: string | undefined;
  };
};
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
  slug: string;
  checker: string;
  checkerNik?: string;
  items: AparItem[];
}

export async function POST(request: NextRequest) {
  try {
    const data: SubmitData = await request.json();
    
    // Validasi data
    if (!data.date || !data.slug || !data.checker || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap: date, slug, checker, dan items wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi semua item harus diisi
    for (const [index, item] of data.items.entries()) {
      for (let i = 1; i <= 12; i++) {
        const checkValue = item[`check${i}` as keyof AparItem] as string;
        if (!checkValue || !['O', 'X'].includes(checkValue)) {
          return NextResponse.json(
            { success: false, message: `Check item ${i} pada baris ${index + 1} harus diisi dengan 'O' atau 'X'` },
            { status: 400 }
          );
        }
      }
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log('🔄 Transaction started');

      // Generate unique ID
      const recordId = `apar-${data.slug}-${Date.now()}`;

      // ✅ FIX: Hapus created_at dari INSERT (karena sudah DEFAULT)
      await client.query(
        `INSERT INTO apar_records (
          id, date, area, checker, checker_nik, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [recordId, data.date, data.slug, data.checker, data.checkerNik || null]
      );

      // ✅ FIX: Hapus created_at dari INSERT items, sesuaikan kolom & values
      for (const item of data.items) {
        await client.query(
          `INSERT INTO apar_items (
            record_id, no, jenis_apar, lokasi, no_apar, exp_date,
            check1, check2, check3, check4, check5, check6,
            check7, check8, check9, check10, check11, check12,
            keterangan, tindakan_perbaikan, pic, foto
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12,
            $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22
          )`,
          [
            recordId,           // $1
            item.no,            // $2
            item.jenisApar,     // $3
            item.lokasi,        // $4
            item.noApar,        // $5
            item.expDate,       // $6
            item.check1,        // $7
            item.check2,        // $8
            item.check3,        // $9
            item.check4,        // $10
            item.check5,        // $11
            item.check6,        // $12
            item.check7,        // $13
            item.check8,        // $14
            item.check9,        // $15
            item.check10,       // $16
            item.check11,       // $17
            item.check12,       // $18
            item.keterangan || null,        // $19
            item.tindakanPerbaikan || null, // $20
            item.pic,           // $21
            item.foto || null   // $22
          ]
        );
      }

      await client.query('COMMIT');
      console.log('✅ Transaction committed');

      // Cek apakah ada item NG
      const hasNg = data.items.some(
        (item) =>
          item.check1 === 'X' || item.check2 === 'X' || item.check3 === 'X' ||
          item.check4 === 'X' || item.check5 === 'X' || item.check6 === 'X' ||
          item.check7 === 'X' || item.check8 === 'X' || item.check9 === 'X' ||
          item.check10 === 'X' || item.check11 === 'X' || item.check12 === 'X'
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Data berhasil disimpan',
          data: { id: recordId, hasNg }
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
      console.log('🔓 Connection released');
    }
  } catch (error) {
    console.error('Submit APAR error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}