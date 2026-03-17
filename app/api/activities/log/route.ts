// app/api/activities/log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      activity_type,
      activity_category,
      description,
      form_slug,
      record_id,
      metadata,
      user_id,
      page_url,
    } = body;

    if (!activity_type) {
      return NextResponse.json(
        { success: false, message: 'activity_type is required' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    
    // Simple user agent parsing
    let deviceType = 'desktop';
    let browserName = 'unknown';
    let osName = 'unknown';

    if (userAgent) {
      if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
        deviceType = 'mobile';
      } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
        deviceType = 'tablet';
      }

      if (userAgent.includes('Chrome')) browserName = 'Chrome';
      else if (userAgent.includes('Firefox')) browserName = 'Firefox';
      else if (userAgent.includes('Safari')) browserName = 'Safari';
      else if (userAgent.includes('Edge')) browserName = 'Edge';

      if (userAgent.includes('Windows')) osName = 'Windows';
      else if (userAgent.includes('Mac')) osName = 'MacOS';
      else if (userAgent.includes('Linux')) osName = 'Linux';
      else if (userAgent.includes('Android')) osName = 'Android';
      else if (userAgent.includes('iOS')) osName = 'iOS';
    }

    // Get user_id from header if not provided in body
    const userId = user_id || req.headers.get('x-user-id') || 'anonymous';

    const insertQuery = `
      INSERT INTO user_activities (
        id, user_id, activity_type, activity_category, description,
        ip_address, user_agent, device_type, browser_name, os_name,
        page_url, form_slug, record_id, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      id,
      userId,
      activity_type,
      activity_category || 'general',
      description || '',
      ip,
      userAgent,
      deviceType,
      browserName,
      osName,
      page_url || '',
      form_slug || '',
      record_id || '',
      metadata ? JSON.stringify(metadata) : null,
    ]);

    return NextResponse.json({ success: true, data: { id: result.rows[0].id } });
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to log activity' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const activityType = searchParams.get('activity_type');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = 'SELECT * FROM user_activities WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    if (activityType) {
      query += ` AND activity_type = $${paramIndex}`;
      params.push(activityType);
      paramIndex++;
    }
    if (dateFrom) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }
    if (dateTo) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM user_activities WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (userId) {
      countQuery += ` AND user_id = $${countParamIndex}`;
      countParams.push(userId);
      countParamIndex++;
    }
    if (activityType) {
      countQuery += ` AND activity_type = $${countParamIndex}`;
      countParams.push(activityType);
      countParamIndex++;
    }
    if (dateFrom) {
      countQuery += ` AND created_at >= $${countParamIndex}`;
      countParams.push(dateFrom);
      countParamIndex++;
    }
    if (dateTo) {
      countQuery += ` AND created_at <= $${countParamIndex}`;
      countParams.push(dateTo);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total) || 0;

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get activities' },
      { status: 500 }
    );
  }
}
