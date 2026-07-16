import { NextResponse } from "next/server";
import { C_ISbValidSettingsAdmin } from "../admin";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!C_ISbValidSettingsAdmin(username, password)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ message: "Authorized" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to verify admin user", error: (error as Error).message },
      { status: 500 }
    );
  }
}
