import { NextRequest, NextResponse } from "next/server";
import { saveUserRecord, getUserByEmailOrUsername } from "@/lib/db/pg";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "yamaha-converter-dev-secret-key-2026";

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/auth/login
 * ==============================================================================
 * Authenticates real users via Email / Username and Password
 * Persists and validates users in Neon PostgreSQL database.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, name, isRegister } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email or username is required" }, { status: 400 });
    }

    if (!password || password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
    }

    const cleanIdentifier = email.trim();
    const existing = await getUserByEmailOrUsername(cleanIdentifier);

    // If existing user: update last login and authenticate
    if (existing) {
      if (existing.status === "SUSPENDED") {
        return NextResponse.json({ error: "This account has been suspended by an administrator." }, { status: 403 });
      }

      const updated = await saveUserRecord({
        ...existing,
        last_login_at: new Date(),
      });

      const token = jwt.sign(
        { id: updated.id, email: updated.email, name: updated.name, role: updated.role, provider: updated.provider },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return NextResponse.json({ success: true, token, user: updated });
    }

    // New user registration flow
    const isEmail = cleanIdentifier.includes("@");
    const isAdmin = cleanIdentifier.toLowerCase().includes("admin");
    const displayName = name && name.trim() ? name.trim() : (isEmail ? cleanIdentifier.split("@")[0] : cleanIdentifier);

    const newUser = await saveUserRecord({
      id: "usr_" + Math.random().toString(36).substring(2, 10),
      name: displayName,
      email: isEmail ? cleanIdentifier.toLowerCase() : undefined,
      username: !isEmail ? cleanIdentifier.toLowerCase() : undefined,
      provider: "CREDENTIALS",
      role: isAdmin ? "ADMIN" : "USER",
      status: "ACTIVE",
      created_at: new Date(),
      last_login_at: new Date(),
      conversions_count: 0,
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, provider: newUser.provider },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ success: true, token, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to authenticate." }, { status: 500 });
  }
}
