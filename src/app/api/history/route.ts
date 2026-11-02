import { NextResponse } from "next/server";
import { getAllJobRecords } from "@/lib/db/pg";

/**
 * ==============================================================================
 * API ENDPOINT: GET /api/history
 * ==============================================================================
 * Returns conversion history log from PostgreSQL / memory store
 */
export async function GET() {
  try {
    const records = await getAllJobRecords();
    return NextResponse.json({ success: true, history: records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
