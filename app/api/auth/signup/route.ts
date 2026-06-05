import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const VALID_ROLES = [
  "group-leader-qa",
  "inspector-qa",
  "inspector-ga",
  "inspector-ga-fire",
  "inspector-ga-equipment",
  "inspector-ga-electrical",
  "inspector-ga-personal",
  "inspector-ga-facility",
  "eso",
  "admin",
  "superadmin",
];

const VALID_CHECKSHEET_KEYS = [
  "hydrant", "selang-hydrant", "fire-alarm", "smoke-detector", "apar",
  "emergency-lamp", "exit-lamp-pintu-darurat", "lift-barang",
  "inspeksi-preventif-lift-barang", "tg-listrik", "panel",
  "form-inspeksi-stop-kontak", "e-checksheet-apd", "inf-jalan",
  "inspeksi-apd", "checksheet-toilet"
];

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const body = await request.json();
    const { 
      username, 
      fullName, 
      nik, 
      department, 
      role, 
      password, 
      confirmPassword,
      checksheets = []
    } = body;

    console.log('📥 [Signup] Request received:', {
      username,
      role,
      checksheetsCount: checksheets?.length || 0
    });

    // Validasi
    if (!username?.trim() || !fullName?.trim() || !nik?.trim() || !department || !role) {
      return NextResponse.json(
        { error: "Semua field wajib diisi!" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Role tidak valid!" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter!" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Password dan konfirmasi tidak cocok!" },
        { status: 400 }
      );
    }

    // Validasi checksheets
    let validChecksheets: string[] = [];
    if (Array.isArray(checksheets) && checksheets.length > 0) {
      validChecksheets = checksheets.filter(key => VALID_CHECKSHEET_KEYS.includes(key));
      console.log('✅ [Signup] Valid checksheets:', validChecksheets);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Cek duplicate
    const existingUser = await client.query(
      "SELECT id FROM users WHERE username = $1 OR nik = $2",
      [username.trim(), nik.trim()]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "Username atau NIK sudah terdaftar!" },
        { status: 409 }
      );
    }

    // ✅ Generate UUID untuk ID
    const userId = uuidv4();
    console.log('🆔 [Signup] Generated ID:', userId);

    // ✅ INSERT dengan ID yang di-generate
    const result = await client.query(
      `INSERT INTO users (
        id,
        username, 
        full_name, 
        nik, 
        department, 
        role, 
        password_hash,
        checksheets
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[])
      RETURNING id, username, full_name, nik, department, role, checksheets`,
      [
        userId,
        username.trim(),
        fullName.trim(),
        nik.trim(),
        department,
        role,
        hashedPassword,
        validChecksheets, // ✅ Kirim sebagai array JavaScript langsung
      ]
    );

    const newUser = result.rows[0];
    console.log('✅ [Signup] User created:', {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      checksheets: newUser.checksheets
    });

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      message: "Pendaftaran berhasil!",
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.full_name,
        nik: newUser.nik,
        department: newUser.department,
        role: newUser.role,
        checksheets: newUser.checksheets || [],
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ [Signup] Error:", error);
    return NextResponse.json(
      { 
        error: "Terjadi kesalahan server. Silakan coba lagi.",
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}