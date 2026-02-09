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

// Fungsi untuk mendapatkan detail item berdasarkan type dan nomor item
function getItemDetails(type: string, itemNo: number) {
  const items: Record<string, Record<number, {
    item_name: string;
    item_detail: string;
  }>> = {
    'instalasi-listrik': {
      1: {
        item_name: "Standar Kabel Listrik",
        item_detail: "Kabel sesuai standar dan tidak terkelupas"
      },
      2: {
        item_name: "Kerapihan Instalasi",
        item_detail: "Kabel tertata rapi dan tidak menggantung"
      },
      3: {
        item_name: "Pelindung Kabel",
        item_detail: "Menggunakan conduit / ducting"
      },
      4: {
        item_name: "Sambungan Kabel",
        item_detail: "Tidak ada sambungan terbuka"
      }
    },
    'stop-kontak': {
      1: {
        item_name: "Kondisi Fisik Stop Kontak",
        item_detail: "Tidak retak, pecah, atau longgar"
      },
      2: {
        item_name: "Penutup Stop Kontak",
        item_detail: "Penutup terpasang dan aman"
      },
      3: {
        item_name: "Fungsi Stop Kontak",
        item_detail: "Berfungsi dengan baik saat diuji"
      },
      4: {
        item_name: "Keamanan",
        item_detail: "Tidak panas dan tidak berbau"
      }
    }
  };

  return items[type]?.[itemNo] || {
    item_name: `Item ${itemNo}`,
    item_detail: ""
  };
}

export async function POST(request: NextRequest) {
  let conn;
  
  try {
    // Log request body untuk debugging
    const bodyText = await request.text();
    console.log('=== REQUEST BODY ===');
    console.log(bodyText);
    console.log('====================');

    const body = JSON.parse(bodyText);
    const { type, tanggal, area, pic, data, additional_notes } = body;

    // Validasi input
    if (!type || !tanggal || !area || !pic || !data) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Required fields are missing',
          received: { type, tanggal, area, pic, hasData: !!data }
        },
        { status: 400 }
      );
    }

    // Validasi type
    if (!['instalasi-listrik', 'stop-kontak'].includes(type)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid type. Must be "instalasi-listrik" or "stop-kontak"' 
        },
        { status: 400 }
      );
    }

    // Validasi data format
    if (typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Data must be an object' 
        },
        { status: 400 }
      );
    }

    // Validasi data item
    const dataEntries = Object.entries(data);
    if (dataEntries.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Data cannot be empty' 
        },
        { status: 400 }
      );
    }

    for (const [itemNo, itemData] of dataEntries) {
      const item = itemData as any;
      
      // Validasi hasil
      if (!item.hasil) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Item ${itemNo}: Status is required` 
          },
          { status: 400 }
        );
      }

      if (!['OK', 'NOK'].includes(item.hasil)) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Item ${itemNo}: Status must be 'OK' or 'NOK', got '${item.hasil}'` 
          },
          { status: 400 }
        );
      }

      // Validasi keterangan untuk status NOK
      if (item.hasil === 'NOK') {
        if (!item.keterangan || item.keterangan.trim() === '') {
          return NextResponse.json(
            { 
              success: false, 
              message: `Item ${itemNo}: Description is required for NOK status` 
            },
            { status: 400 }
          );
        }
      }
    }

    console.log('✅ All validations passed');

    // Get connection
    conn = await pool.getConnection();
    console.log('✅ Database connection acquired');
try {
    await conn.beginTransaction();

    // INSERT HEADER (tanpa menyertakan id)
    const [headerResult] = await conn.execute<ResultSetHeader>(
      `INSERT INTO electrical_inspections 
       (type, tanggal, area, pic, additional_notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [type, tanggal, area, pic, additional_notes || null]
    );

    // Dapatkan id dari database (integer)
    const headerId = headerResult.insertId;
    console.log('Header ID:', headerId);

      // Insert items
      let itemCount = 0;
      for (const [itemNo, itemData] of dataEntries) {
        const item = itemData as any;
        const details = getItemDetails(type, parseInt(itemNo));

        console.log(`Inserting item ${itemNo}:`, {
          inspection_id: headerId,
          item_no: parseInt(itemNo),
          item_name: details.item_name,
          hasil: item.hasil
        });

        const [itemResult] = await conn.execute<ResultSetHeader>(
          `INSERT INTO electrical_inspection_details 
           (inspection_id, item_no, item_name, item_detail, hasil, keterangan, foto_path) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            headerId,
            parseInt(itemNo),
            details.item_name,
            details.item_detail,
            item.hasil,
            item.keterangan || '',
            item.foto_path || null
          ]
        );

        itemCount++;
        console.log(`✅ Item ${itemNo} inserted (ID: ${itemResult.insertId})`);
      }

      await conn.commit();
      console.log(`✅ Transaction committed. ${itemCount} items inserted`);

      return NextResponse.json({
        success: true,
        message: 'Inspection record created successfully',
        data: { 
          id: headerId.toString(),
          type,
          tanggal,
          area,
          pic,
          itemCount
        }
      });

    } catch (transactionError) {
      if (conn) {
        await conn.rollback();
        console.error('❌ Transaction rolled back');
      }
      console.error('❌ Transaction error:', transactionError);
      throw transactionError;
    } finally {
      if (conn) {
        conn.release();
        console.log('✅ Connection released');
      }
    }

  } catch (error) {
    console.error('❌ Error creating inspection record:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? {
          message: (error as Error).message,
          stack: (error as Error).stack
        } : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const area = searchParams.get('area');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('GET params:', { type, area, startDate, endDate });

    let query = `
      SELECT * FROM electrical_inspections
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (area) {
      query += ' AND area = ?';
      params.push(area);
    }

    if (startDate && endDate) {
      query += ' AND tanggal BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY tanggal DESC, created_at DESC';

    console.log('Executing query:', query);
    console.log('With params:', params);

    const [headers] = await pool.execute<HeaderRow[]>(query, params);
    console.log(`Found ${headers.length} records`);

    const result: Array<{
      id: string;
      type: string;
      tanggal: string;
      area: string;
      pic: string;
      items: Record<number, {
        hasil: string;
        keterangan: string;
        foto_path: string | null;
      }>;
      additionalNotes: string | null;
      createdAt: string;
      updatedAt: string;
    }> = [];
    
    for (const header of headers) {
      const [itemRows] = await pool.execute<ItemRow[]>(
        'SELECT * FROM electrical_inspection_details WHERE inspection_id = ? ORDER BY item_no ASC',
        [header.id]
      );
      
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
      
      result.push({
        id: header.id.toString(),
        type: header.type,
        tanggal: header.tanggal,
        area: header.area,
        pic: header.pic,
        items: items,
        additionalNotes: header.additional_notes,
        createdAt: header.created_at,
        updatedAt: header.updated_at
      });
    }

    console.log('Returning data with', result.length, 'records');

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error fetching inspection records:', error);
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