import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';






export async function POST() {
     try {
          const oPool = await C_CTDoConnectToDatabase();
          const aResult = await oPool.request()
          .query(`
          SELECT FTCmpName FROM TCNMComp_L WITH (NOLOCK)
          WHERE FNLngID = 1
          `);
                 
          const aData = aResult.recordset;
          console.log(" 🟢 aData:", aData);
          const oBchData = aData.map(item => item.FTCmpName).join(", ");
          console.log(" 🟢 oBchData:", oBchData);
          if (oBchData.length === 0) {
               return new NextResponse(JSON.stringify({ message: "ไม่มีข้อมูล" }), { status: 404 });
             }
         

            return new NextResponse(JSON.stringify({ message: "Query Success", comp: oBchData }), { status: 200 });
     } catch (error) {
          console.log("Database error:", error);
          return new NextResponse(JSON.stringify({ message: "เกิดข้อผิดพลาด", error: (error as Error).message }), {
               status: 500,
          });
     }
}





