import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST() {
  // 🍪 ลบ Cookie โดยตั้ง `maxAge: 0`
  const cookie = serialize("session_token", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return new NextResponse(JSON.stringify({ message: "Logout Success" }), {
    status: 200,
    headers: { "Set-Cookie": cookie },
  });
}