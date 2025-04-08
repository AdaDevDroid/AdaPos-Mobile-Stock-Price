import { NextRequest, NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { Product } from "@/models/models";

export async function POST(req: NextRequest) {
    try {

        // ✅ รับ JSON Data เป็น Array ของ Product[]
        const products: Product[] = await req.json();

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ message: "Invalid Data" }, { status: 400 });
        }

        // ✅ เชื่อมต่อฐานข้อมูล
        const pool = await C_CTDoConnectToDatabase();

        for (let index = 0; index < products.length; index++) {
            const product = products[index];
            const {
                FTBarcode, FCCost, FNQuantity, FTRefDoc,
                FTXthDocKey, FTBchCode, FTAgnCode, FTUsrName, FDCreateOn, FTPORef
            } = product;

            const FNId = index + 1;

            const request = pool.request();
            request.input("FTBchCode", FTBchCode);
            request.input("FTXthDocNo", FTRefDoc);
            request.input("FNXtdSeqNo", FNId);
            request.input("FTXthDocKey", FTXthDocKey);
            request.input("FTXthDocType", null);
            request.input("FTXtdBarCode", FTBarcode);
            request.input("FCXtdQty", FNQuantity);
            request.input("FCXtdQtyAll", FNQuantity);
            request.input("FCXtdCostIn", FCCost);
            request.input("FDLastUpdOn", convertToCE(FDCreateOn));
            request.input("FDCreateOn", convertToCE(FDCreateOn));
            request.input("FTLastUpdBy", FTUsrName);
            request.input("FTCreateBy", FTUsrName);
            request.input("FTAgnCode", FTAgnCode);
            request.input("FTPORef", FTPORef);

            console.log("🔍 Insert Data:", product);
            // ✅ INSERT ข้อมูลลงใน `TCNTDocSPDTTmp`
            await request.query(`
            INSERT INTO dbo.TMBTDocDTTmp (
            FTBchCode, FTXthDocNo, FNXtdSeqNo, FTXthDocKey, FTXthDocType, 
            FTXtdBarCode, FCXtdQty, FCXtdQtyAll, FCXtdCostIn, FDLastUpdOn, 
            FDCreateOn, FTLastUpdBy, FTCreateBy, FTAgnCode, FTPORef
            ) VALUES (
            @FTBchCode, @FTXthDocNo, @FNXtdSeqNo, @FTXthDocKey, @FTXthDocType, 
            @FTXtdBarCode, @FCXtdQty, @FCXtdQtyAll, @FCXtdCostIn, @FDLastUpdOn, 
            @FDCreateOn, @FTLastUpdBy, @FTCreateBy, @FTAgnCode, @FTPORef
            );
      `);
        }

        return NextResponse.json({ message: "Insert Success", count: products.length }, { status: 201 });

    } catch (error) {
        console.log("Insert Error:", error);
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