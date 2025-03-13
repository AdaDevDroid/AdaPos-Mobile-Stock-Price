import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';

interface TCNTUrlObject {
  FNUrlID: number | null;
  FTUrlRefID: string | null;
  FNUrlSeq: number | null;
  FNUrlType: number | null;
  FTUrlTable: string | null;
  FTUrlKey: string | null;
  FTUrlAddress: string | null;
  FTUrlPort: string | null;
  FTUrlLogo: string | null;
  FDLastUpdOn: Date | null;
  FTLastUpdBy: string | null;
  FDCreateOn: Date | null;
  FTCreateBy: string | null;
}

export async function POST() {
  try {
    const oPool = await C_CTDoConnectToDatabase();
    const aResult = await oPool.request().query(`
      SELECT 
        FNUrlID,
        FTUrlRefID,
        FNUrlSeq,
        FNUrlType,
        FTUrlTable,
        FTUrlKey,
        FTUrlAddress,
        FTUrlPort,
        FTUrlLogo,
        FDLastUpdOn,
        FTLastUpdBy,
        FDCreateOn,
        FTCreateBy
      FROM TCNTUrlObject
      WHERE FNUrlID = 5;
    `);

    const aData = aResult.recordset;
    const oUrlObject = aData.map((record: TCNTUrlObject) => ({ ...record }));

    if (oUrlObject.length === 0) {
      return new NextResponse(JSON.stringify({ message: "ไม่มีข้อมูล" }), { status: 404 });
    }

    return new NextResponse(
      JSON.stringify({ message: "Query Success", data: oUrlObject }), // เพิ่มข้อมูลใน response
      { status: 200 }
    );
  } catch (error) {
    return new NextResponse(JSON.stringify({ message: "เกิดข้อผิดพลาด", error: (error as Error).message }), {
      status: 500,
    });
  }
}