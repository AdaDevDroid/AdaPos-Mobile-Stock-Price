import { NextRequest, NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';


export async function POST(req: NextRequest) {
    try {
        let newFTXthDocSeq = 0;
        const { products, userInfo } = await req.json();
    
        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ message: "Invalid Data" }, { status: 400 });
        }
    
        const pool = await C_CTDoConnectToDatabase();
    
        const res = await pool.request()
            .input("FTBchCode", products[0].FTBchCode)
            .input("FTAgnCode", products[0].FTAgnCode)
            .query(`
                SELECT TOP 1 FTXthDocSeq
                FROM TMBTDocDTTmpAdj
                WHERE FTBchCode = @FTBchCode
                  AND FTAgnCode = @FTAgnCode
                ORDER BY TRY_CAST(FTXthDocSeq AS INT) DESC;
            `);
    
        newFTXthDocSeq = res?.recordset?.[0]?.FTXthDocSeq
            ? parseInt(res.recordset[0].FTXthDocSeq, 10) + 1
            : 1;
    
        const batchSize = 100;
    
        for (let batchStart = 0; batchStart < products.length; batchStart += batchSize) {
            const batch = products.slice(batchStart, batchStart + batchSize);
            const values = [];
            const parameters = [];
            const request = pool.request();
    
            for (let i = 0; i < batch.length; i++) {
                const product = batch[i];
                const idx = batchStart + i;
                const {
                    FTBarcode, FNQuantity, FTRefDoc,
                    FTXthDocKey, FTBchCode, FTAgnCode, FDCreateOn
                } = product;
    
                const FNXtdSeqNo = idx + 1;
    
                values.push(`(
                    @FTBchCode${idx}, @FTXthDocSeq, @FNXtdSeqNo${idx}, @FTXthDocKey${idx}, @FTXthDocType${idx}, 
                    @FTXtdBarCode${idx}, @FCXtdQtyAll${idx}, @FTXtdBchRef${idx}, @FDAjdDateTimeC1${idx}, @FCAjdUnitQtyC1${idx},
                    @FTAjdPlcCode${idx}, @FDLastUpdOn${idx}, @FDCreateOn${idx}, @FTLastUpdBy${idx}, @FTCreateBy${idx},
                    @FTTmpStatus${idx}, @FTAgnCode${idx}
                )`);
    
                parameters.push(
                    { name: `FTBchCode${idx}`, value: FTBchCode },
                    { name: `FNXtdSeqNo${idx}`, value: FNXtdSeqNo },
                    { name: `FTXthDocKey${idx}`, value: FTXthDocKey },
                    { name: `FTXthDocType${idx}`, value: "1" },
                    { name: `FTXtdBarCode${idx}`, value: FTBarcode },
                    { name: `FCXtdQtyAll${idx}`, value: FNQuantity },
                    { name: `FTXtdBchRef${idx}`, value: "1" },
                    { name: `FDAjdDateTimeC1${idx}`, value: convertToCE(FDCreateOn) },
                    { name: `FCAjdUnitQtyC1${idx}`, value: FNQuantity },
                    { name: `FTAjdPlcCode${idx}`, value: FTRefDoc },
                    { name: `FDLastUpdOn${idx}`, value: convertToCE(FDCreateOn) },
                    { name: `FDCreateOn${idx}`, value: convertToCE(FDCreateOn) },
                    { name: `FTLastUpdBy${idx}`, value: userInfo.FTUsrCode },
                    { name: `FTCreateBy${idx}`, value: userInfo.FTUsrCode },
                    { name: `FTTmpStatus${idx}`, value: "1" },
                    { name: `FTAgnCode${idx}`, value: FTAgnCode }
                );
            }
    
            request.input("FTXthDocSeq", newFTXthDocSeq);
            parameters.forEach(p => request.input(p.name, p.value));
    
            const sql = `
                INSERT INTO dbo.TMBTDocDTTmpAdj (
                    FTBchCode, FTXthDocSeq, FNXtdSeqNo, FTXthDocKey, FTXthDocType, 
                    FTXtdBarCode, FCXtdQtyAll, FTXtdBchRef, FDAjdDateTimeC1, FCAjdUnitQtyC1,
                    FTAjdPlcCode, FDLastUpdOn, FDCreateOn, FTLastUpdBy, FTCreateBy,
                    FTTmpStatus, FTAgnCode
                ) VALUES
                ${values.join(",\n")}
            `;
    
            console.log(`🟡 Inserting batch ${batchStart}-${batchStart + batch.length - 1}`);
            await request.query(sql);
        }
    
        return NextResponse.json({ message: "Insert Success", count: products.length }, { status: 201 });
    
    } catch (error) {
        console.error("❌ Insert Error:", error);
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
