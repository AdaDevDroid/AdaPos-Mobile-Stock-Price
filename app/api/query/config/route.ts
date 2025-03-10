import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';

interface TsysConfig {
  FTSysCode: string| null;
  FTSysStaUsrValue: string | null;
}

export async function POST() {

  const oPool = await C_CTDoConnectToDatabase();
  const aResult = await oPool.request().query(`
    SELECT DISTINCT 
      FTSysCode,
      FTSysStaUsrValue
    FROM TsysConfig
    WHERE FTSysCode IN ('ADecPntSav', 'ADecPntShw', 'nVB_LimitTmp');
  `);

  const aData = aResult.recordset;
  const oSysConfig = aData.map((TsysConfig: TsysConfig) => ({...TsysConfig,}));

  if (!oSysConfig) {
    return new NextResponse(JSON.stringify({ message: "ข้อมูลที่ส่งไม่ถูกต้อง" }), { status: 401 });
  }

  return new NextResponse(JSON.stringify({ message: "Query Success", config: oSysConfig }), {
    status: 200,
  });
}