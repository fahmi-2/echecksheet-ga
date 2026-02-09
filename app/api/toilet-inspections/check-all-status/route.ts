import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { area_codes, inspection_date, toilet_type = 'laki_perempuan' } = req.query;

  try {
    if (!area_codes || !inspection_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'area_codes dan inspection_date diperlukan' 
      });
    }

    const areasArray = String(area_codes).split(',');
    const placeholders = areasArray.map(() => '?').join(',');

    const [results] = await pool.query(
      `SELECT 
        area_code,
        CASE WHEN COUNT(id) > 0 THEN true ELSE false END as filled,
        MAX(overall_status) as status
       FROM toilet_inspections 
       WHERE area_code IN (${placeholders}) 
       AND inspection_date = ?
       AND toilet_type = ?
       GROUP BY area_code`,
      [...areasArray, inspection_date, toilet_type]
    );

    const statusMap = new Map<string, any>();
    
    // Initialize all areas as not filled
    areasArray.forEach(area => {
      statusMap.set(area, { area_code: area, filled: false, status: null });
    });

    // Update with actual data
    const inspectionsArray = results as any[];
    inspectionsArray.forEach((item: any) => {
      statusMap.set(item.area_code, {
        area_code: item.area_code,
        filled: !!item.filled,
        status: item.status
      });
    });

    const data = Array.from(statusMap.values());

    return res.status(200).json({ 
      success: true,
      data
    });
  } catch (error) {
    console.error('Check all status error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server' 
    });
  }
}
