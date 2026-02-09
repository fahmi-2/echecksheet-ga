// app/api/emergency-lamp/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface EmergencyItem {
  no: number;
  lokasi: string;
  id: string;
  kondisiLampu: string;
  indicatorLamp: string;
  batteryCharger: string;
  idNumber: string;
  kebersihan: string;
  kondisiKabel: string;
  keterangan?: string;
  tindakanPerbaikan?: string;
  pic: string;
  foto?: string;
}

interface SubmitData {
  date: string;
  area: string;
  checker: string;
  checkerNik?: string;
  items: EmergencyItem[];
}

export async function POST(request: NextRequest) {
  try {
    const data: SubmitData = await request.json();

    // Validasi data
    if (!data.date || !data.area || !data.checker || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Validasi semua item harus diisi
    for (const item of data.items) {
      if (
        !item.kondisiLampu ||
        !item.indicatorLamp ||
        !item.batteryCharger ||
        !item.idNumber ||
        !item.kebersihan ||
        !item.kondisiKabel
      ) {
        return NextResponse.json(
          { success: false, message: 'Semua kolom status harus diisi' },
          { status: 400 }
        );
      }
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Generate unique ID
      const recordId = `emergency-lamp-${data.area}-${Date.now()}`;

      // Insert ke emergency_lamp_records
      await connection.query(
        `INSERT INTO emergency_lamp_records (
          id, date, area, checker, checker_nik, submitted_at, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [recordId, data.date, data.area, data.checker, data.checkerNik || null]
      );

      // Insert items ke emergency_lamp_items
      for (const item of data.items) {
        await connection.query(
          `INSERT INTO emergency_lamp_items (
            record_id, no, lokasi, id_lamp, kondisi_lampu, indicator_lamp, 
            battery_charger, id_number, kebersihan, kondisi_kabel, keterangan, 
            tindakan_perbaikan, pic, foto, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            recordId,
            item.no,
            item.lokasi,
            item.id,
            item.kondisiLampu,
            item.indicatorLamp,
            item.batteryCharger,
            item.idNumber,
            item.kebersihan,
            item.kondisiKabel,
            item.keterangan || null,
            item.tindakanPerbaikan || null,
            item.pic,
            item.foto || null
          ]
        );
      }

      await connection.commit();
      
      // Cek apakah ada item dengan status NG
      const hasNg = data.items.some(
        (item) =>
          item.kondisiLampu === 'NG' ||
          item.indicatorLamp === 'NG' ||
          item.batteryCharger === 'NG' ||
          item.idNumber === 'NG' ||
          item.kebersihan === 'NG' ||
          item.kondisiKabel === 'NG'
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Data berhasil disimpan',
          data: {
            id: recordId,
            hasNg: hasNg
          }
        },
        { status: 200 }
      );
    } catch (error) {
      await connection.rollback();
      console.error('Transaction error:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Submit emergency lamp error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server',
        error: (error as any).message
      },
      { status: 500 }
    );
  }
}