import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { saveUserRecord, isUserAdmin } from "@/lib/db/pg";

const JWT_SECRET = process.env.JWT_SECRET || "yamaha-converter-dev-secret-key-2026";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

/**
 * ==============================================================================
 * API ENDPOINT: GET /api/auth/google/callback
 * ==============================================================================
 * Handles standard Google OAuth 2.0 redirect code exchange
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = req.nextUrl.origin;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(error || "No authorization code provided")}`);
  }

  try {
    // Exchange authorization code for tokens with Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.id_token) {
      throw new Error(tokenData.error_description || tokenData.error || "Failed to exchange Google OAuth code");
    }

    // Decode Google ID Token
    const decoded: any = jwt.decode(tokenData.id_token);
    if (!decoded || !decoded.email) {
      throw new Error("Invalid Google user token received");
    }

    const cleanEmail = decoded.email.toLowerCase().trim();
    const isAdmin = isUserAdmin(cleanEmail);
    const isMeunAdmin = cleanEmail === "meunchamroeun09@gmail.com";

    const savedUser = await saveUserRecord({
      id: isMeunAdmin
        ? "usr_admin_meunchamroeun"
        : "usr_g_" + (decoded.sub || Math.random().toString(36).substring(2, 10)),
      email: cleanEmail,
      name: decoded.name || (isMeunAdmin ? "Meun Chamroeun" : cleanEmail.split("@")[0]),
      username: cleanEmail.split("@")[0],
      avatar: decoded.picture || (isMeunAdmin ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" : null),
      provider: "GOOGLE",
      role: isAdmin ? "ADMIN" : "USER",
      status: "ACTIVE",
      last_login_at: new Date(),
    });

    const sessionToken = jwt.sign(
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

    const userJson = encodeURIComponent(JSON.stringify(savedUser));
    return NextResponse.redirect(`${baseUrl}/?auth_success=true&session=${encodeURIComponent(sessionToken)}&user=${userJson}`);
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(err.message || "Google OAuth failed")}`);
  }
}
