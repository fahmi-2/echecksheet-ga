// app/api/fire-alarm/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const maxDuration = 60; // 60 detik timeout untuk upload besar

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const zona = formData.get('zona') as string;
    const lokasi = formData.get('lokasi') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validasi file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Format file tidak didukung. Gunakan JPEG, PNG, atau WEBP' },
        { status: 400 }
      );
    }

    // Validasi ukuran file (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'Ukuran file terlalu besar. Maksimal 5MB' },
        { status: 400 }
      );
    }

    // Buat filename unik
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const safeLokasi = lokasi.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `fire-alarm_${zona}_${safeLokasi}_${timestamp}.${fileExtension}`;
    
    // Path folder upload
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'fire-alarm');
    
    // Buat folder jika belum ada
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Simpan file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return path relatif (yang akan disimpan di database)
    const relativePath = `/uploads/fire-alarm/${filename}`;

    return NextResponse.json(
      {
        success: true,
        message: 'File berhasil diupload',
        data: {
          path: relativePath,
          filename: filename,
          size: file.size,
          type: file.type
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat upload file',
        error: (error as any).message
      },
      { status: 500 }
    );
  }
}