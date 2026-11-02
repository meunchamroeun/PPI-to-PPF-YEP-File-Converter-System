import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { DbUserRecord, DbJobRecord } from "./pg";

/**
 * ==============================================================================
 * SUPABASE CLIENT & REPOSITORY SERVICE
 * ==============================================================================
 * Connects directly to Supabase PostgREST API when NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY are provided.
 */

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return supabase;
    } catch (err) {
      console.warn("Failed to initialize Supabase client:", err);
      return null;
    }
  }

  return null;
}

/**
 * Save or update user in Supabase
 */
export async function saveUserToSupabase(user: DbUserRecord): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from("users").upsert(
      {
        id: user.id,
        name: user.name,
        email: user.email || null,
        username: user.username || null,
        avatar: user.avatar || null,
        provider: user.provider,
        role: user.role,
        status: user.status,
        conversions_count: user.conversions_count,
        last_login_at: user.last_login_at.toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Supabase upsert user error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase user save failed:", err);
    return false;
  }
}

/**
 * Fetch all users from Supabase
 */
export async function fetchUsersFromSupabase(): Promise<DbUserRecord[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("users")
      .select("*")
      .order("last_login_at", { ascending: false });

    if (error || !data) return null;

    return data.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      avatar: u.avatar,
      provider: u.provider || "GUEST",
      role: u.role || "USER",
      status: u.status || "ACTIVE",
      created_at: new Date(u.created_at),
      last_login_at: new Date(u.last_login_at || u.created_at),
      conversions_count: u.conversions_count || 0,
    }));
  } catch (err) {
    return null;
  }
}

/**
 * Save job to Supabase
 */
export async function saveJobToSupabase(job: DbJobRecord): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from("conversion_jobs").upsert(
      {
        id: job.id,
        user_id: job.user_id || null,
        user_name: job.user_name || null,
        user_email: job.user_email || null,
        original_filename: job.original_filename,
        original_size_bytes: job.original_size_bytes,
        original_format: job.original_format,
        target_format: job.target_format,
        output_filename: job.output_filename || null,
        download_url: job.download_url || null,
        status: job.status,
        progress_percent: job.progress_percent,
        current_stage: job.current_stage || null,
        error_message: job.error_message || null,
        detected_signature: job.detected_signature || null,
        pack_name: job.pack_name || null,
        target_hardware: job.target_hardware || null,
        voices_count: job.voices_count || 0,
        styles_count: job.styles_count || 0,
        waves_count: job.waves_count || 0,
        created_at: job.created_at.toISOString(),
        completed_at: job.completed_at ? job.completed_at.toISOString() : null,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Supabase upsert job error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase job save failed:", err);
    return false;
  }
}

/**
 * Fetch all conversion jobs from Supabase
 */
export async function fetchJobsFromSupabase(userId?: string): Promise<DbJobRecord[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client
      .from("conversion_jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((j: any) => ({
      id: j.id,
      user_id: j.user_id,
      user_name: j.user_name,
      user_email: j.user_email,
      original_filename: j.original_filename,
      original_size_bytes: Number(j.original_size_bytes || 0),
      original_format: j.original_format,
      target_format: j.target_format,
      output_filename: j.output_filename,
      download_url: j.download_url,
      status: j.status,
      progress_percent: j.progress_percent || 0,
      current_stage: j.current_stage,
      error_message: j.error_message,
      detected_signature: j.detected_signature,
      pack_name: j.pack_name,
      target_hardware: j.target_hardware,
      voices_count: j.voices_count || 0,
      styles_count: j.styles_count || 0,
      waves_count: j.waves_count || 0,
      created_at: new Date(j.created_at),
      completed_at: j.completed_at ? new Date(j.completed_at) : undefined,
    }));
  } catch (err) {
    return null;
  }
}
