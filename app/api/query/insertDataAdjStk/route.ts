import { NextRequest, NextResponse } from "next/server";
import { parse } from "cookie";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { Product } from "@/models/models";

export async function POST(req: NextRequest) {
    try {
        console.log("✅ API Running");
        // ✅ ดึง Cookie จาก Request
        const cookies = parse(req.headers.get("cookie") || "");
        const token = cookies.session_token;
        let newFTXthDocSeq = 0;
        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // ✅ รับ JSON Data เป็น Array ของ Product[]
        const products: Product[] = await req.json();

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ message: "Invalid Data" }, { status: 400 });
        }

        // ✅ เชื่อมต่อฐานข้อมูล
        const pool = await C_CTDoConnectToDatabase();
        
        const res = await pool.query(`
            SELECT TOP 1 FTXthDocSeq
            FROM TCNTDocSPDTTmpAdj
            ORDER BY FTXthDocSeq DESC;
          `);

          
         if (res && res.recordset && res.recordset.length > 0) {
            newFTXthDocSeq = parseInt(res.recordset[0].FTXthDocSeq, 10) + 1;
          } else {
            newFTXthDocSeq = 1;
          }
          console.log("🔍 res Data:", newFTXthDocSeq);
          for (let index = 0; index < products.length; index++) {
            const product = products[index];
            const {
                FTBarcode, FNQuantity, FTRefDoc,
                FTXthDocKey, FTBchCode, FTAgnCode, FTUsrName, FDCreateOn
            } = product;

            const FNId = index + 1;

            const request = pool.request();
            request.input("FTBchCode", FTBchCode);
            request.input("FTXthDocSeq", newFTXthDocSeq);
            request.input("FNXtdSeqNo", FNId);
            request.input("FTXthDocKey", FTXthDocKey);
            request.input("FTXthDocType", "1");
            request.input("FTXtdBarCode", FTBarcode);
            request.input("FCXtdQtyAll", FNQuantity);
            request.input("FTXtdBchRef", "1");
            request.input("FDAjdDateTimeC1", convertToCE(FDCreateOn));
            request.input("FCAjdUnitQtyC1", FNQuantity);
            request.input("FTAjdPlcCode", FTRefDoc);
            request.input("FDLastUpdOn", convertToCE(FDCreateOn));
            request.input("FDCreateOn", convertToCE(FDCreateOn));
            request.input("FTLastUpdBy", FTUsrName);
            request.input("FTCreateBy", FTUsrName);
            request.input("FTTmpStatus", "1");
            request.input("FTAgnCode", FTAgnCode);

            console.log("🔍 Insert Data:", product);
            // ✅ INSERT ข้อมูลลงใน `TCNTDocSPDTTmp`
            await request.query(`



            INSERT INTO dbo.TMBTDocDTTmpAdj (
            FTBchCode, FTXthDocSeq, FNXtdSeqNo, FTXthDocKey, FTXthDocType, 
            FTXtdBarCode,  FCXtdQtyAll, FTXtdBchRef, FDAjdDateTimeC1, FCAjdUnitQtyC1, FTAjdPlcCode,FDLastUpdOn, 
            FDCreateOn, FTLastUpdBy, FTCreateBy, FTTmpStatus,FTAgnCode
            ) VALUES (
            @FTBchCode, @FTXthDocSeq, @FNXtdSeqNo, @FTXthDocKey, @FTXthDocType, 
            @FTXtdBarCode,  @FCXtdQtyAll, @FTXtdBchRef, @FDAjdDateTimeC1, @FCAjdUnitQtyC1, @FTAjdPlcCode,@FDLastUpdOn, 
            @FDCreateOn, @FTLastUpdBy, @FTCreateBy, @FTTmpStatus, @FTAgnCode
            );
      `);
        }

        return NextResponse.json({ message: "Insert Success", count: products.length }, { status: 201 });

    } catch (error) {
        console.error("Insert Error:", error);
        return NextResponse.json({ message: "Insert Failed", error }, { status: 500 });
    }
}

const convertToCE = (dateString: string) => {
    const date = new Date(dateString);

    if (date.getFullYear() > 2500) {
        date.setFullYear(date.getFullYear() - 543);
    }

    // แปลงเป็น UTC ก่อนลงฐานข้อมูล
    const offset = date.getTimezoneOffset() * 60000; // คำนวณ Offset (เป็น milliseconds)
    const utcDate = new Date(date.getTime() - offset);

    return utcDate.toISOString().replace("T", " ").substring(0, 23);
};