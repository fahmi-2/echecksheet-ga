import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { area_code, inspection_date, toilet_type = 'laki_perempuan' } = req.query;

  try {
    if (!area_code || !inspection_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'area_code dan inspection_date diperlukan' 
      });
    }

    const [results] = await pool.query(
      `SELECT * FROM toilet_inspections 
       WHERE area_code = ? AND inspection_date = ? AND toilet_type = ?`,
      [area_code, inspection_date, toilet_type]
    );

    const inspections = results as any[];

    if (inspections.length > 0) {
      return res.status(200).json({ 
        success: true, 
        filled: true,
        data: inspections[0]
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        filled: false,
        data: null
      });
    }
  } catch (error) {
    console.error('Check status error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server' 
    });
  }
}