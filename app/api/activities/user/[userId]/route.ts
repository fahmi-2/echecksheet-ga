// app/api/activities/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user activities
    const activitiesQuery = `
      SELECT 
        id,
        user_id,
        activity_type,
        activity_category,
        description,
        page_url,
        form_slug,
        record_id,
        device_type,
        browser_name,
        os_name,
        metadata,
        created_at
      FROM user_activities
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const activitiesResult = await pool.query(activitiesQuery, [userId, limit, offset]);
    const activities = activitiesResult.rows;

    // Get summary counts
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as today_activities,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as week_activities,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as month_activities
      FROM user_activities
      WHERE user_id = $1
    `;

    const summaryResult = await pool.query(summaryQuery, [userId]);
    const summary = summaryResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        activities: activities.map((a: any) => ({
          id: a.id,
          activity_type: a.activity_type,
          activity_category: a.activity_category,
          description: a.description,
          page_url: a.page_url,
          form_slug: a.form_slug,
          created_at: a.created_at,
          device_type: a.device_type,
          browser_name: a.browser_name,
        })),
        summary: {
          total_activities: parseInt(summary.total_activities) || 0,
          today_activities: parseInt(summary.today_activities) || 0,
          week_activities: parseInt(summary.week_activities) || 0,
          month_activities: parseInt(summary.month_activities) || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get user activities' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await req.json();
    const {
      activity_type,
      activity_category,
      description,
      form_slug,
      record_id,
      metadata,
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

    return NextResponse.json({
      success: true,
      data: { id: result.rows[0].id },
    });
  } catch (error) {
    console.error('Log user activity error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to log activity' },
      { status: 500 }
    );
  }
}
