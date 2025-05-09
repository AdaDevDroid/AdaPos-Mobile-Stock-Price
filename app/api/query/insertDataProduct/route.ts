import { NextRequest, NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';


export async function POST(req: NextRequest) {
    try {
        let newFTXthDocSeq = 0;
        // ✅ รับ JSON Data เป็น Array ของ Product[]
        const { products, userInfo } = await req.json();



        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ message: "Invalid Data" }, { status: 400 });
        }

        // ✅ เชื่อมต่อฐานข้อมูล
        const pool = await C_CTDoConnectToDatabase();


        const res = await pool.request()
        .input("FTBchCode", products[0].FTBchCode)
        .input("FTAgnCode", products[0].FTAgnCode)
        .query(`
            SELECT TOP 1 FTXthDocSeq
            FROM TMBTDocDTTmp
            WHERE FTBchCode = @FTBchCode
			AND FTAgnCode = @FTAgnCode

            ORDER BY TRY_CAST(FTXthDocSeq AS INT) DESC;

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
            FTBarcode, FCCost, FNQuantity, FTRefDoc,
            FTXthDocKey, FTBchCode, FTAgnCode, FDCreateOn, FTPORef
        } = product;

        const FNId = index + 1;

        let retryCount = 0;
        const maxRetries = 3;
        let success = false;

        while (!success && retryCount < maxRetries) {
            try {
                const request = pool.request();
                request.input("FTBchCode", FTBchCode);
                request.input("FTXthDocSeq", newFTXthDocSeq);
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
                request.input("FTLastUpdBy", userInfo.FTUsrCode);
                request.input("FTCreateBy", userInfo.FTUsrCode);
                request.input("FTAgnCode", FTAgnCode);
                request.input("FTPORef", FTPORef);

                console.log("🔍 Insert Data:3", product);
                // ✅ INSERT ข้อมูลลงใน `TCNTDocSPDTTmp`
                await request.query(`
                INSERT INTO dbo.TMBTDocDTTmp (
                FTBchCode, FTXthDocSeq, FTXthDocNo, FNXtdSeqNo, FTXthDocKey, FTXthDocType, 
                FTXtdBarCode, FCXtdQty, FCXtdQtyAll, FCXtdCostIn, FDLastUpdOn, 
                FDCreateOn, FTLastUpdBy, FTCreateBy, FTAgnCode, FTPORef
                ) VALUES (
                @FTBchCode, @FTXthDocSeq, @FTXthDocNo, @FNXtdSeqNo, @FTXthDocKey, @FTXthDocType, 
                @FTXtdBarCode, @FCXtdQty, @FCXtdQtyAll, @FCXtdCostIn, @FDLastUpdOn, 
                @FDCreateOn, @FTLastUpdBy, @FTCreateBy, @FTAgnCode, @FTPORef
                );
          `);
                success = true;
            } catch (error) {
                retryCount++;
                newFTXthDocSeq = parseInt(res.recordset[0].FTXthDocSeq, 10) + retryCount;
                console.log(`Retrying (${retryCount}/${maxRetries}) due to error:`, error);
                if (retryCount >= maxRetries) {
                    throw new Error(`Failed to insert product after ${maxRetries} attempts`);
                }
            }
        }
    }

        return NextResponse.json({ message: "Insert Success", count: products.length }, { status: 201 });

    } catch (error) {
        console.log("Insert Error: 2", error);
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