import { NextResponse } from "next/server";
import fs from "fs/promises";
import { C_ISbValidSettingsAdmin } from "../admin";
import { C_CLRxDatabasePools } from "../../database/connect_db";
import {
  C_GEToRuntimeDatabaseSettings,
  C_ISbEnvDefaultPart,
  SETTINGS_DIR,
  SETTINGS_PATH,
} from "../config";

const SAFE_PART = /^[A-Za-z0-9._-]+$/;

export async function POST(req: Request) {
  try {
    const { username, password, part } = await req.json();
    const normalizedPart = String(part || "").replace(/^\/+/, "").trim();

    if (!C_ISbValidSettingsAdmin(username, password)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!SAFE_PART.test(normalizedPart)) {
      return NextResponse.json({ message: "Invalid path part" }, { status: 400 });
    }

    if (C_ISbEnvDefaultPart(normalizedPart)) {
      return NextResponse.json(
        { message: "Default database setting cannot be deleted; update .env.local and restart the application" },
        { status: 409 },
      );
    }

    const settings = await C_GEToRuntimeDatabaseSettings();
    settings[normalizedPart] = null;

    await fs.mkdir(SETTINGS_DIR, { recursive: true });
    await fs.writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
    await C_CLRxDatabasePools();

    return NextResponse.json({ message: "Database setting deleted", part: normalizedPart });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete database setting", error: (error as Error).message },
      { status: 500 },
    );
  }
}
