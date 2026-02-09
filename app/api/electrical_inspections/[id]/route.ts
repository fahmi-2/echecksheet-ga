import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Tipe data untuk header
interface HeaderRow extends RowDataPacket {
  id: number;
  type: string;
  tanggal: string;
  area: string;
  pic: string;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Tipe data untuk item
interface ItemRow extends RowDataPacket {
  id: number;
  inspection_id: number;
  item_no: number;
  item_name: string;
  item_detail: string | null;
  hasil: string;
  keterangan: string | null;
  foto_path: string | null;
  created_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validasi ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    // Get header
    const [headerRows] = await pool.execute<HeaderRow[]>(
      'SELECT * FROM electrical_inspections WHERE id = ?',
      [Number(id)]
    );

    if (headerRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Record not found' },
        { status: 404 }
      );
    }

    const header = headerRows[0];

    // Get items
    const [itemRows] = await pool.execute<ItemRow[]>(
      'SELECT * FROM electrical_inspection_details WHERE inspection_id = ? ORDER BY item_no ASC',
      [Number(id)]
    );

    // Format data untuk response
    const items: Record<number, {
      hasil: string;
      keterangan: string;
      foto_path: string | null;
    }> = {};
    
    itemRows.forEach(item => {
      items[item.item_no] = {
        hasil: item.hasil,
        keterangan: item.keterangan || '',
        foto_path: item.foto_path
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: header.id.toString(),
        type: header.type,
        tanggal: header.tanggal,
        area: header.area,
        pic: header.pic,
        items: items,
        additionalNotes: header.additional_notes,
        createdAt: header.created_at,
        updatedAt: header.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching inspection record:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validasi ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    // Delete dari database
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM electrical_inspections WHERE id = ?',
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
      data: { id }
    });

  } catch (error) {
    console.error('Error deleting inspection record:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}