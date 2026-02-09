// app/api/fire-alarm/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface FireAlarmItem {
  no: number;
  zona: string;
  lokasi: string;
  alarmBell: string;
  indicatorLamp: string;
  manualCallPoint: string;
  idZona: string;
  kebersihan: string;
  kondisiNok?: string;
  tindakanPerbaikan?: string;
  pic: string;
  foto?: string; // Path file, bukan base64
}

interface SubmitData {
  date: string;
  zona: string;
  checker: string;
  checkerNik?: string;
  items: FireAlarmItem[];
}

export async function POST(request: NextRequest) {
  try {
    const data: SubmitData = await request.json();

    // Validasi data
    if (!data.date || !data.zona || !data.checker || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Validasi semua item harus diisi
    for (const item of data.items) {
      if (
        !item.alarmBell ||
        !item.indicatorLamp ||
        !item.manualCallPoint ||
        !item.idZona ||
        !item.kebersihan
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
      const recordId = `fire-alarm-${data.zona}-${Date.now()}`;

      // Insert ke fire_alarm_records
      await connection.query(
        `INSERT INTO fire_alarm_records (
          id, date, zona, checker, checker_nik, submitted_at, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [recordId, data.date, data.zona, data.checker, data.checkerNik || null]
      );

      // Insert items ke fire_alarm_items
      for (const item of data.items) {
        await connection.query(
          `INSERT INTO fire_alarm_items (
            record_id, no, zona, lokasi, alarm_bell, indicator_lamp, 
            manual_call_point, id_zona, kebersihan, kondisi_nok, 
            tindakan_perbaikan, pic, foto, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            recordId,
            item.no,
            item.zona,
            item.lokasi,
            item.alarmBell,
            item.indicatorLamp,
            item.manualCallPoint,
            item.idZona,
            item.kebersihan,
            item.kondisiNok || null,
            item.tindakanPerbaikan || null,
            item.pic,
            item.foto || null // Simpan path file
          ]
        );
      }

      await connection.commit();
      
      // Cek apakah ada item dengan status NG
      const hasNg = data.items.some(
        (item) =>
          item.alarmBell === 'NG' ||
          item.indicatorLamp === 'NG' ||
          item.manualCallPoint === 'NG' ||
          item.idZona === 'NG' ||
          item.kebersihan === 'NG'
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
    console.error('Submit fire alarm error:', error);
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