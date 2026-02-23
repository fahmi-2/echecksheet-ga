// app/api/apar/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function DELETE(request: NextRequest) {
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
      console.log('🔄 Transaction started for delete');

      // Hapus items terlebih dahulu (karena foreign key constraint)
      await client.query(
        'DELETE FROM apar_items WHERE record_id = $1',
        [id]
      );

      // Hapus record utama
      const deleteResult = await client.query(
        'DELETE FROM apar_records WHERE id = $1 RETURNING *',
        [id]
      );

      if (deleteResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, message: 'Record tidak ditemukan' },
          { status: 404 }
        );
      }

      await client.query('COMMIT');
      console.log('✅ Record berhasil dihapus');
      
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
      console.log('🔓 Connection released');
    }
  } catch (error) {
    console.error('Delete APAR error:', error);
    
    // ✅ Fixed: Gunakan type assertion atau helper
    return NextResponse.json(
      { 
        success: false, 
        message: 'Gagal menghapus record',
        error: (error as Error).message  // ✅ Aman untuk Next.js
      },
      { status: 500 }
    );
  }
}