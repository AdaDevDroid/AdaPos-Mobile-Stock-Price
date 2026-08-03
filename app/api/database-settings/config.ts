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

let envDatabaseSettingsCache: DatabaseSettings | null = null;

export type PublicDatabaseSetting = {
  part: string;
  database: string;
  server: string;
  port: number | null;
  user: string;
  hasPassword: boolean;
  connected: boolean;
  isDefault: boolean;
};

const C_ISbRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const C_GEToDatabaseConnectionSetting = (
  value: DatabaseSettingValue | undefined,
): DatabaseConnectionSetting | null => {
  if (!value) return null;

  if (typeof value === "string") {
    const database = value.trim();
    return database ? { database } : null;
  }

  if (!C_ISbRecord(value)) return null;

  const database = String(value.database || "").trim();
  if (!database) return null;

  const portValue = value.port;
  const port = typeof portValue === "number"
    ? portValue
    : typeof portValue === "string" && portValue.trim()
      ? Number(portValue)
      : undefined;

  return {
    database,
    server: typeof value.server === "string" ? value.server.trim() : undefined,
    port: Number.isInteger(port) && Number(port) > 0 ? port : undefined,
    user: typeof value.user === "string" ? value.user.trim() : undefined,
    password: typeof value.password === "string" ? value.password : undefined,
  };
};

const C_GEToEnvConnectionDefaults = (): Omit<DatabaseConnectionSetting, "database"> => {
  const port = Number(process.env.PORT_DB);

  return {
    server: process.env.SERVER_DB?.trim() || undefined,
    port: Number.isInteger(port) && port > 0 ? port : undefined,
    user: process.env.USER_DB?.trim() || undefined,
    password: process.env.PASSWORD_DB,
  };
};

const C_MRGxDatabaseConnectionSetting = (
  primary: DatabaseConnectionSetting,
  fallback?: Partial<DatabaseConnectionSetting> | null,
): DatabaseConnectionSetting => ({
  database: primary.database || fallback?.database || "",
  server: primary.server || fallback?.server,
  port: primary.port || fallback?.port,
  user: primary.user || fallback?.user,
  password: primary.password ?? fallback?.password,
});

export const C_GETtDefaultEnvPathPart = (): string => {
  return (process.env.NEXT_PUBLIC_BASE_PATH || "")
    .replace(/^\/+/, "")
    .split("/")[0] || "";
};

export const C_GEToEnvDatabaseSettings = (): DatabaseSettings => {
  if (envDatabaseSettingsCache) return envDatabaseSettingsCache;

  const defaults = C_GEToEnvConnectionDefaults();
  const result: DatabaseSettings = {};
  const rawSettings = process.env.DATABASE_NAME_BY_PATH;

  if (rawSettings) {
    try {
      const parsedSettings: unknown = JSON.parse(rawSettings);
      if (!C_ISbRecord(parsedSettings)) {
        throw new Error("DATABASE_NAME_BY_PATH must be a JSON object");
      }

      for (const [part, value] of Object.entries(parsedSettings)) {
        const connection = C_GEToDatabaseConnectionSetting(value as DatabaseSettingValue);
        if (connection) {
          result[part.replace(/^\/+/, "")] = C_MRGxDatabaseConnectionSetting(connection, defaults);
        }
      }
    } catch (error) {
      console.error("Invalid DATABASE_NAME_BY_PATH; using NAME_DB fallback:", (error as Error).message);
    }
  }

  const defaultPart = C_GETtDefaultEnvPathPart();
  const defaultDatabase = process.env.NAME_DB?.trim() || "";
  if (defaultPart) {
    const existing = C_GEToDatabaseConnectionSetting(result[defaultPart]);
    if (existing) {
      result[defaultPart] = C_MRGxDatabaseConnectionSetting(existing, defaults);
    } else if (defaultDatabase) {
      result[defaultPart] = { database: defaultDatabase, ...defaults };
    }
  }

  envDatabaseSettingsCache = result;
  return envDatabaseSettingsCache;
};

export const C_GETaEnvDefaultParts = (): string[] => Object.keys(C_GEToEnvDatabaseSettings());

export const C_ISbEnvDefaultPart = (part: string): boolean => {
  return Object.prototype.hasOwnProperty.call(C_GEToEnvDatabaseSettings(), part.replace(/^\/+/, ""));
};

export const C_GEToPublicDatabaseSetting = (
  part: string,
  value: DatabaseSettingValue,
): PublicDatabaseSetting | null => {
  const setting = C_GEToDatabaseConnectionSetting(value);
  if (!setting) return null;

  return {
    part,
    database: setting.database,
    server: setting.server || process.env.SERVER_DB || "",
    port: setting.port || Number(process.env.PORT_DB) || null,
    user: setting.user || process.env.USER_DB || "",
    hasPassword: Boolean(setting.password || process.env.PASSWORD_DB),
    connected: false,
    isDefault: C_ISbEnvDefaultPart(part),
  };
};

export const C_GEToRuntimeDatabaseSettings = async (): Promise<DatabaseSettings> => {
  try {
    const content = await fsp.readFile(SETTINGS_PATH, "utf8");
    return JSON.parse(content);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return {};
    throw error;
  }
};

export const C_GEToRuntimeDatabaseSettingsSync = (): DatabaseSettings => {
  if (!fs.existsSync(SETTINGS_PATH)) return {};
  return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
};

export const C_GEToMergedDatabaseSettings = (): DatabaseSettings => {
  const envSettings = C_GEToEnvDatabaseSettings();
  const runtimeSettings = C_GEToRuntimeDatabaseSettingsSync();
  const merged: DatabaseSettings = { ...envSettings };

  for (const [rawPart, value] of Object.entries(runtimeSettings)) {
    const part = rawPart.replace(/^\/+/, "");
    if (value === null) {
      if (!Object.prototype.hasOwnProperty.call(envSettings, part)) {
        delete merged[part];
      }
      continue;
    }

    const runtimeSetting = C_GEToDatabaseConnectionSetting(value);
    if (!runtimeSetting) continue;

    const envSetting = C_GEToDatabaseConnectionSetting(envSettings[part]);
    merged[part] = C_MRGxDatabaseConnectionSetting(runtimeSetting, envSetting);
  }

  return merged;
};

export const C_GETaSortedSettingParts = (parts: string[]): string[] => {
  const defaultPart = C_GETtDefaultEnvPathPart();
  const envParts = new Set(C_GETaEnvDefaultParts());

  return [...parts].sort((left, right) => {
    if (left === defaultPart) return -1;
    if (right === defaultPart) return 1;
    if (envParts.has(left) && !envParts.has(right)) return -1;
    if (!envParts.has(left) && envParts.has(right)) return 1;
    return left.localeCompare(right);
  });
};
