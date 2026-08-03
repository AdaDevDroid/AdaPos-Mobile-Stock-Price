import sql from "mssql";
import {
  C_GEToDatabaseConnectionSetting,
  C_GEToMergedDatabaseSettings,
  DatabaseConnectionSetting,
} from "../database-settings/config";
import { C_GEToSqlConnectionConfig } from "../database-settings/sql-connection";

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
    const setting = C_GEToDatabaseConnectionSetting(databaseByPath[databaseKey]);
    if (setting) return setting;
  }

  if (pathPart && pathPart !== DEFAULT_BASE_PART) {
    throw new Error(`Database mapping for "${pathPart}" is not configured`);
  }

  return { database: NAME_DB };
};

const C_GETtPoolKey = (config: ReturnType<typeof C_GEToSqlConnectionConfig>): string => {
  return JSON.stringify([config.server, config.port, config.user, config.password, config.database]);
};

export const C_CLRxDatabasePools = async () => {
  const pools = Array.from(poolByConfig.values());
  poolByConfig.clear();

  await Promise.allSettled(
    pools.map(async (poolPromise) => {
      const pool = await poolPromise;
      await pool.close();
    }),
  );
};

export async function C_CTDoConnectToDatabase(request?: Request) {
  const config = C_GEToSqlConnectionConfig(C_GEToDatabaseSetting(request));
  const poolKey = C_GETtPoolKey(config);

  try {
    if (!poolByConfig.has(poolKey)) {
      const pool = new sql.ConnectionPool(config)
        .connect()
        .catch((error) => {
          poolByConfig.delete(poolKey);
          throw error;
        });

      poolByConfig.set(poolKey, pool);
    }

    const pool = poolByConfig.get(poolKey);
    if (!pool) {
      throw new Error(`Database pool was not initialized for ${config.database}`);
    }

    return await pool;
  } catch (error) {
    console.log("Database connection failed:", error);
    throw error;
  }
}
