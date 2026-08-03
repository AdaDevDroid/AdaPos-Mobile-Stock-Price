import sql from "mssql";
import { DatabaseConnectionSetting } from "./config";

export const C_GETnSqlPort = (port?: number): number => {
  if (Number.isInteger(port) && port && port > 0) return port;

  const envPort = Number(process.env.PORT_DB);
  return Number.isInteger(envPort) && envPort > 0 ? envPort : 1433;
};

export const C_GEToSqlConnectionConfig = (setting: DatabaseConnectionSetting) => {
  const config = {
    user: setting.user || process.env.USER_DB || "",
    password: setting.password ?? process.env.PASSWORD_DB ?? "",
    server: setting.server || process.env.SERVER_DB || "",
    port: C_GETnSqlPort(setting.port),
    database: setting.database || process.env.NAME_DB || "",
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    connectionTimeout: 8000,
    requestTimeout: 8000,
  };

  if (!config.user || !config.server || !config.database) {
    throw new Error("Database configuration is incomplete");
  }

  return config;
};

export const C_ISbDatabaseConnected = async (setting: DatabaseConnectionSetting): Promise<boolean> => {
  let pool: InstanceType<typeof sql.ConnectionPool> | null = null;

  try {
    pool = await new sql.ConnectionPool(C_GEToSqlConnectionConfig(setting)).connect();
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
