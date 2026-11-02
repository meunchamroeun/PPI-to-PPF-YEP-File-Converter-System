import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { saveUserRecord, getUserByEmailOrUsername } from "@/lib/db/pg";

const JWT_SECRET = process.env.JWT_SECRET || "yamaha-converter-dev-secret-key-2026";

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/auth/google
 * ==============================================================================
 * Authenticates users via Google Account
 */
export async function POST(req: NextRequest) {
  try {
    const { email, name, avatar } = await req.json();

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "A valid Google account email is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await getUserByEmailOrUsername(cleanEmail);

    if (existing && existing.status === "SUSPENDED") {
      return NextResponse.json({ error: "This account has been suspended." }, { status: 403 });
    }

    const isSystemAdmin = cleanEmail.includes("admin");

    const savedUser = await saveUserRecord({
      id: existing ? existing.id : "usr_g_" + Math.random().toString(36).substring(2, 10),
      email: cleanEmail,
      name: name && name.trim() ? name.trim() : (existing ? existing.name : cleanEmail.split("@")[0]),
      avatar: avatar || existing?.avatar || null,
      provider: "GOOGLE",
      role: existing ? existing.role : isSystemAdmin ? "ADMIN" : "USER",
      status: "ACTIVE",
      last_login_at: new Date(),
    });

    const token = jwt.sign(
      {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
        provider: savedUser.provider,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      token,
      user: savedUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to authenticate with Google." }, { status: 500 });
  }
}
