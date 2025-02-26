import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

const SECRET_KEY = process.env.SECRET_KEY as string;

export async function GET(req: NextRequest) {
  // ✅ ดึง Cookie จาก Request
  const cookies = parse(req.headers.get("cookie") || "");
  const token = cookies.session_token;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // ✅ ตรวจสอบ Token
    const decoded = jwt.verify(token, SECRET_KEY);
    return NextResponse.json({ authenticated: true, user: decoded });
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 403 });
  }
}