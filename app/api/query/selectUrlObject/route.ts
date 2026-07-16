import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { C_GEToRequiredSession } from "../../auth/session";
import { TCNTUrlObject } from "@/models/url-object";

export async function POST(req: Request) {
  try {
    const { response } = C_GEToRequiredSession(req);
    if (response) return response;

    const configuredUrlObjectId = Number(process.env.PRICE_CHECK_URL_OBJECT_ID || "5");
    const urlObjectId = Number.isInteger(configuredUrlObjectId) && configuredUrlObjectId > 0
      ? configuredUrlObjectId
      : 5;

    const oPool = await C_CTDoConnectToDatabase(req);
    const aResult = await oPool.request()
      .input("urlObjectId", urlObjectId)
      .query(`
      SELECT TOP 1
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
      WHERE FNUrlID = @urlObjectId
         OR UPPER(FTUrlAddress) LIKE '%/API2PSMASTER/%'
      ORDER BY
        CASE
          WHEN FNUrlID = @urlObjectId THEN 0
          WHEN UPPER(FTUrlAddress) LIKE '%/API2PSMASTER/%' THEN 1
          ELSE 2
        END,
        FNUrlID;
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
