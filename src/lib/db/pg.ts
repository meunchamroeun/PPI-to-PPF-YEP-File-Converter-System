import { Pool } from "pg";

/**
 * ==============================================================================
 * POSTGRESQL DATABASE CLIENT WITH RESILIENT IN-MEMORY FALLBACK
 * ==============================================================================
 * Connects to PostgreSQL when DATABASE_URL is available; falls back to an
 * in-memory store so the app functions seamlessly in development/standalone mode.
 */

export interface DbJobRecord {
  id: string;
  original_filename: string;
  original_size_bytes: number;
  original_format: string;
  target_format: string;
  output_filename?: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress_percent: number;
  current_stage?: string;
  error_message?: string;
  detected_signature?: string;
  pack_name?: string;
  target_hardware?: string;
  voices_count: number;
  styles_count: number;
  waves_count: number;
  created_at: Date;
  completed_at?: Date;
}

const memoryJobs: Map<string, DbJobRecord> = new Map();

let pool: Pool | null = null;
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  } catch (err) {
    console.warn("PostgreSQL connection error, using in-memory store:", err);
  }
}

export async function saveJobRecord(job: Partial<DbJobRecord> & { id: string }): Promise<DbJobRecord> {
  const record: DbJobRecord = {
    original_filename: "unknown.ppi",
    original_size_bytes: 0,
    original_format: "PPI",
    target_format: "PPF",
    status: "QUEUED",
    progress_percent: 0,
    current_stage: "Queued",
    voices_count: 0,
    styles_count: 0,
    waves_count: 0,
    created_at: new Date(),
    ...job,
    id: job.id,
  };

  memoryJobs.set(record.id, record);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO conversion_jobs 
         (id, original_filename, original_size_bytes, original_format, target_format, status, progress_percent, pack_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE 
         SET status = EXCLUDED.status, progress_percent = EXCLUDED.progress_percent`,
        [record.id, record.original_filename, record.original_size_bytes, record.original_format, record.target_format, record.status, record.progress_percent, record.pack_name]
      );
    } catch (e) {
      console.warn("Database query skipped, stored in memory:", e);
    }
  }

  return record;
}

export async function getJobRecord(id: string): Promise<DbJobRecord | null> {
  if (memoryJobs.has(id)) {
    return memoryJobs.get(id)!;
  }
  if (pool) {
    try {
      const res = await pool.query("SELECT * FROM conversion_jobs WHERE id = $1", [id]);
      if (res.rows.length > 0) return res.rows[0];
    } catch {
      // Fallback
    }
  }
  return null;
}

export async function getAllJobRecords(): Promise<DbJobRecord[]> {
  return Array.from(memoryJobs.values()).sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}
