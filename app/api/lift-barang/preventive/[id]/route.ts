import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

// Tipe data untuk header
interface HeaderRow extends RowDataPacket {
  id: number;
  inspection_date: string;
  inspector: string;
  inspector_nik: string | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Tipe data untuk item
interface ItemRow extends RowDataPacket {
  id: number;
  header_id: number;
  item_id: number;
  item_name: string;
  equipment_support: string;
  langkah_kerja: string;
  standar: string;
  status: string;
  keterangan: string | null;
  foto_path: string | null;
  created_at: string;
  updated_at: string;
}

function getItemName(id: number): string {
  const items: Record<number, string> = {
    1: "Hook Lift",
    2: "Sling / Wire Rope",
    3: "Holder Plate / Cantolan Hook",
    4: "Roda Penggerak naik turun",
    5: "Limit Switch"
  };
  return items[id] || `Item ${id}`;
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
      'SELECT * FROM preventive_header WHERE id = ?',
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
      'SELECT * FROM preventive_items WHERE header_id = ?',
      [Number(id)]
    );

    // Format data untuk response
    const items: Record<number, {
      status: string;
      keterangan: string;
      foto_path: string | null;
    }> = {};
    
    itemRows.forEach(item => {
      items[item.item_id] = {
        status: item.status,
        keterangan: item.keterangan || '',
        foto_path: item.foto_path
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: header.id.toString(),
        date: header.inspection_date,
        inspector: header.inspector,
        inspector_nik: header.inspector_nik,
        items: items,
        additionalNotes: header.additional_notes,
        created_at: header.created_at,
        updated_at: header.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching preventive record:', error);
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

export async function PUT(
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

    const body = await request.json();
    const { items, additional_notes } = body;

    // Validasi items jika ada
    if (items) {
      if (typeof items !== 'object') {
        return NextResponse.json(
          { success: false, message: 'Items must be an object' },
          { status: 400 }
        );
      }

      // Validasi setiap item
      for (const [key, value] of Object.entries(items)) {
        const item = value as any;
        
        if (item.status && !['OK', 'NG'].includes(item.status)) {
          return NextResponse.json(
            { success: false, message: `Item ${key}: Status harus 'OK' atau 'NG'` },
            { status: 400 }
          );
        }

        // Validasi keterangan untuk status NG
        if (item.status === 'NG' && (!item.keterangan || !item.keterangan.trim())) {
          return NextResponse.json(
            { success: false, message: `Item ${key}: Keterangan wajib diisi untuk status NG` },
            { status: 400 }
          );
        }
      }
    }

    // Update header
    let updateHeaderQuery = `
      UPDATE preventive_header
      SET updated_at = CURRENT_TIMESTAMP
    `;
    const updateHeaderParams: any[] = [];

    if (additional_notes !== undefined) {
      updateHeaderQuery += ', additional_notes = ?';
      updateHeaderParams.push(additional_notes);
    }

    updateHeaderQuery += ' WHERE id = ?';
    updateHeaderParams.push(Number(id));

    const [headerResult] = await pool.execute(updateHeaderQuery, updateHeaderParams);

    if ((headerResult as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: 'Record not found' },
        { status: 404 }
      );
    }

    // Update items
    if (items) {
      const itemUpdates = Object.entries(items).map(async ([id, itemData]) => {
        const item = itemData as any;
        
        return pool.execute(
          `UPDATE preventive_items 
           SET status = ?, keterangan = ?, foto_path = ?
           WHERE header_id = ? AND item_id = ?`,
          [
            item.status,
            item.keterangan || '',
            item.foto_path || null,
            Number(id),
            Number(id)
          ]
        );
      });

      await Promise.all(itemUpdates);
    }

    // Ambil data yang diperbarui
    const [headerRows] = await pool.execute<HeaderRow[]>(
      'SELECT * FROM preventive_header WHERE id = ?',
      [Number(id)]
    );
    
    const headerRecord = headerRows[0];

    // Ambil item
    const [itemRows] = await pool.execute<ItemRow[]>(
      'SELECT * FROM preventive_items WHERE header_id = ?',
      [Number(id)]
    );

    // Format data untuk response
    const formattedItems: Record<number, {
      status: string;
      keterangan: string;
      foto_path: string | null;
    }> = {};
    
    itemRows.forEach(item => {
      formattedItems[item.item_id] = {
        status: item.status,
        keterangan: item.keterangan || '',
        foto_path: item.foto_path
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Record updated successfully',
      data: {
        id: headerRecord.id.toString(),
        date: headerRecord.inspection_date,
        inspector: headerRecord.inspector,
        inspector_nik: headerRecord.inspector_nik,
        items: formattedItems,
        additionalNotes: headerRecord.additional_notes,
        created_at: headerRecord.created_at,
        updated_at: headerRecord.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating preventive record:', error);
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
    const [result] = await pool.execute(
      'DELETE FROM preventive_header WHERE id = ?',
      [Number(id)]
    );

    if ((result as any).affectedRows === 0) {
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
    console.error('Error deleting preventive record:', error);
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