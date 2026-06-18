import { NextResponse } from "next/server";
import { C_ISbValidSettingsAdmin } from "../admin";
import { C_GEToMergedDatabaseSettings, C_GEToPublicDatabaseSetting, PublicDatabaseSetting } from "../config";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!C_ISbValidSettingsAdmin(username, password)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const settings = C_GEToMergedDatabaseSettings();

    const data = Object.entries(settings)
      .map(([part, setting]) => C_GEToPublicDatabaseSetting(part, setting))
      .filter((setting): setting is PublicDatabaseSetting => Boolean(setting))
      .sort((a, b) => a.part.localeCompare(b.part));

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load database settings", error: (error as Error).message },
      { status: 500 }
    );
  }
}
