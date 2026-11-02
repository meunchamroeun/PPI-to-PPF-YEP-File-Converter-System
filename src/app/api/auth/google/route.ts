import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "yamaha-converter-dev-secret-key-2026";

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/auth/google
 * ==============================================================================
 * Simulates or verifies Google OAuth credential token
 */
export async function POST(req: NextRequest) {
  try {
    const { credential, email, name, avatar } = await req.json();

    const user = {
      id: "usr_g_" + Math.random().toString(36).substring(2, 9),
      email: email || "musician@yamaha-studio.com",
      name: name || "Expansion Voice Artist",
      avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      provider: "GOOGLE",
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

    return NextResponse.json({
      success: true,
      token,
      user,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
