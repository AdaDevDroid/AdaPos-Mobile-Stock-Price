import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { C_GEToRequiredSession } from "../../auth/session";
import { BranchInfo } from "@/models/models";





export async function POST(req: Request) {
     try {
          const { response } = C_GEToRequiredSession(req);
          if (response) return response;

          const oPool = await C_CTDoConnectToDatabase(req);
          const aResult = await oPool.request()
          .query(`
               SELECT FTBchCode, FTBchName 
               FROM TCNMBranch_L WITH (NOLOCK) 
               WHERE FNLngID = 1
          `);
                 
          const aData = aResult.recordset;
          const oBchData = aData.map((bch: BranchInfo) => ({ ...bch }));

          
      
          if (oBchData.length === 0) {
               return new NextResponse(JSON.stringify({ message: "ไม่มีข้อมูล" }), { status: 404 });
             }
         

            return new NextResponse(JSON.stringify({ message: "Query Success", bch: oBchData }), { status: 200 });
     } catch (error) {
          console.error("Database error:", error);
          return new NextResponse(JSON.stringify({ message: "เกิดข้อผิดพลาด", error: (error as Error).message }), {
               status: 500,
          });
     }
}





