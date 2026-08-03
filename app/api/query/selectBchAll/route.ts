import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from "../../database/connect_db";
import { C_GEToRequiredSession } from "../../auth/session";
import { BranchInfo } from "@/models/models";

export async function POST(req: Request) {
  try {
    const { session, response } = C_GEToRequiredSession(req);
    if (response) return response;
    if (session?.FTAgnCode) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลสาขาทั้งหมด" }, { status: 403 });
    }

    const pool = await C_CTDoConnectToDatabase(req);
    const result = await pool.request().query(`
      SELECT FTBchCode, FTBchName
      FROM TCNMBranch_L WITH (NOLOCK)
      WHERE FNLngID = 1
    `);
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
