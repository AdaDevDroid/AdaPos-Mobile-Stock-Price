import fs from "fs";
import fsp from "fs/promises";
import path from "path";

export const SETTINGS_DIR = path.join(process.cwd(), ".runtime");
export const SETTINGS_PATH = path.join(SETTINGS_DIR, "database-paths.json");

export type DatabaseConnectionSetting = {
  database: string;
  server?: string;
  port?: number;
  user?: string;
  password?: string;
};

type RawDatabaseConnectionSetting = Omit<DatabaseConnectionSetting, "port"> & {
  port?: number | string;
};

export type DatabaseSettingValue = string | RawDatabaseConnectionSetting | null;
export type DatabaseSettings = Record<string, DatabaseSettingValue>;

export type PublicDatabaseSetting = {
  part: string;
  database: string;
  server: string;
  port: number | null;
  user: string;
  hasPassword: boolean;
  connected: boolean;
};

const C_ISbRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const C_GEToDatabaseConnectionSetting = (
  value: DatabaseSettingValue | undefined,
): DatabaseConnectionSetting | null => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const database = value.trim();
    return database ? { database } : null;
  }

  if (!C_ISbRecord(value)) {
    return null;
  }

  const database = String(value.database || "").trim();
  if (!database) {
    return null;
  }

  const portValue = value.port;
  const port = typeof portValue === "number"
    ? portValue
    : typeof portValue === "string" && portValue.trim()
      ? Number(portValue)
      : undefined;

  return {
    database,
    server: typeof value.server === "string" ? value.server.trim() : undefined,
    port: Number.isInteger(port) ? port : undefined,
    user: typeof value.user === "string" ? value.user.trim() : undefined,
    password: typeof value.password === "string" ? value.password : undefined,
  };
};

export const C_GEToPublicDatabaseSetting = (
  part: string,
  value: DatabaseSettingValue,
): PublicDatabaseSetting | null => {
  const setting = C_GEToDatabaseConnectionSetting(value);
  if (!setting) {
    return null;
  }

  return {
    part,
    database: setting.database,
    server: setting.server || process.env.SERVER_DB || "",
    port: setting.port || Number(process.env.PORT_DB) || null,
    user: setting.user || process.env.USER_DB || "",
    hasPassword: Boolean(setting.password || process.env.PASSWORD_DB),
    connected: false,
  };
};

export const C_GEToEnvDatabaseSettings = (): DatabaseSettings => {
  const settings = process.env.DATABASE_NAME_BY_PATH;
  if (!settings) {
    return {};
  }

  return JSON.parse(settings);
};

export const C_GEToRuntimeDatabaseSettings = async (): Promise<DatabaseSettings> => {
  try {
    const content = await fsp.readFile(SETTINGS_PATH, "utf8");
    return JSON.parse(content);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return {};
    }

    throw error;
  }
};

export const C_GEToRuntimeDatabaseSettingsSync = (): DatabaseSettings => {
  if (!fs.existsSync(SETTINGS_PATH)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
};

export const C_GEToMergedDatabaseSettings = (): DatabaseSettings => {
  return {
    ...C_GEToEnvDatabaseSettings(),
    ...C_GEToRuntimeDatabaseSettingsSync(),
  };
};
