// app/api/ga/checksheet/[typeSlug]/by-area/[areaId]/[date]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { format } from 'date-fns';

export async function GET(
  request: Request,
  { params }: { params: { typeSlug: string; areaId: string; date: string } }
) {
  try {
    const { typeSlug, areaId, date } = await params;

    console.log('🔍 Fetching checklist for type:', typeSlug, 'area:', areaId, 'date:', date);

    // Validasi date format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Format tanggal tidak valid' },
        { status: 400 }
      );
    }

    const formattedDate = format(parsedDate, 'yyyy-MM-dd');

    // Cek type
    const [types]: any = await pool.query(
      `SELECT id FROM ga_checksheet_types WHERE slug = ?`,
      [typeSlug]
    );

    if (types.length === 0) {
      console.error('❌ Type not found:', typeSlug);
      return NextResponse.json(
        { success: false, message: 'Jenis checksheet tidak ditemukan' },
        { status: 404 }
      );
    }

    const typeId = types[0].id;

    // Cek apakah checklist sudah ada
    const [headers]: any = await pool.query(
      `
      SELECT h.id, h.check_date, h.inspector_id, h.inspector_name, h.status
      FROM ga_checksheet_headers h
      WHERE h.type_id = ? AND h.area_id = ? AND h.check_date = ?
      `,
      [typeId, areaId, formattedDate]
    );

    if (headers.length === 0) {
      console.log('⚠️ No checklist found for this date');
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'Belum ada data untuk tanggal ini' 
      });
    }

    const headerId = headers[0].id;
    console.log('✅ Header ID:', headerId);

    // Ambil detail checklist
    const [details]: any = await pool.query(
      `
      SELECT 
        ci.item_key,
        ci.no,
        ci.item_group,
        ci.item_check,
        ci.method,
        ci.image,
        cd.result,
        cd.finding,
        cd.corrective_action,
        cd.pic,
        cd.due_date,
        cd.verified_by,
        cd.images,
        cd.notes
      FROM ga_checksheet_details cd
      JOIN ga_checksheet_items ci ON cd.item_id = ci.id
      WHERE cd.header_id = ?
      ORDER BY ci.sort_order ASC, ci.no ASC
      `,
      [headerId]
    );

    // Transform data ke format yang sesuai dengan frontend
    const formattedDetails: any = {};
    details.forEach((detail: any) => {
      formattedDetails[detail.item_key] = {
        date: formattedDate,
        hasilPemeriksaan: detail.result || '',
        keteranganTemuan: detail.finding || '',
        tindakanPerbaikan: detail.corrective_action || '',
        pic: detail.pic || '',
        dueDate: detail.due_date || '',
        verify: detail.verified_by || '',
        inspector: headers[0].inspector_name,
        images: detail.images ? JSON.parse(detail.images) : [],
        notes: detail.notes || ''
      };
    });

    console.log('✅ Found', details.length, 'details');
    return NextResponse.json({ 
      success: true, 
      data: formattedDetails,
      headerInfo: headers[0]
    });
  } catch (error) {
    console.error('❌ Error fetching checklist:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data checklist' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { typeSlug: string; areaId: string; date: string } }
) {
  try {
    const { typeSlug, areaId, date } = await params;
    const body = await request.json();
    const { checklistData, inspectorId, inspectorName, status = 'submitted' } = body;

    console.log('💾 Saving checklist for type:', typeSlug, 'area:', areaId, 'date:', date);

    // Validasi
    if (!checklistData || typeof checklistData !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Data checklist tidak valid' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Format tanggal tidak valid' },
        { status: 400 }
      );
    }

    const formattedDate = parsedDate.toISOString().split('T')[0];

    // Cek type
    const [types]: any = await pool.query(
      `SELECT id FROM ga_checksheet_types WHERE slug = ?`,
      [typeSlug]
    );

    if (types.length === 0) {
      console.error('❌ Type not found:', typeSlug);
      return NextResponse.json(
        { success: false, message: 'Jenis checksheet tidak ditemukan' },
        { status: 404 }
      );
    }

    const typeId = types[0].id;

    // Mulai transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Cek atau buat header
      let [headers]: any = await connection.query(
        `
        SELECT id FROM ga_checksheet_headers
        WHERE type_id = ? AND area_id = ? AND check_date = ?
        `,
        [typeId, areaId, formattedDate]
      );

      let headerId: number;
      if (headers.length > 0) {
        headerId = headers[0].id;
        // Update header
        console.log('🔄 Updating existing header:', headerId);
        await connection.query(
          `
          UPDATE ga_checksheet_headers
          SET inspector_id = ?, inspector_name = ?, status = ?
          WHERE id = ?
          `,
          [inspectorId, inspectorName, status, headerId]
        );
      } else {
        // Insert baru
        console.log('➕ Creating new header');
        const [result]: any = await connection.query(
          `
          INSERT INTO ga_checksheet_headers 
          (type_id, area_id, check_date, inspector_id, inspector_name, status)
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [typeId, areaId, formattedDate, inspectorId, inspectorName, status]
        );
        headerId = result.insertId;
        console.log('✅ New header created with ID:', headerId);
      }

      // Ambil semua item untuk type ini
      const [allItems]: any = await connection.query(
        `SELECT id, item_key FROM ga_checksheet_items WHERE type_id = ?`,
        [typeId]
      );

      console.log('📝 Processing', Object.keys(checklistData).length, 'items');

      // Insert atau update detail
      for (const [itemKey, itemData] of Object.entries(checklistData)) {
        const item = allItems.find((i: any) => i.item_key === itemKey);
        if (!item) {
          console.warn('⚠️ Item not found:', itemKey);
          continue;
        }

        const detail = itemData as any;
        const imagesJson = detail.images ? JSON.stringify(detail.images) : null;

        // Cek apakah sudah ada
        const [existing]: any = await connection.query(
          `
          SELECT id FROM ga_checksheet_details
          WHERE header_id = ? AND item_id = ?
          `,
          [headerId, item.id]
        );

        if (existing.length > 0) {
          // Update
          console.log('🔄 Updating detail for item:', itemKey);
          await connection.query(
            `
            UPDATE ga_checksheet_details
            SET 
              result = ?,
              finding = ?,
              corrective_action = ?,
              pic = ?,
              due_date = ?,
              verified_by = ?,
              images = ?,
              notes = ?
            WHERE id = ?
            `,
            [
              detail.hasilPemeriksaan || '',
              detail.keteranganTemuan || '',
              detail.tindakanPerbaikan || '',
              detail.pic || '',
              detail.dueDate || null,
              detail.verify || '',
              imagesJson,
              detail.notes || '',
              existing[0].id
            ]
          );
        } else {
          // Insert baru
          console.log('➕ Inserting new detail for item:', itemKey);
          await connection.query(
            `
            INSERT INTO ga_checksheet_details
            (header_id, item_id, result, finding, corrective_action, 
             pic, due_date, verified_by, images, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              headerId,
              item.id,
              detail.hasilPemeriksaan || '',
              detail.keteranganTemuan || '',
              detail.tindakanPerbaikan || '',
              detail.pic || '',
              detail.dueDate || null,
              detail.verify || '',
              imagesJson,
              detail.notes || ''
            ]
          );
        }
      }

      await connection.commit();
      connection.release();

      console.log('✅ Checklist saved successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Data berhasil disimpan',
        headerId 
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error saving checklist:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan data checklist' },
      { status: 500 }
    );
  }
}