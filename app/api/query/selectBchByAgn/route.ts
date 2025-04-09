import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { BranchInfo } from "@/models/models";





export async function POST(req: Request) {
     const { FTAgnCode} = await req.json();
     try {
          const oPool = await C_CTDoConnectToDatabase();
          const aResult = await oPool.request()
          .input('FTAgnCode', FTAgnCode)
          .query(`
               SELECT FTBchCode, FTBchName 
               FROM TCNMBranch_L WITH (NOLOCK) 
               WHERE FTAgnCode = @FTAgnCode
               AND FNLngID = 1
          `);
                 
          const aData = aResult.recordset;
          console.log(" 🟢 aData:", aData);
          const oBchData = aData.map((bch: BranchInfo) => ({ ...bch }));
          console.log(" 🟢 oBranchData:", oBchData);
          
      
          if (oBchData.length === 0) {
               return new NextResponse(JSON.stringify({ message: "ไม่มีข้อมูล" }), { status: 404 });
             }
         

            return new NextResponse(JSON.stringify({ message: "Query Success", bch: oBchData }), { status: 200 });
     } catch (error) {
          console.log("Database error:", error);
          return new NextResponse(JSON.stringify({ message: "เกิดข้อผิดพลาด", error: (error as Error).message }), {
               status: 500,
          });
     }
}





