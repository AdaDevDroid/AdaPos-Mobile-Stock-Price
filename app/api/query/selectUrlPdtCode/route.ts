import { NextRequest, NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { PdtCode } from "@/models/url-pdtcode";

export async function POST(req: NextRequest) {
     try {
          const { searchType, searchQuery, agnCode } = await req.json();
          const oPool = await C_CTDoConnectToDatabase();
          try {
               const aResult = await oPool.request()
                    .input('searchQuery', searchQuery || '')
                    .input('agnCode', agnCode || '')
                    .query(`
                         SELECT pl.FTPdtCode
                              ,pl.FTPdtName
                              ,pb.FTBarCode
                         FROM TCNMPdt_L pl
                         LEFT JOIN TCNMPdtBar pb ON pl.FTPdtCode = pb.FTPdtCode
                         WHERE pl.FNLngID = 1
                         AND pl.FTAgnCode = @agnCode
                         AND 
                         ${searchType === 'barcode' ? "pb.FTBarCode = @searchQuery" :
                              searchType === 'name' ? "pl.FTPdtName LIKE '%' + @searchQuery + '%'" :
                                   searchType === 'product_code' ? "pl.FTPdtCode = @searchQuery" : "1=0"
                         }
                    `);
               const aData = aResult.recordset;
               const oPdtCode = aData.map((record: PdtCode) => ({ ...record }));

               if (oPdtCode.length === 0) {
                    return new NextResponse(JSON.stringify({ message: "ไม่มีข้อมูล" }), { status: 404 });
               }

               return new NextResponse(
                    JSON.stringify({ message: "Query Success", data: oPdtCode }),
                    { status: 200 }
               );
          } finally {
               await oPool.close();
          }
     } catch (error) {
          return new NextResponse(JSON.stringify({ message: "เกิดข้อผิดพลาด", error: (error as Error).message }), {
               status: 500,
          });
     }
}