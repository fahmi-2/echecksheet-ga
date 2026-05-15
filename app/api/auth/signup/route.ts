// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

// 🔐 VALID ROLES - Sinkron dengan frontend
export const VALID_ROLES = [
  'group-leader-qa', 
  'inspector-qa', 
  'inspector-ga',           // ← Legacy
  'inspector-ga-fire',      // 🔥 Proteksi Kebakaran & Evakuasi
  'inspector-ga-equipment', // ⚙️ Pemeliharaan Peralatan
  'inspector-ga-electrical',// ⚡ Instalasi Listrik
  'inspector-ga-personal',  // 🦺 Keselamatan Personal & Prasarana
  'inspector-ga-facility',  // 🧹 Kebersihan Fasilitas
  'admin', 
  'eso'
] as const;

export type ValidRole = typeof VALID_ROLES[number];

// 🔗 Mapping Role → Departemen yang Diizinkan
export const ROLE_DEPARTMENT_MAP: Record<ValidRole, string[]> = {
  'group-leader-qa': ['quality-assurance'],
  'inspector-qa': ['quality-assurance'],
  'inspector-ga': ['general-affairs'],
  'inspector-ga-fire': ['general-affairs'],
  'inspector-ga-equipment': ['general-affairs'],
  'inspector-ga-electrical': ['general-affairs'],
  'inspector-ga-personal': ['general-affairs'],
  'inspector-ga-facility': ['general-affairs'],
  'admin': ['admin'],
  'eso': ['k3'],
};

// 🏷️ Label departemen untuk pesan error
const DEPT_LABELS: Record<string, string> = {
  'quality-assurance': 'Quality Assurance',
  'general-affairs': 'General Affairs',
  'admin': 'Admin',
  'k3': 'K3/ESO',
};

export async function POST(request: NextRequest) {
  try {
    const { username, fullName, nik, department, role, password, confirmPassword } = await request.json();

    console.log('📝 Signup attempt:', { username, role, department });

    // ✅ Validasi required fields
    if (!username || !fullName || !nik || !department || !role || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi!' },
        { status: 400 }
      );
    }

    // ✅ Validasi role dengan constant terpusat
    if (!VALID_ROLES.includes(role as ValidRole)) {
      return NextResponse.json(
        { error: 'Role tidak valid!' },
        { status: 400 }
      );
    }

    // ✅ Validasi password
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

    // ✅ Validasi role ↔ departemen dengan mapping terpusat
    const allowedDepts = ROLE_DEPARTMENT_MAP[role as ValidRole];
    if (!allowedDepts || !allowedDepts.includes(department)) {
      const deptLabels = (allowedDepts || [])
        .map(d => DEPT_LABELS[d] || d)
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

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate ID unik
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
    
    // ⚠️ SECURITY: Jangan return password hash
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