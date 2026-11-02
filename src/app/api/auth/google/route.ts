import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { saveUserRecord, getUserByEmailOrUsername, isUserAdmin } from "@/lib/db/pg";

const JWT_SECRET = process.env.JWT_SECRET || "yamaha-converter-dev-secret-key-2026";

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/auth/google
 * ==============================================================================
 * Authenticates users via Google Identity Services or Direct Google Account
 * Automatically designates meunchamroeun09@gmail.com as Master Admin
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let email = body.email;
    let name = body.name;
    let avatar = body.avatar;

    // Decode Google ID Token if passed from Google Identity Services
    if (body.credential) {
      try {
        const decoded: any = jwt.decode(body.credential);
        if (decoded && decoded.email) {
          email = decoded.email;
          name = decoded.name || name;
          avatar = decoded.picture || avatar;
        }
      } catch (e) {
        console.warn("Could not parse Google ID token:", e);
      }
    }

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "A valid Google account email is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await getUserByEmailOrUsername(cleanEmail);

    if (existing && existing.status === "SUSPENDED") {
      return NextResponse.json({ error: "This account has been suspended by an administrator." }, { status: 403 });
    }

    const isAdmin = isUserAdmin(cleanEmail) || existing?.role === "ADMIN";
    const isMeunAdmin = cleanEmail === "meunchamroeun09@gmail.com";

    const userId = existing
      ? existing.id
      : isMeunAdmin
      ? "usr_admin_meunchamroeun"
      : "usr_g_" + Math.random().toString(36).substring(2, 10);

    const displayName = isMeunAdmin
      ? "Meun Chamroeun"
      : (name && name.trim() ? name.trim() : (existing ? existing.name : cleanEmail.split("@")[0]));

    const profilePic = avatar || existing?.avatar || (isMeunAdmin ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" : null);

    const savedUser = await saveUserRecord({
      id: userId,
      email: cleanEmail,
      name: displayName,
      username: cleanEmail.split("@")[0],
      avatar: profilePic,
      provider: "GOOGLE",
      role: isAdmin ? "ADMIN" : "USER",
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
