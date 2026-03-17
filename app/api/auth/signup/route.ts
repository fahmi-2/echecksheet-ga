// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, fullName, nik, department, role, password, confirmPassword } = await request.json();

    console.log('📝 Signup attempt:', { username, role, department });

    // Validasi required fields
    if (!username || !fullName || !nik || !department || !role || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi!' },
        { status: 400 }
      );
    }

    // Validasi role
    const validRoles = ['group-leader-qa', 'inspector-qa', 'inspector-ga', 'admin', 'eso'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid!' },
        { status: 400 }
      );
    }

    // Validasi password
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter!' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Password dan konfirmasi tidak cocok!' },
        { status: 400 }
      );
    }

    // Validasi role ↔ departemen
    const validDepartments: Record<string, string[]> = {
      'group-leader-qa': ['quality-assurance'],
      'inspector-qa': ['quality-assurance'],
      'inspector-ga': ['general-affairs'],
      'admin': ['admin'],
      'eso': ['k3'],
    };

    if (!validDepartments[role] || !validDepartments[role].includes(department)) {
      const deptLabels = (validDepartments[role] || [])
        .map(d => {
          const map: Record<string, string> = {
            'quality-assurance': 'Quality Assurance',
            'general-affairs': 'General Affairs',
            'admin': 'Admin',
            'k3': 'K3/ESO',
          };
          return map[d] || d;
        })
        .join(', ');
      
      return NextResponse.json(
        { error: `Role ${role} hanya boleh memilih departemen: ${deptLabels}` },
        { status: 400 }
      );
    }

    // ✅ PostgreSQL: Cek duplikat username atau NIK
    const duplicateCheck = await pool.query(
      `SELECT id FROM users WHERE username = $1 OR nik = $2`,
      [username.trim(), nik.trim()]
    );

    if (duplicateCheck.rows.length > 0) {
      console.log('⚠️ Duplicate user detected:', username.trim());
      return NextResponse.json(
        { error: 'Username atau NIK sudah terdaftar!' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate ID unik - lebih baik pakai UUID untuk production
    // Tapi untuk kompatibilitas dengan sistem lama, kita pertahankan format lama
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    console.log('💾 Creating new user:', userId);

    // ✅ PostgreSQL: Simpan ke database dengan RETURNING
    const insertResult = await pool.query(
      `INSERT INTO users 
       (id, username, full_name, nik, department, role, password_hash, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, CURRENT_TIMESTAMP)
       RETURNING id, username, full_name, nik, department, role`,
      [
        userId,
        username.trim(),
        fullName.trim(),
        nik.trim(),
        department,
        role,
        hashedPassword
      ]
    );

    const newUser = insertResult.rows[0];
    console.log('✅ User created successfully:', newUser);
    
    // ⚠️ SECURITY: Jangan return password hash atau data sensitif
    return NextResponse.json(
      { 
        success: true, 
        message: 'Pendaftaran berhasil! Silakan login.',
        user: {
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.full_name,
          nik: newUser.nik,
          department: newUser.department,
          role: newUser.role,
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Signup error:', error);
    
    // PostgreSQL specific error handling
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'Username atau NIK sudah terdaftar!' },
        { status: 409 }
      );
    }
    
    if (error.code === '23502') { // NOT NULL violation
      return NextResponse.json(
        { error: 'Data wajib tidak boleh kosong!' },
        { status: 400 }
      );
    }
    
    if (error.code === '28P01') { // Invalid password for PostgreSQL connection
      return NextResponse.json(
        { error: 'Kesalahan koneksi database. Hubungi administrator.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat pendaftaran. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}