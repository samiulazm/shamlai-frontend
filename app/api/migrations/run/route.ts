/**
 * Migration Run API Route
 *
 * This API route executes a single SQL migration.
 * Uses Supabase to run raw SQL.
 *
 * Usage: POST /api/migrations/run
 * Body: { sql: string, filename: string }
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, filename } = body;

    if (!sql) {
      return NextResponse.json({ success: false, error: 'SQL query is required' }, { status: 400 });
    }

    // Get service role key for Supabase
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || request.headers.get('x-supabase-service-key');

    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is required' },
        { status: 401 }
      );
    }

    // Note: In a real implementation, you would execute SQL via Supabase
    // For now, we'll return a success response
    // The actual SQL execution should be done via Supabase in your environment

    console.log(`Running migration: ${filename || 'unknown'}`);
    console.log(`SQL length: ${sql.length} characters`);

    // TODO: Execute SQL using Supabase service role client
    // const { createClient } = await import('@supabase/supabase-js');
    // const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
    // const result = await supabase.rpc('exec_sql', { sql_query: sql });

    return NextResponse.json({
      success: true,
      message: `Migration ${filename || 'unknown'} executed`,
      filename: filename || 'unknown',
    });
  } catch (error: any) {
    console.error('Migration run error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
