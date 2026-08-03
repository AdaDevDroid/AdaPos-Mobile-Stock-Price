import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from "../../database/connect_db";
import { C_GEToRequiredSession } from "../../auth/session";
import { BranchInfo } from "@/models/models";

type SqlPool = Awaited<ReturnType<typeof C_CTDoConnectToDatabase>>;

const branchSchemaByPool = new WeakMap<SqlPool, Promise<boolean>>();

const C_ISbBranchLangHasAgnCode = async (pool: SqlPool): Promise<boolean> => {
  let schemaPromise = branchSchemaByPool.get(pool);
  if (!schemaPromise) {
    schemaPromise = pool.request().query(`
      SELECT 1 AS ok
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'TCNMBranch_L'
        AND COLUMN_NAME = 'FTAgnCode'
    `).then((result) => result.recordset.length > 0);
    branchSchemaByPool.set(pool, schemaPromise);
  }

  try {
    return await schemaPromise;
  } catch (error) {
    branchSchemaByPool.delete(pool);
    throw error;
  }
};

export async function POST(req: Request) {
  try {
    const { session, response } = C_GEToRequiredSession(req);
    if (response) return response;

    const body = await req.json().catch(() => ({}));
    const requestedAgencyCode = typeof body?.FTAgnCode === "string" ? body.FTAgnCode.trim() : "";
    const agencyCode = session?.FTAgnCode?.trim() || "";
    if (!agencyCode) {
      return NextResponse.json({ message: "ไม่พบสิทธิ์ Agency ของผู้ใช้งาน" }, { status: 403 });
    }
    if (requestedAgencyCode && requestedAgencyCode !== agencyCode) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูล Agency นี้" }, { status: 403 });
    }

    const pool = await C_CTDoConnectToDatabase(req);
    const branchLangHasAgency = await C_ISbBranchLangHasAgnCode(pool);
    const query = branchLangHasAgency
      ? `
          SELECT FTBchCode, FTBchName
          FROM TCNMBranch_L WITH (NOLOCK)
          WHERE FTAgnCode = @FTAgnCode
            AND FNLngID = 1
        `
      : `
          SELECT BCHL.FTBchCode, BCHL.FTBchName
          FROM TCNMBranch BCH WITH (NOLOCK)
          INNER JOIN TCNMBranch_L BCHL WITH (NOLOCK)
            ON BCHL.FTBchCode = BCH.FTBchCode
           AND BCHL.FNLngID = 1
          WHERE BCH.FTAgnCode = @FTAgnCode
        `;

    const result = await pool.request()
      .input("FTAgnCode", agencyCode)
      .query(query);
    const branches = (result.recordset || [])
      .map((branch: BranchInfo) => ({ ...branch }))
      .filter((branch: BranchInfo) => Boolean(branch.FTBchCode));

    if (branches.length === 0) {
      return NextResponse.json({ message: "ไม่มีข้อมูล", bch: [] }, { status: 404 });
    }

    return NextResponse.json({ message: "Query Success", bch: branches });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาด", error: (error as Error).message },
      { status: 500 },
    );
  }
}
