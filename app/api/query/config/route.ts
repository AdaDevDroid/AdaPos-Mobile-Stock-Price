import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';

interface TsysConfig {
  FTSysCode: string| null;
  FTSysStaUsrValue: string | null;
}

export async function POST() {
  try {
    const oPool = await C_CTDoConnectToDatabase();
    const aResult = await oPool.request().query(`
      SELECT DISTINCT 
        FTSysCode,
        FTSysStaUsrValue
      FROM TsysConfig
      WHERE FTSysCode IN ('ADecPntSav', 'ADecPntShw', 'nVB_LimitTmp');
    `);

    const aData = aResult.recordset;
    console.log("Data fetched:", aData); // เพิ่มการแสดงผลข้อมูลใน console
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