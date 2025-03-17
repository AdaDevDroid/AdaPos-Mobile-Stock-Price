import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

console.log("process login 2.1");
const SECRET_KEY = process.env.SECRET_KEY as string;

export async function POST(req: Request) {
  const { username } = await req.json();

  // ✅ สร้าง JWT Token สำหรับการยืนยันตัวตน
  const token = jwt.sign(
    { id: 1, username }, // ใส่ข้อมูลผู้ใช้ลงไป
    SECRET_KEY,
    { expiresIn: "2h" } // ⏳ Token หมดอายุใน 1 วัน
  );

  // 🍪 สร้าง HttpOnly Cookie เพื่อเก็บ Token
  const cookie = serialize("session_token", token, {
    httpOnly: true,
    secure: false, // ✅ ปิด secure ถ้าเป็น localhost
    sameSite: "lax", // ✅ ป้องกัน Cookie หายบน HTTP
    path: "/",
    maxAge: 60 * 60 * 24, // 1 วัน (24 ชั่วโมง)
  });

  return new NextResponse(JSON.stringify({ message: "Token Created Success" }), {
    status: 200,
    headers: { "Set-Cookie": cookie },
  });
}