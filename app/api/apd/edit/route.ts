// app/api/apd/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface EditItem {
  id?: number;
  no: number;
  nama: string;
  nik: string;
  tglPengambilan: string;
  dept: string;
  jobDesc: string;
  jumlah: number;
  keterangan?: string;
}

interface EditData {
  recordId: string;
  jenisApd?: string;
  date?: string;
  checker?: string;
  checkerNik?: string;
  items: EditItem[];
}

export async function PUT(request: NextRequest) {
  try {
    const data: EditData = await request.json();

    if (!data.recordId || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update apd_records jika ada perubahan
      if (data.jenisApd || data.date || data.checker) {
        const updateFields: string[] = [];
        const updateValues: any[] = [];

        if (data.jenisApd) {
          updateFields.push('jenis_apd = ?');
          updateValues.push(data.jenisApd);
        }
        if (data.date) {
          updateFields.push('date = ?');
          updateValues.push(data.date);
        }
        if (data.checker) {
          updateFields.push('checker = ?');
          updateValues.push(data.checker);
        }
        if (data.checkerNik !== undefined) {
          updateFields.push('checker_nik = ?');
          updateValues.push(data.checkerNik);
        }

        if (updateFields.length > 0) {
          updateValues.push(data.recordId);
          await connection.query(
            `UPDATE apd_records SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
            updateValues
          );
        }
      }

      // Delete existing items
      await connection.query(
        `DELETE FROM apd_items WHERE record_id = ?`,
        [data.recordId]
      );

      // ✅ INSERT UPDATED ITEMS - PERBAIKAN LENGKAP
      for (const item of data.items) {
        await connection.query(
          `INSERT INTO apd_items (
            record_id, no, nama, nik, tgl_pengambilan, dept, job_desc, jumlah, keterangan, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,  // ✅ 9 placeholder + NOW()
          [
            data.recordId,           // 1 - record_id
            item.no,                 // 2 - no
            item.nama,               // 3 - nama
            item.nik,                // 4 - nik
            item.tglPengambilan,     // 5 - tgl_pengambilan
            item.dept,               // 6 - dept
            item.jobDesc,            // 7 - job_desc
            item.jumlah,             // 8 - jumlah
            item.keterangan || null  // 9 - keterangan
            // created_at menggunakan NOW() langsung, tidak perlu placeholder
          ]
        );
      }

      await connection.commit();
      
      return NextResponse.json(
        {
          success: true,
          message: 'Data APD berhasil diperbarui'
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
    console.error('Edit APD error:', error);
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