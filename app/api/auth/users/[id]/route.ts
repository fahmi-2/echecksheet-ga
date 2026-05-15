// app/api/auth/users/[id]/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcryptjs"; // ✅ Gunakan bcryptjs (konsisten dengan signup)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// ✅ PUT - Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Next.js 15+: params is a Promise
    const headers = request.headers;
    const userRole = headers.get("x-user-role");
    
    console.log('🔐 [PUT /api/auth/users/:id] Auth check:', { userId: id, adminRole: userRole });
    
    if (!["admin", "superadmin"].includes(userRole || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { username, fullName, nik, department, role, newPassword, isActive } = body;

    // Validasi input wajib
    if (!username?.trim() || !fullName?.trim() || !nik?.trim() || !role) {
      return NextResponse.json({ error: "Field username, fullName, nik, dan role wajib diisi" }, { status: 400 });
    }

    // Validasi role ↔ department
    const validDepartments: Record<string, string[]> = {
      "inspector-ga-fire": ["general-affairs", "ga"],
      "inspector-ga-equipment": ["general-affairs", "ga"],
      "inspector-ga-electrical": ["general-affairs", "ga"],
      "inspector-ga-personal": ["general-affairs", "ga"],
      "inspector-ga-facility": ["general-affairs", "ga"],
      "inspector-ga": ["general-affairs", "ga"],
      "inspector-qa": ["quality", "qa", "quality-assurance"],
      "group-leader-qa": ["quality", "qa", "quality-assurance"],
      "admin": ["admin"],
      "eso": ["k3"],
    };

    if (role && department && !validDepartments[role]?.includes(department)) {
      return NextResponse.json({ 
        error: `Role "${role}" tidak kompatibel dengan departemen "${department}"` 
      }, { status: 400 });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    updates.push(`username = $${idx++}`); values.push(username.trim());
    updates.push(`full_name = $${idx++}`); values.push(fullName.trim());
    updates.push(`nik = $${idx++}`); values.push(nik.trim());
    updates.push(`department = $${idx++}`); values.push(department);
    updates.push(`role = $${idx++}`); values.push(role);
    
    if (isActive !== undefined) {
      updates.push(`is_active = $${idx++}`); values.push(isActive);
    }

    // Handle password reset (jika ada newPassword)
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.push(`password_hash = $${idx++}`); values.push(hashedPassword); // ✅ Gunakan password_hash (konsisten dengan tabel)
      console.log('🔑 [PUT] Password reset requested for user:', id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id); // ID untuk WHERE clause

    const query = `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      RETURNING id, username, full_name, nik, department, role, is_active, updated_at
    `;

    console.log('🗄️ [PUT /api/auth/users/:id] Query:', query);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const updatedUser = result.rows[0];
    console.log('✅ [PUT /api/auth/users/:id] Success:', updatedUser.username);
    
    // ✅ PERBAIKAN: Tambahkan key "user" pada object
    return NextResponse.json({ 
      success: true, 
      message: "User berhasil diupdate",
      user: {  // ← Ditambahkan key "user"
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.full_name,
        nik: updatedUser.nik,
        department: updatedUser.department,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        updatedAt: updatedUser.updated_at,
      }
    });

  } catch (error) {
    console.error("❌ [PUT /api/auth/users/:id] Error:", error);
    return NextResponse.json({ 
      error: "Failed to update user", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// ✅ DELETE - Soft delete user (set is_active = false)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = request.headers;
    const userRole = headers.get("x-user-role");
    
    if (!["admin", "superadmin"].includes(userRole || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete: set is_active = false
    const result = await pool.query(
      `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, username`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    console.log('✅ [DELETE /api/auth/users/:id] User deactivated:', result.rows[0].username);
    
    return NextResponse.json({ 
      success: true, 
      message: "User berhasil dinonaktifkan",
      data: { id: result.rows[0].id, username: result.rows[0].username }
    });

  } catch (error) {
    console.error("❌ [DELETE /api/auth/users/:id] Error:", error);
    return NextResponse.json({ 
      error: "Failed to deactivate user", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}