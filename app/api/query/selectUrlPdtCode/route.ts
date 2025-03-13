import { NextRequest, NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';

interface PdtCode {
     FTPdtCode: string | null;
     FTPdtName: string | null;
     FTBarCode: string | null;
}

export async function POST(req: NextRequest) {
     try {
          const { searchType, searchQuery } = await req.json();
          const oPool = await C_CTDoConnectToDatabase();
          const aResult = await oPool.request()
               .input('searchQuery', searchQuery || '')
               .query(`
                    SELECT pl.FTPdtCode
                         ,pl.FTPdtName
                         ,pb.FTBarCode
                    FROM TCNMPdt_L pl
                    LEFT JOIN TCNMPdtBar pb ON pl.FTPdtCode = pb.FTPdtCode
                    WHERE (pb.FNBarRefSeq = 1 AND pl.FNLngID = 1)
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
               JSON.stringify({ message: "Query Success", data: oPdtCode }), // เพิ่มข้อมูลใน response
               { status: 200 }
          );
     } catch (error) {
          return new NextResponse(JSON.stringify({ message: "เกิดข้อผิดพลาด", error: (error as Error).message }), {
               status: 500,
          });
     }
}