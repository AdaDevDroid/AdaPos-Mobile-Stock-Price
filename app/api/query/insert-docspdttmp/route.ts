import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { FTBchCode, FTXthDocNo, FNXtdSeqNo, FTXthDocKey, FTXthDocType, FTXtdBarCode, FCXtdQty, FCXtdQtyAll, FCXtdCostIn, FTLastUpdBy, FTCreateBy, FTAgnCode } = body;

    const oPool = await C_CTDoConnectToDatabase();
    const aResult = await oPool.request().query(`
      INSERT INTO [dbo].[TCNTDocSPDTTmp] (
        [FTBchCode], [FTXthDocNo], [FNXtdSeqNo], [FTXthDocKey], [FTXthDocType], 
        [FTXtdBarCode], [FCXtdQty], [FCXtdQtyAll], [FCXtdCostIn], 
        [FDLastUpdOn], [FDCreateOn], [FTLastUpdBy], [FTCreateBy], [FTAgnCode]
      ) 
      VALUES 
      ('${FTBchCode}', '${FTXthDocNo}', ${FNXtdSeqNo}, '${FTXthDocKey}', '${FTXthDocType}', 
      '${FTXtdBarCode}', ${FCXtdQty}, ${FCXtdQtyAll}, ${FCXtdCostIn}, 
      GETDATE(), GETDATE(), '${FTLastUpdBy}', '${FTCreateBy}', '${FTAgnCode}')
    `);

    const aData = aResult.recordset;
    const oSysConfig = aData.map(() => ({}));

    return new NextResponse(
      JSON.stringify({ message: "Query Success", config: oSysConfig }),
      { status: 200 }
    );
  } catch (error) {
    return new NextResponse(JSON.stringify({ message: "เกิดข้อผิดพลาด", error: (error as Error).message }), {
      status: 500,
    });
  }
}