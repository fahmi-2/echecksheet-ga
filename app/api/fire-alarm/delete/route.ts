// app/api/fire-alarm/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID diperlukan' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Ambil semua foto yang akan dihapus
      const [items] = await connection.query(
        `SELECT foto FROM fire_alarm_items WHERE record_id = ? AND foto IS NOT NULL`,
        [id]
      );
      const itemsArray = items as any[];

      // Hapus file foto dari storage
      for (const item of itemsArray) {
        if (item.foto) {
          try {
            // Extract path dari URL (hapus base URL jika ada)
            const fotoPath = item.foto.replace(process.env.NEXT_PUBLIC_BASE_URL || '', '');
            const filePath = join(process.cwd(), 'public', fotoPath);
            await unlink(filePath);
          } catch (err) {
            console.warn('Gagal menghapus file:', err);
            // Lanjutkan meskipun gagal hapus file
          }
        }
      }

      // Delete record (items akan terhapus otomatis karena ON DELETE CASCADE)
      const [result] = await connection.query(
        `DELETE FROM fire_alarm_records WHERE id = ?`,
        [id]
      );

      const resultObject = result as any;

      if (resultObject.affectedRows === 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, message: 'Data tidak ditemukan' },
          { status: 404 }
        );
      }

      await connection.commit();
      
      return NextResponse.json(
        {
          success: true,
          message: 'Data Fire Alarm berhasil dihapus'
        },
        { status: 200 }
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete fire alarm error:', error);
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