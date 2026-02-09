import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Tipe data untuk header
interface HeaderRow {
  id: number;
  inspection_date: string;
  inspector: string;
  inspector_nik: string | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Tipe data untuk item
interface ItemRow {
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

// Fungsi untuk mendapatkan nama item berdasarkan ID
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

// Fungsi untuk mendapatkan detail item berdasarkan ID
function getItemDetails(id: number): {
  item_name: string;
  equipment_support: string;
  langkah_kerja: string;
  standar: string;
} {
  const items: Record<number, {
    item_name: string;
    equipment_support: string;
    langkah_kerja: string;
    standar: string;
  }> = {
    1: {
      item_name: "Hook Lift",
      equipment_support: "Dye Penetrant Test",
      langkah_kerja: "Spray",
      standar: "Tidak ada keretakan"
    },
    2: {
      item_name: "Sling / Wire Rope",
      equipment_support: "Grease wire rope",
      langkah_kerja: "Spray / oles",
      standar: "Terlumasi"
    },
    3: {
      item_name: "Holder Plate / Cantolan Hook",
      equipment_support: "Dye Penetrant Test",
      langkah_kerja: "Spray",
      standar: "Tidak ada keretakan"
    },
    4: {
      item_name: "Roda Penggerak naik turun",
      equipment_support: "Grease",
      langkah_kerja: "Oles",
      standar: "Terlumasi"
    },
    5: {
      item_name: "Limit Switch",
      equipment_support: "Kunci Foding",
      langkah_kerja: "Mengencangkan Baut",
      standar: "Kepekaan Mendeteksi"
    }
  };
  
  return items[id] || {
    item_name: `Item ${id}`,
    equipment_support: "",
    langkah_kerja: "",
    standar: ""
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inspection_date, inspector, inspector_nik, items, additional_notes } = body;

    // Validasi input
    if (!inspection_date || !inspector || !items) {
      return NextResponse.json(
        { success: false, message: 'Inspection date, inspector, and items are required' },
        { status: 400 }
      );
    }

    // Validasi items structure
    if (typeof items !== 'object' || Object.keys(items).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Items must be a non-empty object' },
        { status: 400 }
      );
    }

    // Validasi setiap item
    for (const [key, value] of Object.entries(items)) {
      const item = value as any;
      
      if (!item.status || !['OK', 'NG'].includes(item.status)) {
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

    // Insert ke database - header
    const [headerResult] = await pool.execute(
      `INSERT INTO preventive_header 
       (inspection_date, inspector, inspector_nik, additional_notes) 
       VALUES (?, ?, ?, ?)`,
      [inspection_date, inspector, inspector_nik || null, additional_notes || null]
    );

    const headerId = (headerResult as any).insertId;

    // Insert ke database - items
    const itemPromises = Object.entries(items).map(async ([id, itemData]) => {
      const itemId = Number(id);
      const item = itemData as any;
      const details = getItemDetails(itemId);
      
      return pool.execute(
        `INSERT INTO preventive_items 
         (header_id, item_id, item_name, equipment_support, langkah_kerja, standar, status, keterangan, foto_path) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          headerId,
          itemId,
          details.item_name,
          details.equipment_support,
          details.langkah_kerja,
          details.standar,
          item.status,
          item.keterangan || '',
          item.foto_path || null
        ]
      );
    });

    await Promise.all(itemPromises);

    // Ambil data yang baru disimpan
    const [headerRows] = await pool.execute(
      'SELECT * FROM preventive_header WHERE id = ?',
      [headerId]
    ) as any;
    
    const headerRecord = headerRows[0] as HeaderRow;

    // Ambil item
    const [itemRows] = await pool.execute(
      'SELECT * FROM preventive_items WHERE header_id = ?',
      [headerId]
    ) as any;

    // Format data untuk response
    const formattedItems: Record<number, {
      status: string;
      keterangan: string;
      foto_path: string | null;
    }> = {};
    
    (itemRows as ItemRow[]).forEach(item => {
      formattedItems[item.item_id] = {
        status: item.status,
        keterangan: item.keterangan || '',
        foto_path: item.foto_path
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Preventive maintenance record created successfully',
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
    console.error('Error creating preventive record:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const inspector = searchParams.get('inspector');

    let query = `
      SELECT h.* 
      FROM preventive_header h
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter by date
    if (date) {
      query += ' AND h.inspection_date = ?';
      params.push(date);
    }

    // Filter by inspector
    if (inspector) {
      query += ' AND h.inspector = ?';
      params.push(inspector);
    }

    // Order by created_at descending
    query += ' ORDER BY h.created_at DESC';

    const [headerRows] = await pool.execute(query, params) as any;
    
    const headers = headerRows as HeaderRow[];
    
    // Ambil item untuk setiap header
    const result: Array<{
      id: string;
      date: string;
      inspector: string;
      inspector_nik: string | null;
      items: Record<number, {
        status: string;
        keterangan: string;
        foto_path: string | null;
      }>;
      additionalNotes: string | null;
      created_at: string;
      updated_at: string;
    }> = [];
    
    for (const header of headers) {
      const [itemRows] = await pool.execute(
        'SELECT * FROM preventive_items WHERE header_id = ?',
        [header.id]
      ) as any;
      
      const items: Record<number, {
        status: string;
        keterangan: string;
        foto_path: string | null;
      }> = {};
      
      (itemRows as ItemRow[]).forEach(item => {
        items[item.item_id] = {
          status: item.status,
          keterangan: item.keterangan || '',
          foto_path: item.foto_path
        };
      });
      
      result.push({
        id: header.id.toString(),
        date: header.inspection_date,
        inspector: header.inspector,
        inspector_nik: header.inspector_nik,
        items: items,
        additionalNotes: header.additional_notes,
        created_at: header.created_at,
        updated_at: header.updated_at
      });
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching preventive records:', error);
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