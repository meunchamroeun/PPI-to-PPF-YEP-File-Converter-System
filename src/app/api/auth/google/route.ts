import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { saveUserRecord, getUserByEmailOrUsername } from "@/lib/db/pg";

const JWT_SECRET = process.env.JWT_SECRET || "yamaha-converter-dev-secret-key-2026";

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/auth/google
 * ==============================================================================
 * Simulates or verifies Google OAuth credential token
 */
export async function POST(req: NextRequest) {
  try {
    const { email, name, avatar, role } = await req.json();

    const targetEmail = email || "artist@yamaha-studio.com";
    const existing = await getUserByEmailOrUsername(targetEmail);

    const isSystemAdmin = targetEmail.toLowerCase().includes("admin") || role === "ADMIN";

    const savedUser = await saveUserRecord({
      id: existing ? existing.id : "usr_g_" + Math.random().toString(36).substring(2, 9),
      email: targetEmail,
      name: name || (existing ? existing.name : "Alex Thorne (Expansion Designer)"),
      avatar: avatar || (existing ? existing.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"),
      provider: "GOOGLE",
      role: existing ? existing.role : isSystemAdmin ? "ADMIN" : "USER",
      status: "ACTIVE",
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
