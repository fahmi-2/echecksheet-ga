// app/api/apd/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface ApdItem {
  no: number;
  nama: string;
  nik: string;
  tglPengambilan: string;
  dept: string;
  jobDesc: string;
  jumlah: number;
  keterangan?: string;
}

interface SubmitData {
  jenisApd: string;
  date: string;
  checker: string;
  checkerNik?: string;
  items: ApdItem[];
}

export async function POST(request: NextRequest) {
  try {
    const data: SubmitData = await request.json();

    // Validasi data
    if (!data.jenisApd || !data.date || !data.checker || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Validasi items
    for (const item of data.items) {
      if (!item.nama || !item.nik || !item.tglPengambilan || !item.dept || !item.jobDesc || item.jumlah <= 0) {
        return NextResponse.json(
          { success: false, message: 'Data item tidak valid' },
          { status: 400 }
        );
      }
    }

    // Generate ID
    const id = `APD-${Date.now()}`;

    // Start transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert ke apd_records
      await connection.query(
        `INSERT INTO apd_records (id, jenis_apd, date, checker, checker_nik, submitted_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [id, data.jenisApd, data.date, data.checker, data.checkerNik || null]
      );

      // Insert ke apd_items
      for (const item of data.items) {
        await connection.query(
          `INSERT INTO apd_items (
            record_id, no, nama, nik, tgl_pengambilan, dept, job_desc, jumlah, keterangan, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            id,
            item.no,
            item.nama,
            item.nik,
            item.tglPengambilan,
            item.dept,
            item.jobDesc,
            item.jumlah,
            item.keterangan || null
          ]
        );
      }

      await connection.commit();
      
      return NextResponse.json(
        {
          success: true,
          message: 'Data APD berhasil disimpan',
          id
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
    console.error('Submit APD error:', error);
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