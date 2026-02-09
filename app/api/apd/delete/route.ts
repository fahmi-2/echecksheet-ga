// app/api/apd/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

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

    // Delete record (items akan terhapus otomatis karena ON DELETE CASCADE)
    const [result] = await pool.query(
      `DELETE FROM apd_records WHERE id = ?`,
      [id]
    );

    const resultObject = result as any;

    if (resultObject.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Data APD berhasil dihapus'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete APD error:', error);
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