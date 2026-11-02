import { NextRequest, NextResponse } from "next/server";
import {
  getAllUserRecords,
  updateUserRole,
  updateUserStatus,
  deleteUserRecord,
  saveUserRecord,
} from "@/lib/db/pg";

/**
 * ==============================================================================
 * API ENDPOINT: /api/users (Admin User Management)
 * ==============================================================================
 */

export async function GET() {
  try {
    const users = await getAllUserRecords();
    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, role, status } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    let updatedUser = null;

    if (role) {
      if (role !== "ADMIN" && role !== "USER") {
        return NextResponse.json({ error: "Invalid role. Must be ADMIN or USER" }, { status: 400 });
      }
      updatedUser = await updateUserRole(userId, role);
    }

    if (status) {
      if (status !== "ACTIVE" && status !== "SUSPENDED") {
        return NextResponse.json({ error: "Invalid status. Must be ACTIVE or SUSPENDED" }, { status: 400 });
      }
      updatedUser = await updateUserStatus(userId, status);
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
    }

    const deleted = await deleteUserRecord(userId);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
