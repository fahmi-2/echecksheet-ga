// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    console.log('\n📊 === ANALYTICS API CALLED ===');
    console.log('📊 Slug:', slug);
    console.log('📊 Date range:', dateFrom, 'to', dateTo);

    if (!slug || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

   // ========================================
// ✅ HANDLER: APAR (FIXED)
// ========================================
if (slug.toLowerCase() === 'apar') {
  console.log('📊 Querying APAR...');
  
  let query = `
    SELECT 
      TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') as date,
      COUNT(DISTINCT r.id) as total,
      COUNT(DISTINCT CASE 
        WHEN NOT EXISTS (
          SELECT 1 FROM apar_items i 
          WHERE i.record_id = r.id 
          AND (i.check1 = 'X' OR i.check2 = 'X' OR i.check3 = 'X' OR
               i.check4 = 'X' OR i.check5 = 'X' OR i.check6 = 'X' OR
               i.check7 = 'X' OR i.check8 = 'X' OR i.check9 = 'X' OR
               i.check10 = 'X' OR i.check11 = 'X' OR i.check12 = 'X')
        ) THEN r.id 
      END) as ok_count,
      COUNT(DISTINCT CASE 
        WHEN EXISTS (
          SELECT 1 FROM apar_items i 
          WHERE i.record_id = r.id 
          AND (i.check1 = 'X' OR i.check2 = 'X' OR i.check3 = 'X' OR
               i.check4 = 'X' OR i.check5 = 'X' OR i.check6 = 'X' OR
               i.check7 = 'X' OR i.check8 = 'X' OR i.check9 = 'X' OR
               i.check10 = 'X' OR i.check11 = 'X' OR i.check12 = 'X')
        ) THEN r.id 
      END) as ng_count
    FROM apar_records r
    WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') >= $1 
      AND DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') <= $2
    GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')
    ORDER BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') ASC
  `;
  
  const params: any[] = [dateFrom, dateTo];
  const result = await pool.query(query, params);
  
  const formattedData = result.rows.flatMap((row: any) => {
    const date = row.date;
    const ok = parseInt(row.ok_count) || 0;
    const ng = parseInt(row.ng_count) || 0;
    const data = [];
    if (ok > 0) data.push({ date, status: 'OK', count: ok });
    if (ng > 0) data.push({ date, status: 'NG', count: ng });
    return data;
  });
  
  console.log('📊 APAR formattedData:', formattedData);
  
  return NextResponse.json({ success: true, data: formattedData });
}
    // ========================================
    // ✅ HANDLER: FIRE ALARM
    // ========================================
    if (slug.toLowerCase() === 'fire-alarm') {
      console.log('📊 Querying Fire Alarm...');
      
      const debugTotal = await pool.query(
        'SELECT COUNT(*) as count FROM fire_alarm_records'
      );
      console.log('📊 Total Fire Alarm records in DB:', debugTotal.rows[0].count);
      
      let query = `
        SELECT 
          TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') as date,
          COUNT(DISTINCT r.id) as total,
          COUNT(DISTINCT CASE 
            WHEN NOT EXISTS (
              SELECT 1 FROM fire_alarm_items i 
              WHERE i.record_id = r.id 
              AND (
                i.alarm_bell = 'NG' OR 
                i.indicator_lamp = 'NG' OR 
                i.manual_call_point = 'NG' OR 
                i.kebersihan = 'NG'
              )
            ) THEN r.id 
          END) as ok_count,
          COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM fire_alarm_items i 
              WHERE i.record_id = r.id 
              AND (
                i.alarm_bell = 'NG' OR 
                i.indicator_lamp = 'NG' OR 
                i.manual_call_point = 'NG' OR 
                i.kebersihan = 'NG'
              )
            ) THEN r.id 
          END) as ng_count
        FROM fire_alarm_records r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') >= $1 
          AND DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') <= $2
        GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')
        ORDER BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') ASC
      `;
      
      const params: any[] = [dateFrom, dateTo];
      const result = await pool.query(query, params);
      
      const formattedData = result.rows.flatMap((row: any) => {
        const date = row.date; // ✅ Sudah string YYYY-MM-DD dari TO_CHAR
        const ok = parseInt(row.ok_count) || 0;
        const ng = parseInt(row.ng_count) || 0;
        const data = [];
        if (ok > 0) data.push({ date, status: 'OK', count: ok });
        if (ng > 0) data.push({ date, status: 'NG', count: ng });
        return data;
      });
      
      console.log('📊 Fire Alarm formattedData:', formattedData);
      
      return NextResponse.json({ success: true, data: formattedData });
    }

    // ========================================
    // ✅ HANDLER: EMERGENCY LAMP
    // ========================================
    if (slug.toLowerCase() === 'emergency-lamp') {
      console.log('📊 Querying Emergency Lamp...');
      
      const debugTotal = await pool.query(
        'SELECT COUNT(*) as count FROM emergency_lamp_records'
      );
      console.log('📊 Total Emergency Lamp records in DB:', debugTotal.rows[0].count);
      
      let query = `
        SELECT 
          TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') as date,
          COUNT(DISTINCT r.id) as total,
          COUNT(DISTINCT CASE 
            WHEN NOT EXISTS (
              SELECT 1 FROM emergency_lamp_items i 
              WHERE i.record_id = r.id 
              AND (
                i.kondisi_lampu = 'NG' OR 
                i.indicator_lamp = 'NG' OR 
                i.battery_charger = 'NG' OR 
                i.id_number = 'NG' OR 
                i.kebersihan = 'NG' OR 
                i.kondisi_kabel = 'NG'
              )
            ) THEN r.id 
          END) as ok_count,
          COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM emergency_lamp_items i 
              WHERE i.record_id = r.id 
              AND (
                i.kondisi_lampu = 'NG' OR 
                i.indicator_lamp = 'NG' OR 
                i.battery_charger = 'NG' OR 
                i.id_number = 'NG' OR 
                i.kebersihan = 'NG' OR 
                i.kondisi_kabel = 'NG'
              )
            ) THEN r.id 
          END) as ng_count
        FROM emergency_lamp_records r
        WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') >= $1 
          AND DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') <= $2
        GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')
        ORDER BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') ASC
      `;
      
      const params: any[] = [dateFrom, dateTo];
      const result = await pool.query(query, params);
      
      const formattedData = result.rows.flatMap((row: any) => {
        const date = row.date; // ✅ Sudah string YYYY-MM-DD dari TO_CHAR
        const ok = parseInt(row.ok_count) || 0;
        const ng = parseInt(row.ng_count) || 0;
        const data = [];
        if (ok > 0) data.push({ date, status: 'OK', count: ok });
        if (ng > 0) data.push({ date, status: 'NG', count: ng });
        return data;
      });
      
      console.log('📊 Emergency Lamp formattedData:', formattedData);
      
      return NextResponse.json({ success: true, data: formattedData });
    }

    // ========================================
// ✅ HANDLER: APD (FIXED - All submissions = OK)
// ========================================
if (slug.toLowerCase() === 'apd') {
  console.log('📊 Querying APD...');
  
  const debugTotal = await pool.query(
    'SELECT COUNT(*) as count FROM apd_records'
  );
  console.log('📊 Total APD records in DB:', debugTotal.rows[0].count);
  
  // ✅ Semua submission dihitung sebagai OK, NG = 0
  let query = `
    SELECT 
      TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') as date,
      COUNT(DISTINCT r.id) as total,
      COUNT(DISTINCT r.id) as ok_count,  -- ✅ Semua dihitung OK
      0 as ng_count                       -- ✅ Tidak ada NG untuk APD
    FROM apd_records r
    WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') >= $1 
      AND DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') <= $2
    GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')
    ORDER BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') ASC
  `;
  
  const params: any[] = [dateFrom, dateTo];
  
  console.log('📊 Executing APD query...');
  console.log('📊 Params:', params);
  
  const result = await pool.query(query, params);
  console.log('✅ APD query result:', result.rows.length, 'rows');
  
  const formattedData = result.rows.flatMap((row: any) => {
    const date = row.date;
    const ok = parseInt(row.ok_count) || 0;
    const ng = 0; // ✅ Force NG = 0 untuk APD
    
    const data = [];
    if (ok > 0) data.push({ date, status: 'OK', count: ok });
    // ✅ Tidak push data NG karena selalu 0
    return data;
  });
  
  console.log('📊 APD formattedData:', formattedData);
  
  return NextResponse.json({ success: true, data: formattedData });
}

    // ========================================
    // ✅ HANDLER: TOILET INSPECTION
    // ========================================
    if (slug.toLowerCase() === 'toilet') {
      console.log('📊 Querying Toilet Inspection...');
      
      const debugTotal = await pool.query(
        'SELECT COUNT(*) as count FROM toilet_inspections'
      );
      console.log('📊 Total Toilet records in DB:', debugTotal.rows[0].count);
      
      let query = `
        SELECT 
          TO_CHAR(inspection_date, 'YYYY-MM-DD') as date,
          COUNT(DISTINCT id) as total,
          COUNT(DISTINCT CASE WHEN overall_status = 'OK' THEN id END) as ok_count,
          COUNT(DISTINCT CASE WHEN overall_status = 'NG' THEN id END) as ng_count
        FROM toilet_inspections
        WHERE inspection_date >= $1 AND inspection_date <= $2
        GROUP BY inspection_date
        ORDER BY inspection_date ASC
      `;
      
      const params: any[] = [dateFrom, dateTo];
      
      console.log('📊 Executing Toilet query...');
      console.log('📊 Params:', params);
      
      const result = await pool.query(query, params);
      console.log('✅ Toilet query result:', result.rows.length, 'rows');
      
      const formattedData = result.rows.flatMap((row: any) => {
        const date = row.date; // ✅ Sudah string YYYY-MM-DD dari TO_CHAR
        const ok = parseInt(row.ok_count) || 0;
        const ng = parseInt(row.ng_count) || 0;
        
        const data = [];
        if (ok > 0) data.push({ date, status: 'OK', count: ok });
        if (ng > 0) data.push({ date, status: 'NG', count: ng });
        return data;
      });
      
      console.log('📊 Toilet formattedData:', formattedData);
      
      return NextResponse.json({ success: true, data: formattedData });
    }

    // ========================================
    // ✅ HANDLER: ELECTRICAL INSTALLATION
    // ========================================
    if (slug.toLowerCase() === 'electrical') {
      console.log('📊 Querying Electrical Installation...');
      
      const debugTotal = await pool.query(
        'SELECT COUNT(*) as count FROM electrical_inspections'
      );
      console.log('📊 Total Electrical records in DB:', debugTotal.rows[0].count);
      
      let query = `
        SELECT 
          TO_CHAR(r.tanggal, 'YYYY-MM-DD') as date,
          COUNT(DISTINCT r.id) as total,
          COUNT(DISTINCT CASE 
            WHEN NOT EXISTS (
              SELECT 1 FROM electrical_inspection_details d 
              WHERE d.inspection_id = r.id 
              AND d.hasil = 'NOK'
            ) THEN r.id 
          END) as ok_count,
          COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM electrical_inspection_details d 
              WHERE d.inspection_id = r.id 
              AND d.hasil = 'NOK'
            ) THEN r.id 
          END) as ng_count
        FROM electrical_inspections r
        WHERE r.tanggal >= $1 AND r.tanggal <= $2
        GROUP BY r.tanggal
        ORDER BY r.tanggal ASC
      `;
      
      const params: any[] = [dateFrom, dateTo];
      
      console.log('📊 Executing Electrical query...');
      console.log('📊 Params:', params);
      
      const result = await pool.query(query, params);
      console.log('✅ Electrical query result:', result.rows.length, 'rows');
      
      const formattedData = result.rows.flatMap((row: any) => {
        const date = row.date; // ✅ Sudah string YYYY-MM-DD dari TO_CHAR
        const ok = parseInt(row.ok_count) || 0;
        const ng = parseInt(row.ng_count) || 0;
        
        const data = [];
        if (ok > 0) data.push({ date, status: 'OK', count: ok });
        if (ng > 0) data.push({ date, status: 'NG', count: ng });
        return data;
      });
      
      console.log('📊 Electrical formattedData:', formattedData);
      
      return NextResponse.json({ success: true, data: formattedData });
    }

    // ========================================
    // ✅ HANDLER: LIFT BARANG (Support: inspeksi & preventive)
    // ========================================
    if (slug.toLowerCase() === 'lift-barang') {
      console.log('📊 Querying Lift Barang...');
      
      const inspectionType = searchParams.get('inspectionType') || searchParams.get('formType');
      console.log('📊 inspectionType/formType filter:', inspectionType);
      
      // 🔹 CASE 1: Preventive Maintenance
      if (inspectionType?.toLowerCase() === 'preventive') {
        console.log('📊 Using PREVENTIVE tables...');
        
        let query = `
          SELECT 
            TO_CHAR(h.inspection_date, 'YYYY-MM-DD') as date,
            COUNT(DISTINCT h.id) as total,
            COUNT(DISTINCT CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM preventive_items i 
                WHERE i.header_id = h.id 
                AND i.status = 'NG'
              ) THEN h.id 
            END) as ok_count,
            COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM preventive_items i 
                WHERE i.header_id = h.id 
                AND i.status = 'NG'
              ) THEN h.id 
            END) as ng_count
          FROM preventive_header h
          WHERE h.inspection_date >= $1 AND h.inspection_date <= $2
          GROUP BY h.inspection_date
          ORDER BY h.inspection_date ASC
        `;
        
        const params: any[] = [dateFrom, dateTo];
        
        console.log('📊 Executing Preventive query...');
        console.log('📊 Params:', params);
        
        try {
          const result = await pool.query(query, params);
          console.log('✅ Preventive query result:', result.rows.length, 'rows');
          
          const formattedData = result.rows.flatMap((row: any) => {
            const date = row.date; // ✅ Sudah string YYYY-MM-DD dari TO_CHAR
            const ok = parseInt(row.ok_count) || 0;
            const ng = parseInt(row.ng_count) || 0;
            
            const data = [];
            if (ok > 0) data.push({ date, status: 'OK', count: ok });
            if (ng > 0) data.push({ date, status: 'NG', count: ng });
            return data;
          });
          
          console.log('📊 Preventive formattedData:', formattedData);
          
          return NextResponse.json({ success: true, data: formattedData });
          
        } catch (error) {
          console.error('❌ Preventive query error:', error);
          return NextResponse.json({ success: true, data: [] });
        }
      }
      
      // 🔹 CASE 2: Inspeksi Biasa
      console.log('📊 Using INSPEKSI tables...');
      
      const typeCondition = inspectionType && inspectionType !== 'preventive'
        ? `AND r.inspection_type = '${inspectionType}'` 
        : '';
      
      let query = `
        SELECT 
          TO_CHAR(r.inspection_date, 'YYYY-MM-DD') as date,
          r.inspection_type as type,
          COUNT(DISTINCT r.id) as total,
          COUNT(DISTINCT CASE 
            WHEN NOT EXISTS (
              SELECT 1 FROM lift_barang_inspection_items i 
              WHERE i.inspection_id = r.id 
              AND i.status = 'NG'
            ) THEN r.id 
          END) as ok_count,
          COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM lift_barang_inspection_items i 
              WHERE i.inspection_id = r.id 
              AND i.status = 'NG'
            ) THEN r.id 
          END) as ng_count
        FROM lift_barang_inspections r
        WHERE r.inspection_date >= $1 AND r.inspection_date <= $2
        ${typeCondition}
        GROUP BY r.inspection_date, r.inspection_type
        ORDER BY r.inspection_date ASC
      `;
      
      const params: any[] = [dateFrom, dateTo];
      
      console.log('📊 Executing Inspeksi query...');
      console.log('📊 Params:', params);
      
      const result = await pool.query(query, params);
      console.log('✅ Inspeksi query result:', result.rows.length, 'rows');
      
      const formattedData = result.rows.flatMap((row: any) => {
        const date = row.date; // ✅ Sudah string YYYY-MM-DD dari TO_CHAR
        const ok = parseInt(row.ok_count) || 0;
        const ng = parseInt(row.ng_count) || 0;
        
        const data = [];
        if (ok > 0) data.push({ date, status: 'OK', count: ok });
        if (ng > 0) data.push({ date, status: 'NG', count: ng });
        return data;
      });
      
      console.log('📊 Inspeksi formattedData:', formattedData);
      
      return NextResponse.json({ success: true, data: formattedData });
    }

    // ========================================
    // ✅ HANDLER: EXIT LAMP
    // ========================================
    if (slug.toLowerCase() === 'exit-lamp') {
      console.log('📊 Querying Exit Lamp...');
      
      try {
        const debugTotal = await pool.query(
          'SELECT COUNT(*) as count FROM exit_lamp_checklists'
        );
        console.log('📊 Total Exit Lamp records:', debugTotal.rows[0].count);
        
        let query = `
          SELECT 
            TO_CHAR(r.checklist_date, 'YYYY-MM-DD') as date,
            COUNT(DISTINCT r.id) as total,
            COUNT(DISTINCT CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM exit_lamp_checklist_items i 
                WHERE i.checklist_id = r.id 
                AND (i.kondisi_lampu = 'NG' OR i.indikator_lampu = 'NG' OR i.kebersihan = 'NG')
              ) THEN r.id 
            END) as ok_count,
            COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM exit_lamp_checklist_items i 
                WHERE i.checklist_id = r.id 
                AND (i.kondisi_lampu = 'NG' OR i.indikator_lampu = 'NG' OR i.kebersihan = 'NG')
              ) THEN r.id 
            END) as ng_count
          FROM exit_lamp_checklists r
          WHERE r.checklist_date >= $1 AND r.checklist_date <= $2
          GROUP BY r.checklist_date
          ORDER BY r.checklist_date ASC
        `;
        
        const params: any[] = [dateFrom, dateTo];
        const result = await pool.query(query, params);
        
        const formattedData = result.rows.flatMap((row: any) => {
          const date = row.date; // ✅ Sudah string YYYY-MM-DD dari TO_CHAR
          const ok = parseInt(row.ok_count) || 0;
          const ng = parseInt(row.ng_count) || 0;
          
          const data = [];
          if (ok > 0) data.push({ date, status: 'OK', count: ok });
          if (ng > 0) data.push({ date, status: 'NG', count: ng });
          return data;
        });
        
        console.log('📊 Exit Lamp formattedData:', formattedData);
        
        return NextResponse.json({ success: true, data: formattedData });
        
      } catch (error) {
        console.error('❌ Exit Lamp error:', error);
        return NextResponse.json({
          success: false,
          error: (error as Error).message
        }, { status: 500 });
      }
    }

    // ========================================
    // ✅ HANDLER: PINTU DARURAT
    // ========================================
    if (slug.toLowerCase() === 'pintu-darurat') {
      console.log('📊 Querying Pintu Darurat...');
      
      try {
        const query = `
          SELECT 
            TO_CHAR(r.checklist_date, 'YYYY-MM-DD') as date,
            COUNT(DISTINCT r.id) as total,
            COUNT(DISTINCT CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM pintu_darurat_checklist_items i 
                WHERE i.checklist_id = r.id 
                AND (
                  i.kondisi_pintu = 'NG' OR i.area_sekitar = 'NG' OR 
                  i.palu_alat_bantu = 'NG' OR i.identitas_pintu = 'NG' OR 
                  i.id_peringatan = 'NG' OR i.door_closer = 'NG'
                )
              ) THEN r.id 
            END) as ok_count,
            COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM pintu_darurat_checklist_items i 
                WHERE i.checklist_id = r.id 
                AND (
                  i.kondisi_pintu = 'NG' OR i.area_sekitar = 'NG' OR 
                  i.palu_alat_bantu = 'NG' OR i.identitas_pintu = 'NG' OR 
                  i.id_peringatan = 'NG' OR i.door_closer = 'NG'
                )
              ) THEN r.id 
            END) as ng_count
          FROM pintu_darurat_checklists r
          WHERE r.checklist_date >= $1 AND r.checklist_date <= $2
          GROUP BY r.checklist_date
          ORDER BY r.checklist_date ASC
        `;
        
        const params: any[] = [dateFrom, dateTo];
        const result = await pool.query(query, params);
        
        const formattedData = result.rows.flatMap((row: any) => {
          const date = row.date; // ✅ Sudah string YYYY-MM-DD dari TO_CHAR
          const ok = parseInt(row.ok_count) || 0;
          const ng = parseInt(row.ng_count) || 0;
          
          const data = [];
          if (ok > 0) data.push({ date, status: 'OK', count: ok });
          if (ng > 0) data.push({ date, status: 'NG', count: ng });
          return data;
        });
        
        return NextResponse.json({ success: true, data: formattedData });
        
      } catch (error) {
        console.error('❌ Pintu Darurat error:', error);
        return NextResponse.json({
          success: false,
          error: (error as Error).message
        }, { status: 500 });
      }
    }

    // ========================================
    // ✅ HANDLER: TITIK KUMPUL
    // ========================================
    if (slug.toLowerCase() === 'titik-kumpul') {
      console.log('📊 Querying Titik Kumpul...');
      
      try {
        const query = `
          SELECT 
            TO_CHAR(r.checklist_date, 'YYYY-MM-DD') as date,
            COUNT(DISTINCT r.id) as total,
            COUNT(DISTINCT CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM titik_kumpul_items i 
                WHERE i.checklist_id = r.id 
                AND (i.area_aman = 'NG' OR i.identitas_titik_kumpul = 'NG' OR i.area_mobil_pmk = 'NG')
              )
              AND NOT EXISTS (
                SELECT 1 FROM jalur_evakuasi_items j 
                WHERE j.checklist_id = r.id 
                AND j.hasil_cek = 'NG'
              )
              THEN r.id 
            END) as ok_count,
            COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM titik_kumpul_items i 
                WHERE i.checklist_id = r.id 
                AND (i.area_aman = 'NG' OR i.identitas_titik_kumpul = 'NG' OR i.area_mobil_pmk = 'NG')
              )
              OR EXISTS (
                SELECT 1 FROM jalur_evakuasi_items j 
                WHERE j.checklist_id = r.id 
                AND j.hasil_cek = 'NG'
              )
              THEN r.id 
            END) as ng_count
          FROM titik_kumpul_checklists r
          WHERE r.checklist_date >= $1 AND r.checklist_date <= $2
          GROUP BY r.checklist_date
          ORDER BY r.checklist_date ASC
        `;
        
        const params: any[] = [dateFrom, dateTo];
        const result = await pool.query(query, params);
        
        const formattedData = result.rows.flatMap((row: any) => {
          const date = row.date; // ✅ Sudah string YYYY-MM-DD dari TO_CHAR
          const ok = parseInt(row.ok_count) || 0;
          const ng = parseInt(row.ng_count) || 0;
          
          const data = [];
          if (ok > 0) data.push({ date, status: 'OK', count: ok });
          if (ng > 0) data.push({ date, status: 'NG', count: ng });
          return data;
        });
        
        return NextResponse.json({ success: true, data: formattedData });
        
      } catch (error) {
        console.error('❌ Titik Kumpul error:', error);
        return NextResponse.json({
          success: false,
          error: (error as Error).message
        }, { status: 500 });
      }
    }

    // ========================================
    // ✅ HANDLER: ALL CATEGORY - Aggregate SEMUA form
    // ========================================
    if (slug.toLowerCase() === 'all') {
      console.log('📊 Querying ALL checksheets...');

      const allData: any[] = [];
      const p: any[] = [dateFrom, dateTo];

      // ─── Daftar query hardcoded per tabel ────────────────────────────────────
      // Setiap entry: { name, query }
      // Semua query mengembalikan kolom: date (string YYYY-MM-DD), ok_count, ng_count
      // ─────────────────────────────────────────────────────────────────────────
      const queries: { name: string; sql: string }[] = [

       // 1. APAR (FIXED - dengan items table)
{
  name: 'apar',
  sql: `
    SELECT
      TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS date,
      COUNT(DISTINCT CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM apar_items i
          WHERE i.record_id = r.id
          AND (i.check1 = 'X' OR i.check2 = 'X' OR i.check3 = 'X' OR
               i.check4 = 'X' OR i.check5 = 'X' OR i.check6 = 'X' OR
               i.check7 = 'X' OR i.check8 = 'X' OR i.check9 = 'X' OR
               i.check10 = 'X' OR i.check11 = 'X' OR i.check12 = 'X')
        ) THEN r.id END)                                                      AS ok_count,
      COUNT(DISTINCT CASE
        WHEN EXISTS (
          SELECT 1 FROM apar_items i
          WHERE i.record_id = r.id
          AND (i.check1 = 'X' OR i.check2 = 'X' OR i.check3 = 'X' OR
               i.check4 = 'X' OR i.check5 = 'X' OR i.check6 = 'X' OR
               i.check7 = 'X' OR i.check8 = 'X' OR i.check9 = 'X' OR
               i.check10 = 'X' OR i.check11 = 'X' OR i.check12 = 'X')
        ) THEN r.id END)                                                      AS ng_count
    FROM apar_records r
    WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
    GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')
  `
},
        // 2. FIRE ALARM
        {
          name: 'fire-alarm',
          sql: `
            SELECT
              TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM fire_alarm_items i
                  WHERE i.record_id = r.id
                    AND (i.alarm_bell = 'NG' OR i.indicator_lamp = 'NG'
                      OR i.manual_call_point = 'NG' OR i.kebersihan = 'NG')
                ) THEN r.id END)                                                        AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM fire_alarm_items i
                  WHERE i.record_id = r.id
                    AND (i.alarm_bell = 'NG' OR i.indicator_lamp = 'NG'
                      OR i.manual_call_point = 'NG' OR i.kebersihan = 'NG')
                ) THEN r.id END)                                                        AS ng_count
            FROM fire_alarm_records r
            WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
            GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')
          `
        },

        // 3. EMERGENCY LAMP
        {
          name: 'emergency-lamp',
          sql: `
            SELECT
              TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM emergency_lamp_items i
                  WHERE i.record_id = r.id
                    AND (i.kondisi_lampu = 'NG' OR i.indicator_lamp = 'NG'
                      OR i.battery_charger = 'NG' OR i.id_number = 'NG'
                      OR i.kebersihan = 'NG' OR i.kondisi_kabel = 'NG')
                ) THEN r.id END)                                                        AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM emergency_lamp_items i
                  WHERE i.record_id = r.id
                    AND (i.kondisi_lampu = 'NG' OR i.indicator_lamp = 'NG'
                      OR i.battery_charger = 'NG' OR i.id_number = 'NG'
                      OR i.kebersihan = 'NG' OR i.kondisi_kabel = 'NG')
                ) THEN r.id END)                                                        AS ng_count
            FROM emergency_lamp_records r
            WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
            GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')
          `
        },

        // 4. APD
        {
          name: 'apd',
          sql: `
            SELECT
              TO_CHAR(DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM apd_items i
                  WHERE i.record_id = r.id
                    AND (i.keterangan IS NOT NULL AND i.keterangan <> '')
                ) THEN r.id END)                                                        AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM apd_items i
                  WHERE i.record_id = r.id
                    AND (i.keterangan IS NOT NULL AND i.keterangan <> '')
                ) THEN r.id END)                                                        AS ng_count
            FROM apd_records r
            WHERE DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta') BETWEEN $1 AND $2
            GROUP BY DATE(r.submitted_at AT TIME ZONE 'Asia/Jakarta')
          `
        },

        // 5. TOILET
        {
          name: 'toilet',
          sql: `
            SELECT
              TO_CHAR(inspection_date, 'YYYY-MM-DD')                          AS date,
              COUNT(DISTINCT CASE WHEN overall_status = 'OK' THEN id END)     AS ok_count,
              COUNT(DISTINCT CASE WHEN overall_status = 'NG' THEN id END)     AS ng_count
            FROM toilet_inspections
            WHERE inspection_date BETWEEN $1 AND $2
            GROUP BY inspection_date
          `
        },

        // 6. ELECTRICAL
        {
          name: 'electrical',
          sql: `
            SELECT
              TO_CHAR(r.tanggal, 'YYYY-MM-DD')                                AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM electrical_inspection_details d
                  WHERE d.inspection_id = r.id AND d.hasil = 'NOK'
                ) THEN r.id END)                                               AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM electrical_inspection_details d
                  WHERE d.inspection_id = r.id AND d.hasil = 'NOK'
                ) THEN r.id END)                                               AS ng_count
            FROM electrical_inspections r
            WHERE r.tanggal BETWEEN $1 AND $2
            GROUP BY r.tanggal
          `
        },

        // 7. EXIT LAMP
        {
          name: 'exit-lamp',
          sql: `
            SELECT
              TO_CHAR(r.checklist_date, 'YYYY-MM-DD')                         AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM exit_lamp_checklist_items i
                  WHERE i.checklist_id = r.id
                    AND (i.kondisi_lampu = 'NG' OR i.indikator_lampu = 'NG'
                      OR i.kebersihan = 'NG')
                ) THEN r.id END)                                               AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM exit_lamp_checklist_items i
                  WHERE i.checklist_id = r.id
                    AND (i.kondisi_lampu = 'NG' OR i.indikator_lampu = 'NG'
                      OR i.kebersihan = 'NG')
                ) THEN r.id END)                                               AS ng_count
            FROM exit_lamp_checklists r
            WHERE r.checklist_date BETWEEN $1 AND $2
            GROUP BY r.checklist_date
          `
        },

        // 8. PINTU DARURAT
        {
          name: 'pintu-darurat',
          sql: `
            SELECT
              TO_CHAR(r.checklist_date, 'YYYY-MM-DD')                         AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM pintu_darurat_checklist_items i
                  WHERE i.checklist_id = r.id
                    AND (i.kondisi_pintu = 'NG' OR i.area_sekitar = 'NG'
                      OR i.palu_alat_bantu = 'NG' OR i.identitas_pintu = 'NG'
                      OR i.id_peringatan = 'NG' OR i.door_closer = 'NG')
                ) THEN r.id END)                                               AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM pintu_darurat_checklist_items i
                  WHERE i.checklist_id = r.id
                    AND (i.kondisi_pintu = 'NG' OR i.area_sekitar = 'NG'
                      OR i.palu_alat_bantu = 'NG' OR i.identitas_pintu = 'NG'
                      OR i.id_peringatan = 'NG' OR i.door_closer = 'NG')
                ) THEN r.id END)                                               AS ng_count
            FROM pintu_darurat_checklists r
            WHERE r.checklist_date BETWEEN $1 AND $2
            GROUP BY r.checklist_date
          `
        },

        // 9. TITIK KUMPUL (2 tabel)
        {
          name: 'titik-kumpul',
          sql: `
            SELECT
              TO_CHAR(r.checklist_date, 'YYYY-MM-DD')                         AS date,
              COUNT(DISTINCT CASE
                WHEN NOT EXISTS (
                  SELECT 1 FROM titik_kumpul_items i
                  WHERE i.checklist_id = r.id
                    AND (i.area_aman = 'NG' OR i.identitas_titik_kumpul = 'NG'
                      OR i.area_mobil_pmk = 'NG')
                )
                AND NOT EXISTS (
                  SELECT 1 FROM jalur_evakuasi_items j
                  WHERE j.checklist_id = r.id AND j.hasil_cek = 'NG'
                )
                THEN r.id END)                                                 AS ok_count,
              COUNT(DISTINCT CASE
                WHEN EXISTS (
                  SELECT 1 FROM titik_kumpul_items i
                  WHERE i.checklist_id = r.id
                    AND (i.area_aman = 'NG' OR i.identitas_titik_kumpul = 'NG'
                      OR i.area_mobil_pmk = 'NG')
                )
                OR EXISTS (
                  SELECT 1 FROM jalur_evakuasi_items j
                  WHERE j.checklist_id = r.id AND j.hasil_cek = 'NG'
                )
                THEN r.id END)                                                 AS ng_count
            FROM titik_kumpul_checklists r
            WHERE r.checklist_date BETWEEN $1 AND $2
            GROUP BY r.checklist_date
          `
        },
      ];

      // ─── Jalankan semua query, skip jika error ────────────────────────────────
      for (const q of queries) {
        try {
          const result = await pool.query(q.sql, p);
          console.log(`✅ ${q.name}: ${result.rows.length} rows`);
          allData.push(...result.rows);
        } catch (err) {
          console.error(`❌ Error querying ${q.name}:`, err);
          // Lanjutkan ke query berikutnya, jangan crash seluruh handler
        }
      }

      // ─── Aggregate by date ────────────────────────────────────────────────────
      // row.date sudah string 'YYYY-MM-DD' dari TO_CHAR — tidak perlu new Date()
      const aggregatedByDate = new Map<string, { ok: number; ng: number }>();

      for (const row of allData) {
        const date: string = row.date;
        const ok  = parseInt(row.ok_count)  || 0;
        const ng  = parseInt(row.ng_count)  || 0;

        const current = aggregatedByDate.get(date) ?? { ok: 0, ng: 0 };
        current.ok += ok;
        current.ng += ng;
        aggregatedByDate.set(date, current);
      }

      const formattedData: any[] = [];
      for (const [date, counts] of aggregatedByDate.entries()) {
        if (counts.ok > 0) formattedData.push({ date, status: 'OK', count: counts.ok });
        if (counts.ng > 0) formattedData.push({ date, status: 'NG', count: counts.ng });
      }

      formattedData.sort((a, b) => a.date.localeCompare(b.date));

      console.log('📊 ALL aggregated:', {
        totalRows   : allData.length,
        uniqueDates : aggregatedByDate.size,
        outputLength: formattedData.length,
        sample      : formattedData.slice(0, 3),
      });

      return NextResponse.json({ success: true, data: formattedData });
    }

    // ========================================
    // ❌ FALLBACK: Slug tidak dikenali
    // ========================================
    return NextResponse.json(
      { error: 'Invalid slug parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}