// app/api/apd/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jenisApd = searchParams.get('jenis_apd');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Query untuk mendapatkan record
    let query = `
      SELECT * FROM apd_records
      WHERE 1=1
    `;
    
    const params: any[] = [];

    // Filter by jenis_apd
    if (jenisApd) {
      query += ' AND jenis_apd = ?';
      params.push(jenisApd);
    }

    // Filter by date range
    if (dateFrom) {
      query += ' AND date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ' AND date <= ?';
      params.push(dateTo);
    }

    query += ' ORDER BY submitted_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM apd_records WHERE 1=1
       ${jenisApd ? ' AND jenis_apd = ?' : ''}
       ${dateFrom ? ' AND date >= ?' : ''}
       ${dateTo ? ' AND date <= ?' : ''}`,
      [
        ...jenisApd ? [jenisApd] : [],
        ...dateFrom ? [dateFrom] : [],
        ...dateTo ? [dateTo] : []
      ]
    );
    const countResultArray = countResult as any[];
    const total = countResultArray[0].total;

    // Get records
    const [records] = await pool.query(query, params);
    const recordsArray = records as any[];

    // Ambil items untuk setiap record
    const recordsWithItems = await Promise.all(recordsArray.map(async (record: any) => {
      const [items] = await pool.query(
        `SELECT * FROM apd_items WHERE record_id = ? ORDER BY no ASC`,
        [record.id]
      );

      // Konversi ke format yang diharapkan frontend
      return {
        id: record.id,
        jenisApd: record.jenis_apd,
        date: record.date,
        checker: record.checker,
        checkerNik: record.checker_nik,
        items: (items as any[]).map((item: any, idx: number) => ({
          no: idx + 1,
          nama: item.nama,
          nik: item.nik,
          tglPengambilan: item.tgl_pengambilan,
          dept: item.dept,
          jobDesc: item.job_desc,
          jumlah: item.jumlah,
          keterangan: item.keterangan || ""
        })),
        submittedAt: record.submitted_at
      };
    }));

    return NextResponse.json(
      {
        success: true,
        data: recordsWithItems,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get history error:', error);
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