// app/api/fire-alarm/delete/route.ts
import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID record wajib disertakan' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Hapus items terlebih dahulu (karena foreign key constraint)
      await client.query(
        'DELETE FROM fire_alarm_items WHERE record_id = $1',
        [id]
      );

      // Hapus record utama
      const deleteResult = await client.query(
        'DELETE FROM fire_alarm_records WHERE id = $1 RETURNING *',
        [id]
      );

      if (deleteResult.rowCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Record tidak ditemukan' },
          { status: 404 }
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({
        success: true,
        message: 'Record berhasil dihapus'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Delete transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus record' },
      { status: 500 }
    );
  }
}