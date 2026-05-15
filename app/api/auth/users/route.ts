// app/api/auth/users/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";

// ✅ Inisialisasi PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// ✅ GET - Fetch all users (Admin Only)
export async function GET(request: Request) {
  try {
    // ──────────────────────────────────────────────────────────────
    // 1. VALIDASI AUTH HEADER (Admin/Superadmin only)
    // ──────────────────────────────────────────────────────────────
    const headers = request.headers;
    const userRole = headers.get("x-user-role");
    const userId = headers.get("x-user-id");
    
    console.log('🔐 [GET /api/auth/users] Auth check:', { userRole, userId });
    
    if (!["admin", "superadmin"].includes(userRole || "")) {
      console.warn('⚠️ Unauthorized access attempt:', { userRole });
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    // ──────────────────────────────────────────────────────────────
    // 2. PARSE QUERY PARAMETERS
    // ──────────────────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const department = searchParams.get("department") || "";

    console.log('🔍 [GET /api/auth/users] Filters:', { search, role, department });

    // ──────────────────────────────────────────────────────────────
    // 3. BUILD QUERY DENGAN PARAMETERIZED QUERY (Anti SQL Injection)
    // ──────────────────────────────────────────────────────────────
    let query = `
      SELECT id, username, full_name, nik, department, role, is_active, created_at
      FROM users 
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (username ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex} OR nik ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    if (department) {
      query += ` AND department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    console.log('🗄️ [GET /api/auth/users] Query:', query, 'Params:', params);

    // ──────────────────────────────────────────────────────────────
    // 4. EXECUTE QUERY
    // ──────────────────────────────────────────────────────────────
    const result = await pool.query(query, params);

    // ──────────────────────────────────────────────────────────────
    // 5. FORMAT RESPONSE (JANGAN kirim password_hash!)
    // ──────────────────────────────────────────────────────────────
    const users = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      nik: row.nik,
      department: row.department,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      // ❌ JANGAN kirim: password_hash, email, atau data sensitif lainnya
    }));

    console.log(`✅ [GET /api/auth/users] Success: ${users.length} users returned`);
    
    return NextResponse.json({ 
      success: true, 
       users,
      count: users.length 
    });

  } catch (error) {
    console.error("❌ [GET /api/auth/users] Error:", error);
    
    // Log error detail untuk debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch users", 
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : String(error) : undefined 
      }, 
      { status: 500 }
    );
  }
}