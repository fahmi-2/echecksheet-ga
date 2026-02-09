// app/api/lift-barang/inspeksi/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!itemId) {
      return NextResponse.json(
        { success: false, message: 'Parameter itemId diperlukan' },
        { status: 400 }
      );
    }

    // Query untuk mendapatkan inspections dengan inspection_type = 'inspeksi'
    let query = `
      SELECT i.*, 
             COUNT(items.id) as item_count,
             SUM(CASE WHEN items.status = 'NG' THEN 1 ELSE 0 END) as ng_count
      FROM lift_barang_inspections i
      LEFT JOIN lift_barang_inspection_items items ON i.id = items.inspection_id
      WHERE items.item_id = ? AND i.inspection_type = 'inspeksi'
    `;
    
    const params: any[] = [itemId];

    // Filter by date range
    if (dateFrom) {
      query += ' AND i.inspection_date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ' AND i.inspection_date <= ?';
      params.push(dateTo);
    }

    query += ' GROUP BY i.id ORDER BY i.submitted_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM lift_barang_inspections i
       LEFT JOIN lift_barang_inspection_items items ON i.id = items.inspection_id
       WHERE items.item_id = ? AND i.inspection_type = 'inspeksi'
       ${dateFrom ? ' AND i.inspection_date >= ?' : ''}
       ${dateTo ? ' AND i.inspection_date <= ?' : ''}`,
      [
        itemId,
        ...dateFrom ? [dateFrom] : [],
        ...dateTo ? [dateTo] : []
      ]
    );
    const countResultArray = countResult as any[];
    const total = countResultArray[0].total;

    // Get inspections
    const [inspections] = await pool.query(query, params);
    const inspectionsArray = inspections as any[];

    // Ambil items untuk setiap inspection
    const inspectionsWithItems = await Promise.all(inspectionsArray.map(async (inspection: any) => {
      const [items] = await pool.query(
        `SELECT * FROM lift_barang_inspection_items 
         WHERE inspection_id = ? 
         ORDER BY sub_item_id ASC`,
        [inspection.id]
      );

      // Konversi ke format yang diharapkan frontend
      const itemsMap: Record<string, any> = {};
      (items as any[]).forEach((item: any) => {
        itemsMap[item.sub_item_id] = {
          status: item.status,
          keterangan: item.keterangan || "",
          solusi: item.solusi || "",
          foto_path: item.foto_path ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto_path}` : null
        };
      });

      return {
        id: inspection.id,
        inspection_date: inspection.inspection_date,
        inspector: inspection.inspector,
        inspector_nik: inspection.inspector_nik,
        submitted_at: inspection.submitted_at,
        item_count: inspection.item_count,
        ng_count: inspection.ng_count,
        data: itemsMap
      };
    }));

    return NextResponse.json(
      {
        success: true,
        data: inspectionsWithItems,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get lift barang inspeksi history error:', error);
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