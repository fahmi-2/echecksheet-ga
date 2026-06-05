import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  let client;
  
  try {
    console.log('📥 [Login] Request received');
    
    const body = await request.json();
    const { username, password } = body;

    console.log('📥 [Login] Username:', username);

    if (!username?.trim() || !password) {
      console.log('❌ [Login] Missing credentials');
      return NextResponse.json(
        { error: "Username dan password harus diisi!" },
        { status: 400 }
      );
    }

    try {
      client = await pool.connect();
      console.log('✅ [Login] Database connected');
    } catch (dbError: any) {
      console.error('❌ [Login] Database connection failed:', dbError.message);
      return NextResponse.json(
        { 
          error: "Database connection error. Silakan coba lagi.",
          details: dbError.message 
        },
        { status: 503 }
      );
    }

    const result = await client.query(
      `SELECT 
        id, 
        username, 
        full_name, 
        nik, 
        department, 
        role, 
        password_hash,
        is_active,
        checksheets
      FROM users 
      WHERE username = $1`,
      [username.trim()]
    );

    if (result.rows.length === 0) {
      console.log('❌ [Login] User not found:', username);
      return NextResponse.json(
        { error: "Username atau password salah!" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    if (user.is_active === false) {
      console.log('❌ [Login] Account inactive:', username);
      return NextResponse.json(
        { error: "Akun tidak aktif! Hubungi administrator." },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log('❌ [Login] Invalid password for:', username);
      return NextResponse.json(
        { error: "Username atau password salah!" },
        { status: 401 }
      );
    }

    // ✅ Parse checksheets - sudah array dari PostgreSQL
    let checksheets: string[] = [];
    if (user.checksheets) {
      if (Array.isArray(user.checksheets)) {
        checksheets = user.checksheets;
      } else if (typeof user.checksheets === 'string') {
        // Fallback jika masih string
        try {
          const arrayString = user.checksheets.trim();
          if (arrayString !== '{}' && arrayString.length > 0) {
            const inner = arrayString.slice(1, -1);
            if (inner.length > 0) {
              checksheets = inner.split(',').map((s: string) => s.replace(/"/g, '').trim());
            }
          }
        } catch (parseError) {
          console.warn('⚠️ [Login] Failed to parse checksheets:', parseError);
        }
      }
    }

    // ✅ Update last_login_at dan total_logins
    await client.query(
      `UPDATE users 
       SET last_login_at = NOW(), 
           total_logins = COALESCE(total_logins, 0) + 1,
           last_login_ip = $2
       WHERE id = $1`,
      [user.id, request.headers.get('x-forwarded-for') || 'unknown']
    );

    console.log('✅ [Login] Success:', {
      username: user.username,
      role: user.role,
      checksheetsCount: checksheets.length
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        nik: user.nik,
        department: user.department,
        role: user.role,
        checksheets: checksheets,
      }
    });

  } catch (error: any) {
    console.error("❌ [Login] Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "Terjadi kesalahan server.",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}