import { Pool } from "pg";
import {
  saveUserToSupabase,
  fetchUsersFromSupabase,
  saveJobToSupabase,
  fetchJobsFromSupabase,
} from "./supabase";

/**
 * ==============================================================================
 * POSTGRESQL DATABASE & USER STORE WITH RESILIENT IN-MEMORY FALLBACK
 * ==============================================================================
 * Connects to PostgreSQL when DATABASE_URL is available; falls back to an
 * in-memory store so the app functions seamlessly in development/standalone mode.
 */

export interface DbUserRecord {
  id: string;
  name: string;
  email?: string;
  username?: string;
  avatar?: string | null;
  provider: "GOOGLE" | "TELEGRAM" | "CREDENTIALS" | "GUEST";
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "SUSPENDED";
  created_at: Date;
  last_login_at: Date;
  conversions_count: number;
}

export interface DbJobRecord {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  original_filename: string;
  original_size_bytes: number;
  original_format: string;
  target_format: string;
  output_filename?: string;
  download_url?: string;
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

// In-Memory Fallback Stores
const memoryJobs: Map<string, DbJobRecord> = new Map();
const memoryUsers: Map<string, DbUserRecord> = new Map();

// Verified Master Administrator Account
const masterAdmin: DbUserRecord = {
  id: "usr_admin_meunchamroeun",
  name: "Meun Chamroeun",
  email: "meunchamroeun09@gmail.com",
  username: "meunchamroeun09",
  avatar: null,
  provider: "GOOGLE",
  role: "ADMIN",
  status: "ACTIVE",
  created_at: new Date(),
  last_login_at: new Date(),
  conversions_count: 0,
};

memoryUsers.set(masterAdmin.id, masterAdmin);

let pool: Pool | null = null;
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL;

if (dbUrl) {
  try {
    const isLocal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");
    pool = new Pool({
      connectionString: dbUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  } catch (err) {
    console.warn("PostgreSQL/Supabase connection error, using in-memory store:", err);
  }
}

/**
 * ==============================================================================
 * USER REPOSITORY METHODS
 * ==============================================================================
 */

export const ADMIN_EMAILS = [
  "meunchamroeun09@gmail.com",
];

export function isUserAdmin(identifier?: string): boolean {
  if (!identifier) return false;
  const lower = identifier.toLowerCase().trim();
  return (
    lower === "meunchamroeun09@gmail.com" ||
    ADMIN_EMAILS.includes(lower) ||
    lower.includes("admin")
  );
}

export async function saveUserRecord(user: Partial<DbUserRecord> & { id: string }): Promise<DbUserRecord> {
  const existing = memoryUsers.get(user.id);
  const isAdmin = isUserAdmin(user.email) || isUserAdmin(user.username) || user.role === "ADMIN" || existing?.role === "ADMIN";

  const record: DbUserRecord = {
    name: user.name || (user.email === "meunchamroeun09@gmail.com" ? "Meun Chamroeun" : "Expansion Artist"),
    email: user.email,
    username: user.username,
    avatar: user.avatar || null,
    provider: user.provider || "GUEST",
    role: isAdmin ? "ADMIN" : "USER",
    status: user.status || "ACTIVE",
    created_at: existing ? existing.created_at : new Date(),
    last_login_at: new Date(),
    conversions_count: (existing?.conversions_count || 0) + (user.conversions_count || 0),
    ...user,
    id: user.id,
  };

  memoryUsers.set(record.id, record);
  saveUserToSupabase(record).catch(() => {});

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO users 
         (id, name, email, username, avatar, provider, role, status, last_login_at, conversions_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE 
         SET name = EXCLUDED.name, role = EXCLUDED.role, status = EXCLUDED.status, last_login_at = EXCLUDED.last_login_at`,
        [record.id, record.name, record.email, record.username, record.avatar, record.provider, record.role, record.status, record.last_login_at, record.conversions_count]
      );
    } catch (e) {
      console.warn("PostgreSQL user query skipped, stored in memory:", e);
    }
  }

  return record;
}

export async function getUserRecord(id: string): Promise<DbUserRecord | null> {
  if (memoryUsers.has(id)) {
    return memoryUsers.get(id)!;
  }
  if (pool) {
    try {
      const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      if (res.rows.length > 0) return res.rows[0];
    } catch {}
  }
  return null;
}

export async function getUserByEmailOrUsername(identifier: string): Promise<DbUserRecord | null> {
  const idLower = identifier.toLowerCase();
  for (const user of memoryUsers.values()) {
    if (user.email?.toLowerCase() === idLower || user.username?.toLowerCase() === idLower) {
      return user;
    }
  }
  if (pool) {
    try {
      const res = await pool.query(
        "SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1 LIMIT 1",
        [idLower]
      );
      if (res.rows.length > 0) {
        const u = res.rows[0];
        memoryUsers.set(u.id, u);
        return u;
      }
    } catch (err) {
      console.warn("PostgreSQL getUserByEmailOrUsername error:", err);
    }
  }
  return null;
}

export async function getAllUserRecords(): Promise<DbUserRecord[]> {
  const isRealUser = (u: DbUserRecord) =>
    !u.email?.includes("yamaha-studio.com") &&
    !["usr_admin_01", "usr_artist_02", "usr_tg_88776655"].includes(u.id);

  if (pool) {
    try {
      const res = await pool.query(
        "SELECT * FROM users WHERE email NOT LIKE '%yamaha-studio.com%' AND id NOT IN ('usr_admin_01', 'usr_artist_02', 'usr_tg_88776655') ORDER BY last_login_at DESC"
      );
      if (res.rows.length > 0) {
        res.rows.forEach((u) => memoryUsers.set(u.id, u));
        return res.rows;
      }
    } catch (err) {
      console.warn("PostgreSQL getAllUserRecords error:", err);
    }
  }
  try {
    const supabaseUsers = await fetchUsersFromSupabase();
    if (supabaseUsers && supabaseUsers.length > 0) {
      supabaseUsers.forEach((u) => memoryUsers.set(u.id, u));
    }
  } catch {}
  return Array.from(memoryUsers.values())
    .filter(isRealUser)
    .sort((a, b) => b.last_login_at.getTime() - a.last_login_at.getTime());
}

export async function updateUserRole(userId: string, role: "ADMIN" | "USER"): Promise<DbUserRecord | null> {
  const user = memoryUsers.get(userId);
  if (user) {
    user.role = role;
    memoryUsers.set(userId, user);
    if (pool) {
      try {
        await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);
      } catch {}
    }
    return user;
  }
  return null;
}

export async function updateUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED"): Promise<DbUserRecord | null> {
  const user = memoryUsers.get(userId);
  if (user) {
    user.status = status;
    memoryUsers.set(userId, user);
    if (pool) {
      try {
        await pool.query("UPDATE users SET status = $1 WHERE id = $2", [status, userId]);
      } catch {}
    }
    return user;
  }
  return null;
}

export async function deleteUserRecord(userId: string): Promise<boolean> {
  const existed = memoryUsers.delete(userId);
  if (pool) {
    try {
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    } catch {}
  }
  return existed;
}

/**
 * ==============================================================================
 * JOB / CONVERSION REPOSITORY METHODS
 * ==============================================================================
 */

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
  saveJobToSupabase(record).catch(() => {});

  // If associated with a user, increment conversion count
  if (record.user_id && memoryUsers.has(record.user_id)) {
    const user = memoryUsers.get(record.user_id)!;
    user.conversions_count = (user.conversions_count || 0) + 1;
    memoryUsers.set(record.user_id, user);
  }

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO conversion_jobs 
         (id, user_id, original_filename, original_size_bytes, original_format, target_format, status, progress_percent, pack_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE 
         SET status = EXCLUDED.status, progress_percent = EXCLUDED.progress_percent`,
        [record.id, record.user_id, record.original_filename, record.original_size_bytes, record.original_format, record.target_format, record.status, record.progress_percent, record.pack_name]
      );
    } catch (e) {
      console.warn("PostgreSQL job query skipped, stored in memory:", e);
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
    } catch {}
  }
  return null;
}

export async function getAllJobRecords(): Promise<DbJobRecord[]> {
  try {
    const supabaseJobs = await fetchJobsFromSupabase();
    if (supabaseJobs && supabaseJobs.length > 0) {
      supabaseJobs.forEach((j) => memoryJobs.set(j.id, j));
    }
  } catch {}
  return Array.from(memoryJobs.values()).sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

export async function getUserJobRecords(userId: string): Promise<DbJobRecord[]> {
  try {
    const supabaseJobs = await fetchJobsFromSupabase(userId);
    if (supabaseJobs && supabaseJobs.length > 0) {
      supabaseJobs.forEach((j) => memoryJobs.set(j.id, j));
    }
  } catch {}
  return Array.from(memoryJobs.values())
    .filter((j) => j.user_id === userId)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

export async function deleteJobRecord(jobId: string): Promise<boolean> {
  const existed = memoryJobs.delete(jobId);
  if (pool) {
    try {
      await pool.query("DELETE FROM conversion_jobs WHERE id = $1", [jobId]);
    } catch {}
  }
  return existed;
}

export async function clearAllJobRecords(userId?: string): Promise<number> {
  if (userId) {
    let count = 0;
    for (const [id, job] of memoryJobs.entries()) {
      if (job.user_id === userId) {
        memoryJobs.delete(id);
        count++;
      }
    }
    return count;
  } else {
    const count = memoryJobs.size;
    memoryJobs.clear();
    return count;
  }
}
