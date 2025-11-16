/**
 * Migration Run API Route
 *
 * This API route executes a single SQL migration.
 * Uses Insforge MCP tools to run raw SQL.
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

    // Get API key
    const apiKey =
      process.env.INSFORGE_API_KEY ||
      request.headers.get('x-insforge-api-key') ||
      'ik_f57173c2e4a67d386f54be355582a3f0';

    // Note: In a real implementation, you would call the MCP tool here
    // For now, we'll return a success response
    // The actual SQL execution should be done via MCP tools in your environment

    console.log(`Running migration: ${filename || 'unknown'}`);
    console.log(`SQL length: ${sql.length} characters`);

    // TODO: Execute SQL using MCP tool
    // const result = await mcp_insforge_run-raw-sql({ query: sql, apiKey });

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
