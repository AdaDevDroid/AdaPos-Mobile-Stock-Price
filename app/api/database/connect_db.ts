import sql from 'mssql';
import {
  C_GEToDatabaseConnectionSetting,
  C_GEToMergedDatabaseSettings,
  DatabaseConnectionSetting,
} from "../database-settings/config";

const USER_DB = process.env.USER_DB as string;
const PASSWORD_DB = process.env.PASSWORD_DB as string;
const SERVER_DB = process.env.SERVER_DB as string;
const PORT_DB = parseInt(process.env.PORT_DB as string, 10);
const NAME_DB = process.env.NAME_DB as string;
const DEFAULT_BASE_PART = (process.env.NEXT_PUBLIC_BASE_PATH || "/AdaCheckStockSTD")
  .replace(/^\/+/, "")
  .split("/")[0] || "";

type SqlPool = InstanceType<typeof sql.ConnectionPool>;

const poolByConfig = new Map<string, Promise<SqlPool>>();

const C_GETtPathPart = (request?: Request): string => {
  const selectedPath = request?.headers.get("x-ada-db-part");
  if (selectedPath) {
    return selectedPath.replace(/^\/+/, "").split("/").filter(Boolean)[0] || "";
  }

  const forwardedPrefix = request?.headers.get("x-forwarded-prefix");
  const pathname = forwardedPrefix || (request ? new URL(request.url).pathname : process.env.NEXT_PUBLIC_BASE_PATH || "");
  const firstPart = pathname.split("/").filter(Boolean)[0] || "";

  return firstPart === "api" ? "" : firstPart;
};

const C_GEToDatabaseSetting = (request?: Request): DatabaseConnectionSetting => {
  const databaseByPath = C_GEToMergedDatabaseSettings();
  const pathPart = C_GETtPathPart(request);
  const databaseKey = Object.prototype.hasOwnProperty.call(databaseByPath, pathPart)
    ? pathPart
    : Object.prototype.hasOwnProperty.call(databaseByPath, `/${pathPart}`)
      ? `/${pathPart}`
      : "";

  if (databaseKey) {
    const settingValue = databaseByPath[databaseKey];
    if (settingValue === null) {
      throw new Error(`Database mapping for "${pathPart}" was deleted`);
    }

    const setting = C_GEToDatabaseConnectionSetting(settingValue);
    if (setting) {
      return setting;
    }
  }

  if (pathPart && pathPart !== DEFAULT_BASE_PART) {
    throw new Error(`Database mapping for "${pathPart}" is not configured`);
  }

  return { database: NAME_DB };
};

const C_GETnPort = (port?: number): number => {
  if (Number.isInteger(port) && port && port > 0) {
    return port;
  }

  if (Number.isInteger(PORT_DB) && PORT_DB > 0) {
    return PORT_DB;
  }

  return 1433;
};

const C_GEToDatabaseConfig = (setting: DatabaseConnectionSetting) => {
  const config = {
    user: setting.user || USER_DB,
    password: setting.password ?? PASSWORD_DB,
    server: setting.server || SERVER_DB,
    port: C_GETnPort(setting.port),
    database: setting.database || NAME_DB,
    options: {
      encrypt: true,
      trustServerCertificate: true
    }
  };

  if (!config.user || !config.server || !config.database) {
    throw new Error("Database configuration is incomplete");
  }

  return config;
};

const C_GETtPoolKey = (config: ReturnType<typeof C_GEToDatabaseConfig>): string => {
  return JSON.stringify([config.server, config.port, config.user, config.password, config.database]);
};

export const C_CLRxDatabasePools = async () => {
  const pools = Array.from(poolByConfig.values());
  poolByConfig.clear();

  await Promise.allSettled(
    pools.map(async (poolPromise) => {
      const pool = await poolPromise;
      await pool.close();
    })
  );
};

export async function C_CTDoConnectToDatabase(request?: Request) {
  const config = C_GEToDatabaseConfig(C_GEToDatabaseSetting(request));
  const poolKey = C_GETtPoolKey(config);

  try {
    if (!poolByConfig.has(poolKey)) {
      const pool = new sql.ConnectionPool(config)
        .connect()
        .catch((err) => {
          poolByConfig.delete(poolKey);
          throw err;
        });

      poolByConfig.set(poolKey, pool);
    }

    const pool = poolByConfig.get(poolKey);
    if (!pool) {
      throw new Error(`Database pool was not initialized for ${config.database}`);
    }

    return await pool;
  } catch (err) {
    console.log('Database connection failed:', err);
    throw err;
  }
}
