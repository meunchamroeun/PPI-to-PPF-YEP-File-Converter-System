import { NextRequest, NextResponse } from "next/server";
import {
  getAllJobRecords,
  getUserJobRecords,
  saveJobRecord,
  deleteJobRecord,
  clearAllJobRecords,
} from "@/lib/db/pg";

/**
 * ==============================================================================
 * API ENDPOINT: /api/history
 * ==============================================================================
 * Manages conversion history audit records in PostgreSQL / Memory store
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const all = searchParams.get("all") === "true";

    let records;
    if (userId && !all) {
      records = await getUserJobRecords(userId);
    } else {
      records = await getAllJobRecords();
    }

    return NextResponse.json({
      success: true,
      history: records,
      totalCount: records.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const record = await saveJobRecord({
      id: body.id || "job_" + Math.random().toString(36).substring(2, 9),
      user_id: body.userId || body.user_id,
      user_name: body.userName || body.user_name,
      user_email: body.userEmail || body.user_email,
      original_filename: body.originalFilename || body.name || "pack.ppi",
      original_size_bytes: body.originalSizeBytes || body.size || 0,
      original_format: body.originalFormat || "PPI",
      target_format: body.targetFormat || "PPF",
      output_filename: body.outputFilename || body.output?.filename,
      download_url: body.downloadUrl || body.output?.downloadUrl,
      status: body.status || "COMPLETED",
      progress_percent: body.progress || 100,
      current_stage: body.stage || "Complete",
      error_message: body.errorMessage || body.notes,
      pack_name: body.packName,
      target_hardware: body.targetHardware,
      voices_count: body.voicesCount || 0,
      styles_count: body.stylesCount || 0,
      waves_count: body.wavesCount || 0,
      completed_at: new Date(),
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const userId = searchParams.get("userId");

    if (jobId) {
      const deleted = await deleteJobRecord(jobId);
      return NextResponse.json({ success: true, deleted });
    }

    const count = await clearAllJobRecords(userId || undefined);
    return NextResponse.json({ success: true, clearedCount: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
