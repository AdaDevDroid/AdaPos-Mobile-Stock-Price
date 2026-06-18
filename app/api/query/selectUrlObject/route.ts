import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { C_GEToRequiredSession } from "../../auth/session";
import { TCNTUrlObject } from "@/models/url-object";

export async function POST(req: Request) {
  try {
    const { response } = C_GEToRequiredSession(req);
    if (response) return response;

    const oPool = await C_CTDoConnectToDatabase(req);
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
      FROM TCNTUrlObject WITH (NOLOCK)
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
