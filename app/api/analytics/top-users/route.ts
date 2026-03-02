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

    if (!slug || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // ========================================
    // ✅ HANDLER: ALL CATEGORY
    // ========================================
    if (slug.toLowerCase() === 'all') {
      console.log('👥 Querying ALL checksheets for top users...');
      
      const allQueries = [
        `SELECT checker as name, COUNT(DISTINCT id) as count FROM apar_records WHERE date >= $1 AND date <= $2 GROUP BY checker`,
        `SELECT checker as name, COUNT(DISTINCT id) as count FROM fire_alarm_records WHERE date >= $1 AND date <= $2 GROUP BY checker`,
        `SELECT checker as name, COUNT(DISTINCT id) as count FROM emergency_lamp_records WHERE date >= $1 AND date <= $2 GROUP BY checker`,
        `SELECT checker as name, COUNT(DISTINCT id) as count FROM apd_records WHERE date >= $1 AND date <= $2 GROUP BY checker`,
        `SELECT inspector_name as name, COUNT(DISTINCT id) as count FROM toilet_inspections WHERE inspection_date >= $1 AND inspection_date <= $2 GROUP BY inspector_name`,
        `SELECT pic as name, COUNT(DISTINCT id) as count FROM electrical_inspections WHERE tanggal >= $1 AND tanggal <= $2 GROUP BY pic`,
        `SELECT checker_name as name, COUNT(DISTINCT id) as count FROM exit_lamp_checklists WHERE checklist_date >= $1 AND checklist_date <= $2 GROUP BY checker_name`,
        `SELECT checker_name as name, COUNT(DISTINCT id) as count FROM pintu_darurat_checklists WHERE checklist_date >= $1 AND checklist_date <= $2 GROUP BY checker_name`,
        `SELECT checker_name as name, COUNT(DISTINCT id) as count FROM titik_kumpul_checklists WHERE checklist_date >= $1 AND checklist_date <= $2 GROUP BY checker_name`,
        `SELECT inspector as name, COUNT(DISTINCT id) as count FROM lift_barang_inspections WHERE inspection_date >= $1 AND inspection_date <= $2 GROUP BY inspector`,
      ];
      
      const allResults = [];
      const params = [dateFrom, dateTo];
      
      for (const query of allQueries) {
        try {
          const result = await pool.query(query, params);
          if (result.rows && result.rows.length > 0) {
            allResults.push(...result.rows);
          }
        } catch (err) {
          console.warn('⚠️ Table skipped:', (err as Error).message);
        }
      }
      
      const aggregated = new Map();
      allResults.forEach((row: any) => {
        const name = row.name || 'Unknown';
        const current = aggregated.get(name) || 0;
        aggregated.set(name, current + (parseInt(row.count) || 0));
      });
      
      const formattedData = Array.from(aggregated.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      console.log('👥 Top Users Result:', formattedData);
      
      return NextResponse.json({ success: true, data: formattedData });
    }

    // ========================================
    // ✅ HANDLER: SPECIFIC CATEGORIES
    // ========================================
    const area = searchParams.get('area');

    // ========================================
// ✅ APAR
// ========================================
if (slug.toLowerCase() === 'apar') {
  let query = `
    SELECT checker as name, COUNT(DISTINCT id) as count 
    FROM apar_records 
    WHERE date >= $1 AND date <= $2 
  `;
  const params: any[] = [dateFrom, dateTo];
  
  if (area && area !== 'All Category' && area !== 'APAR' && area !== 'Fire Alarm' && area !== 'Emergency Lamp') {
    query += `AND area = $${params.length + 1} `;
    params.push(area);
  }
  
  query += `GROUP BY checker ORDER BY count DESC LIMIT 5`;
  
  const result = await pool.query(query, params);
  return NextResponse.json({ success: true, data: result.rows || [] });
}

// ========================================
// ✅ FIRE ALARM
// ========================================
if (slug.toLowerCase() === 'fire-alarm') {
  let query = `
    SELECT checker as name, COUNT(DISTINCT id) as count 
    FROM fire_alarm_records 
    WHERE date >= $1 AND date <= $2 
  `;
  const params: any[] = [dateFrom, dateTo];
  
  if (area && area !== 'All Category' && area !== 'APAR' && area !== 'Fire Alarm' && area !== 'Emergency Lamp') {
    query += `AND zona = $${params.length + 1} `;
    params.push(area);
  }
  
  query += `GROUP BY checker ORDER BY count DESC LIMIT 5`;
  
  const result = await pool.query(query, params);
  return NextResponse.json({ success: true, data: result.rows || [] });
}

// ========================================
// ✅ EMERGENCY LAMP
// ========================================
if (slug.toLowerCase() === 'emergency-lamp') {
  let query = `
    SELECT checker as name, COUNT(DISTINCT id) as count 
    FROM emergency_lamp_records 
    WHERE date >= $1 AND date <= $2 
  `;
  const params: any[] = [dateFrom, dateTo];
  
  if (area && area !== 'All Category' && area !== 'APAR' && area !== 'Fire Alarm' && area !== 'Emergency Lamp') {
    query += `AND area = $${params.length + 1} `;
    params.push(area);
  }
  
  query += `GROUP BY checker ORDER BY count DESC LIMIT 5`;
  
  const result = await pool.query(query, params);
  return NextResponse.json({ success: true, data: result.rows || [] });
}

    // APD
    if (slug.toLowerCase() === 'apd') {
      const query = `
        SELECT checker as name, COUNT(DISTINCT id) as count 
        FROM apd_records 
        WHERE date >= $1 AND date <= $2 
        GROUP BY checker ORDER BY count DESC LIMIT 5
      `;
      const params: any[] = [dateFrom, dateTo];
      const result = await pool.query(query, params);
      return NextResponse.json({ success: true, data: result.rows || [] });
    }

    // TOILET
    if (slug.toLowerCase() === 'toilet') {
      const query = `
        SELECT inspector_name as name, COUNT(DISTINCT id) as count 
        FROM toilet_inspections 
        WHERE inspection_date >= $1 AND inspection_date <= $2 
        GROUP BY inspector_name ORDER BY count DESC LIMIT 5
      `;
      const params: any[] = [dateFrom, dateTo];
      const result = await pool.query(query, params);
      return NextResponse.json({ success: true, data: result.rows || [] });
    }

    // ELECTRICAL
    if (slug.toLowerCase() === 'electrical') {
      const query = `
        SELECT pic as name, COUNT(DISTINCT id) as count 
        FROM electrical_inspections 
        WHERE tanggal >= $1 AND tanggal <= $2 
        GROUP BY pic ORDER BY count DESC LIMIT 5
      `;
      const params: any[] = [dateFrom, dateTo];
      const result = await pool.query(query, params);
      return NextResponse.json({ success: true, data: result.rows || [] });
    }

    // EXIT LAMP
    if (slug.toLowerCase() === 'exit-lamp') {
      const query = `
        SELECT checker_name as name, COUNT(DISTINCT id) as count 
        FROM exit_lamp_checklists 
        WHERE checklist_date >= $1 AND checklist_date <= $2 
        GROUP BY checker_name ORDER BY count DESC LIMIT 5
      `;
      const params: any[] = [dateFrom, dateTo];
      const result = await pool.query(query, params);
      return NextResponse.json({ success: true, data: result.rows || [] });
    }

    // PINTU DARURAT
    if (slug.toLowerCase() === 'pintu-darurat') {
      const query = `
        SELECT checker_name as name, COUNT(DISTINCT id) as count 
        FROM pintu_darurat_checklists 
        WHERE checklist_date >= $1 AND checklist_date <= $2 
        GROUP BY checker_name ORDER BY count DESC LIMIT 5
      `;
      const params: any[] = [dateFrom, dateTo];
      const result = await pool.query(query, params);
      return NextResponse.json({ success: true, data: result.rows || [] });
    }

    // TITIK KUMPUL
    if (slug.toLowerCase() === 'titik-kumpul') {
      const query = `
        SELECT checker_name as name, COUNT(DISTINCT id) as count 
        FROM titik_kumpul_checklists 
        WHERE checklist_date >= $1 AND checklist_date <= $2 
        GROUP BY checker_name ORDER BY count DESC LIMIT 5
      `;
      const params: any[] = [dateFrom, dateTo];
      const result = await pool.query(query, params);
      return NextResponse.json({ success: true, data: result.rows || [] });
    }

    // LIFT BARANG
    if (slug.toLowerCase() === 'lift-barang') {
      const query = `
        SELECT inspector as name, COUNT(DISTINCT id) as count 
        FROM lift_barang_inspections 
        WHERE inspection_date >= $1 AND inspection_date <= $2 
        GROUP BY inspector ORDER BY count DESC LIMIT 5
      `;
      const params: any[] = [dateFrom, dateTo];
      const result = await pool.query(query, params);
      return NextResponse.json({ success: true, data: result.rows || [] });
    }

    return NextResponse.json({ success: true, data: [] });

  } catch (error) {
    console.error('❌ Top Users API error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}