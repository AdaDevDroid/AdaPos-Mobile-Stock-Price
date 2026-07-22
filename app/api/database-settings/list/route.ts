import { NextResponse } from "next/server";
import sql from "mssql";
import { C_ISbValidSettingsAdmin } from "../admin";
import {
  C_GEToDatabaseConnectionSetting,
  C_GEToMergedDatabaseSettings,
  C_GEToPublicDatabaseSetting,
  DatabaseConnectionSetting,
  PublicDatabaseSetting,
} from "../config";

const C_GETnPort = (port?: number | null): number => {
  if (Number.isInteger(port) && port && port > 0) {
    return port;
  }

  const envPort = Number(process.env.PORT_DB);
  if (Number.isInteger(envPort) && envPort > 0) {
    return envPort;
  }

  return 1433;
};

const C_ISbDatabaseConnected = async (setting: DatabaseConnectionSetting): Promise<boolean> => {
  const config = {
    user: setting.user || process.env.USER_DB || "",
    password: setting.password ?? process.env.PASSWORD_DB ?? "",
    server: setting.server || process.env.SERVER_DB || "",
    port: C_GETnPort(setting.port),
    database: setting.database,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    connectionTimeout: 3000,
    requestTimeout: 3000,
  };

  if (!config.user || !config.server || !config.database) {
    return false;
  }

  let pool: InstanceType<typeof sql.ConnectionPool> | null = null;
  try {
    pool = await new sql.ConnectionPool(config).connect();
    await pool.request().query("SELECT 1 AS ok");
    return true;
  } catch {
    return false;
  } finally {
    if (pool) {
      await pool.close().catch(() => undefined);
    }
  }
};

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!C_ISbValidSettingsAdmin(username, password)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const settings = C_GEToMergedDatabaseSettings();

    const data = await Promise.all(
      Object.entries(settings)
        .map(async ([part, setting]): Promise<PublicDatabaseSetting | null> => {
          const publicSetting = C_GEToPublicDatabaseSetting(part, setting);
          if (!publicSetting) {
            return null;
          }

          const connectionSetting = C_GEToDatabaseConnectionSetting(setting);
          if (!connectionSetting) {
            return publicSetting;
          }

          return {
            ...publicSetting,
            connected: await C_ISbDatabaseConnected(connectionSetting),
          };
        })
    );

    return NextResponse.json({
      data: data
        .filter((setting): setting is PublicDatabaseSetting => Boolean(setting))
        .sort((a, b) => a.part.localeCompare(b.part)),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load database settings", error: (error as Error).message },
      { status: 500 }
    );
  }
}
