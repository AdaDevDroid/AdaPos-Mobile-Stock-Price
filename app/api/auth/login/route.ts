import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const SECRET_KEY = process.env.SECRET_KEY as string;

export async function POST(req: Request) {
  try {
    console.log("🔵 Process Login");
    const { username } = await req.json();

    // ✅ สร้าง JWT Token
    const token = jwt.sign({ id: 1, username }, SECRET_KEY, { expiresIn: "2h" });

    // ✅ สร้าง HttpOnly Cookie เพื่อเก็บ Token
    const cookie = serialize("session_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 2, // 2 ชั่วโมง
    });

    return new NextResponse(JSON.stringify({ message: "Token Created Success", token }), {
      status: 200,
      headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    return new NextResponse(JSON.stringify({ error: "Login failed" }), { status: 500 });
  }
}