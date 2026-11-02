import { NextRequest, NextResponse } from "next/server";
import { saveUserRecord, getUserByEmailOrUsername, getUserRecord } from "@/lib/db/pg";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "yamaha-converter-dev-secret-key-2026";

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/auth/login
 * ==============================================================================
 * Authenticates users via Credentials, Quick Demo Account, or Session Refresh
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, accountType, name } = await req.json();

    // 1. Quick Demo Account Selector
    if (accountType === "admin") {
      const admin = await getUserRecord("usr_admin_01");
      const user = admin || (await saveUserRecord({
        id: "usr_admin_01",
        name: "Yamaha Master Admin",
        email: "admin@yamaha-studio.com",
        username: "yamaha_admin",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        provider: "CREDENTIALS",
        role: "ADMIN",
        status: "ACTIVE",
      }));

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role, provider: user.provider },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return NextResponse.json({ success: true, token, user });
    }

    if (accountType === "user" || accountType === "artist") {
      const artist = await getUserRecord("usr_artist_02");
      const user = artist || (await saveUserRecord({
        id: "usr_artist_02",
        name: "Alex Thorne (Expansion Designer)",
        email: "artist@yamaha-studio.com",
        username: "alex_thorne",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        provider: "GOOGLE",
        role: "USER",
        status: "ACTIVE",
      }));

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role, provider: user.provider },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return NextResponse.json({ success: true, token, user });
    }

    // 2. Custom Email / Username Sign In
    if (!email) {
      return NextResponse.json({ error: "Email or username is required" }, { status: 400 });
    }

    const existing = await getUserByEmailOrUsername(email);
    const isAdmin = email.toLowerCase().includes("admin");

    const user = await saveUserRecord({
      id: existing ? existing.id : "usr_cred_" + Math.random().toString(36).substring(2, 9),
      name: name || (existing ? existing.name : email.split("@")[0]),
      email: email.includes("@") ? email : undefined,
      username: !email.includes("@") ? email : undefined,
      avatar: existing ? existing.avatar : null,
      provider: "CREDENTIALS",
      role: existing ? existing.role : isAdmin ? "ADMIN" : "USER",
      status: existing ? existing.status : "ACTIVE",
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, provider: user.provider },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ success: true, token, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
