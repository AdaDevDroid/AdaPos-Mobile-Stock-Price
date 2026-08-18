import { NextResponse } from "next/server";
import fs from "fs/promises";
import { C_ISbValidSettingsAdmin } from "./admin";
import { C_CLRxDatabasePools } from "../database/connect_db";
import {
  C_GEToDatabaseConnectionSetting,
  C_GEToEnvDatabaseSettings,
  C_GEToMergedDatabaseSettings,
  C_GEToRuntimeDatabaseSettings,
  C_ISbEnvDefaultPart,
  DatabaseConnectionSetting,
  SETTINGS_DIR,
  SETTINGS_PATH,
} from "./config";

const SAFE_PART = /^[A-Za-z0-9._-]+$/;
const SAFE_DATABASE = /^[A-Za-z0-9._-]+$/;
const SAFE_SERVER = /^[A-Za-z0-9._-]*$/;
const RESERVED_PARTS = new Set([
  ".", "..", "__proto__", "constructor", "prototype", "_next", "api",
  "favicon.ico", "icons", "login", "main", "manifest.json", "price-check",
  "receive", "setting", "stock", "sw.js", "test-network.ts", "transfer",
]);

const C_GETnPort = (port: unknown): number | undefined => {
  const normalizedPort = String(port || "").trim();
  if (!normalizedPort) return undefined;

  const parsedPort = Number(normalizedPort);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error("Invalid database port");
  }

  return parsedPort;
};

export async function POST(req: Request) {
  try {
    const { username, password, oldPart, part, database, server, port, dbUser, dbPassword } = await req.json();
    const normalizedOldPart = String(oldPart || "").replace(/^\/+/, "").trim();
    const normalizedPart = String(part || "").replace(/^\/+/, "").trim();
    const normalizedDatabase = String(database || "").trim();
    const normalizedServer = String(server || "").trim();
    const normalizedDbUser = String(dbUser || "").trim();

    if (!C_ISbValidSettingsAdmin(username, password)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!SAFE_PART.test(normalizedPart) || (normalizedOldPart && !SAFE_PART.test(normalizedOldPart))) {
      return NextResponse.json({ message: "Invalid path part" }, { status: 400 });
    }

    if (RESERVED_PARTS.has(normalizedPart.toLowerCase())) {
      return NextResponse.json({ message: "Reserved path part" }, { status: 400 });
    }

    if (normalizedOldPart && normalizedOldPart !== normalizedPart && C_ISbEnvDefaultPart(normalizedOldPart)) {
      return NextResponse.json(
        { message: "Default path part cannot be renamed; update .env.local and restart the application" },
        { status: 409 },
      );
    }

    if (!SAFE_DATABASE.test(normalizedDatabase)) {
      return NextResponse.json({ message: "Invalid database name" }, { status: 400 });
    }

    if (!SAFE_SERVER.test(normalizedServer)) {
      return NextResponse.json({ message: "Invalid database server" }, { status: 400 });
    }

    const nextPort = C_GETnPort(port);
    const settings = await C_GEToRuntimeDatabaseSettings();
    const mergedSettings = C_GEToMergedDatabaseSettings();
    const envSettings = C_GEToEnvDatabaseSettings();
    const existingPart = normalizedOldPart || normalizedPart;
    const conflictingPart = Object.keys(mergedSettings).find(
      (configuredPart) =>
        configuredPart.toLowerCase() === normalizedPart.toLowerCase() &&
        (!normalizedOldPart || configuredPart !== normalizedOldPart),
    );
    if (conflictingPart) {
      return NextResponse.json(
        { message: `Path part conflicts with existing part "${conflictingPart}"` },
        { status: 409 },
      );
    }
    const existingSetting = C_GEToDatabaseConnectionSetting(
      settings[existingPart] ?? mergedSettings[existingPart] ?? mergedSettings[`/${existingPart}`],
    );
    const envSetting = C_GEToDatabaseConnectionSetting(
      envSettings[existingPart] ?? envSettings[normalizedPart],
    );
    const nextSetting: DatabaseConnectionSetting = {
      database: normalizedDatabase,
      server: normalizedServer || existingSetting?.server || envSetting?.server,
      port: nextPort || existingSetting?.port || envSetting?.port,
      user: normalizedDbUser || existingSetting?.user || envSetting?.user,
    };

    if (typeof dbPassword === "string" && dbPassword) {
      nextSetting.password = dbPassword;
    } else if (existingSetting?.password) {
      nextSetting.password = existingSetting.password;
    } else if (envSetting?.password) {
      nextSetting.password = envSetting.password;
    }

    if (normalizedOldPart && normalizedOldPart !== normalizedPart) {
      settings[normalizedOldPart] = null;
    }

    settings[normalizedPart] = nextSetting;

    await fs.mkdir(SETTINGS_DIR, { recursive: true });
    await fs.writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
    await C_CLRxDatabasePools();

    return NextResponse.json({
      message: "Database setting saved",
      part: normalizedPart,
      database: normalizedDatabase,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage === "Invalid database port") {
      return NextResponse.json({ message: errorMessage }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Failed to save database setting", error: errorMessage },
      { status: 500 },
    );
  }
}
