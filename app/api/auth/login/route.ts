// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validasi input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi!' },
        { status: 400 }
      );
    }

    console.log('🔐 Login attempt for username:', username.trim());

    // ✅ PostgreSQL: Gunakan $1, $2 dan pool.query().rows
    const result = await pool.query(
      `SELECT id, username, full_name, nik, department, role, password_hash, is_active 
       FROM users 
       WHERE username = $1`,
      [username.trim()]
    );

    if (result.rows.length === 0) {
      console.log('❌ Username not found:', username.trim());
      return NextResponse.json(
        { error: 'Username atau password salah!' }, // Lebih aman: jangan bedakan username vs password
        { status: 401 }
      );
    }

    const user = result.rows[0];
    console.log('✅ User found:', user.username, 'Role:', user.role);

    // Cek status akun
    if (!user.is_active) {
      console.log('⚠️ Account inactive:', user.username);
      return NextResponse.json(
        { error: 'Akun tidak aktif. Hubungi administrator.' },
        { status: 403 }
      );
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', user.username);
      // ⚠️ SECURITY: Jangan bedakan error "username tidak ditemukan" vs "password salah"
      return NextResponse.json(
        { error: 'Username atau password salah!' },
        { status: 401 }
      );
    }

    console.log('✅ Login successful:', user.username);

    // Return user data (tanpa password hash)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          nik: user.nik,
          department: user.department,
          role: user.role,
        },
        // ⚠️ SECURITY: Jangan return token di sini! Generate token di client atau di route terpisah
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Login error:', error);
    
    // PostgreSQL specific error handling
    if (error.code === '28P01') {
      // Invalid password for PostgreSQL connection
      return NextResponse.json(
        { error: 'Kesalahan koneksi database. Hubungi administrator.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}