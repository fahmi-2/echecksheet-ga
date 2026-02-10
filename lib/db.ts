// lib/db.ts

import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'e_checksheet_ga',
  max: 10,
});

// Helper untuk error handling
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export default pool;