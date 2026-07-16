import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { C_GEToRequiredSession } from "../../auth/session";
import { TsysConfig } from "@/models/tsys-config";

export async function POST(req: Request) {
  try {
    const { response } = C_GEToRequiredSession(req);
    if (response) return response;

    const oPool = await C_CTDoConnectToDatabase(req);
    const aResult = await oPool.request().query(`
      SELECT DISTINCT 
        FTSysCode,
        FTSysStaUsrValue
      FROM TsysConfig WITH (NOLOCK)
      WHERE FTSysCode IN ('ADecPntSav', 'ADecPntShw', 'nVB_LimitTmp');
    `);

    const aData = aResult.recordset;
    const oSysConfig = aData.map((record: TsysConfig) => ({ ...record }));

    if (oSysConfig.length === 0) {
      return new NextResponse(JSON.stringify({ message: "ไม่มีข้อมูล" }), { status: 404 });
    }

    return new NextResponse(
      JSON.stringify({ message: "Query Success", config: oSysConfig }), // เพิ่มข้อมูลใน response
      { status: 200 }
    );
  } catch (error) {
    return new NextResponse(JSON.stringify({ message: "เกิดข้อผิดพลาด", error: (error as Error).message }), {
      status: 500,
    });
  }
}
