import { NextRequest, NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';


export async function POST(req: NextRequest) {
    let newFTXthDocSeq = 0;
    const { products, userInfo } = await req.json();
    try {

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ message: "Invalid Data" }, { status: 400 });
        }

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

        newFTXthDocSeq = res?.recordset?.[0]?.FTXthDocSeq ? parseInt(res.recordset[0].FTXthDocSeq, 10) + 1 : 1;
        console.log("🔍 res Data:", newFTXthDocSeq);

        const batchSize = 100;

        for (let batchStart = 0; batchStart < products.length; batchStart += batchSize) {
            const batch = products.slice(batchStart, batchStart + batchSize);
            const values = [];
            const parameters = [];
            const request = pool.request();

            request.input("FTXthDocSeq", newFTXthDocSeq); // ใช้เลขเดียวกันทั้งหมด

            for (let index = 0; index < batch.length; index++) {
                const product = batch[index];
                const {
                    FTBarcode, FCCost, FNQuantity, FTRefDoc,
                    FTXthDocKey, FTBchCode, FTAgnCode, FDCreateOn, FTPORef
                } = product;

                const FNId = batchStart + index + 1;
                const idx = batchStart + index;

                values.push(`(@FTBchCode${idx}, @FTXthDocSeq, @FTXthDocNo${idx}, @FNXtdSeqNo${idx}, 
                    @FTXthDocKey${idx}, NULL, @FTXtdBarCode${idx}, @FCXtdQty${idx}, @FCXtdQtyAll${idx}, 
                    @FCXtdCostIn${idx}, @FDLastUpdOn${idx}, @FDCreateOn${idx}, @FTLastUpdBy${idx}, 
                    @FTCreateBy${idx}, @FTAgnCode${idx}, @FTPORef${idx})`);

                parameters.push(
                    { name: `FTBchCode${idx}`, value: FTBchCode },
                    { name: `FTXthDocNo${idx}`, value: FTRefDoc },
                    { name: `FNXtdSeqNo${idx}`, value: FNId },
                    { name: `FTXthDocKey${idx}`, value: FTXthDocKey },
                    { name: `FTXtdBarCode${idx}`, value: FTBarcode },
                    { name: `FCXtdQty${idx}`, value: FNQuantity },
                    { name: `FCXtdQtyAll${idx}`, value: FNQuantity },
                    { name: `FCXtdCostIn${idx}`, value: FCCost },
                    { name: `FDLastUpdOn${idx}`, value: convertToCE(FDCreateOn) },
                    { name: `FDCreateOn${idx}`, value: convertToCE(FDCreateOn) },
                    { name: `FTLastUpdBy${idx}`, value: userInfo.FTUsrCode },
                    { name: `FTCreateBy${idx}`, value: userInfo.FTUsrCode },
                    { name: `FTAgnCode${idx}`, value: FTAgnCode },
                    { name: `FTPORef${idx}`, value: FTPORef }
                );
            }

            parameters.forEach(p => request.input(p.name, p.value));

            const sql = `
        INSERT INTO dbo.TMBTDocDTTmp (
            FTBchCode, FTXthDocSeq, FTXthDocNo, FNXtdSeqNo, FTXthDocKey, FTXthDocType, 
            FTXtdBarCode, FCXtdQty, FCXtdQtyAll, FCXtdCostIn, FDLastUpdOn, 
            FDCreateOn, FTLastUpdBy, FTCreateBy, FTAgnCode, FTPORef
        ) VALUES
        ${values.join(",\n")}
    `;

            console.log(`🔄 Inserting batch ${batchStart}-${batchStart + batch.length - 1}`);
            await request.query(sql);
        }

        return NextResponse.json({ message: "Insert Success", count: products.length }, { status: 201 });

    } catch (error) {
        console.log("Insert Error: ", error);

        // ✅ Rollback partial inserts if error happens
        try {
            const pool = await C_CTDoConnectToDatabase();
            await pool.request()
                .input("FTXthDocSeq", newFTXthDocSeq)
                .input("FTBchCode", products[0].FTBchCode)
                .input("FTAgnCode", products[0].FTAgnCode)
                .query(`
                    DELETE FROM TMBTDocDTTmp
                    WHERE FTXthDocSeq = @FTXthDocSeq
                    AND FTBchCode = @FTBchCode
                    AND FTAgnCode = @FTAgnCode
                `);
            console.log(`🗑️ Rolled back data with FTXthDocSeq = ${newFTXthDocSeq}`);
        } catch (rollbackError) {
            console.error("❌ Rollback failed:", rollbackError);
        }

        return NextResponse.json({ message: "Insert Failed", error }, { status: 500 });
    }
}

const convertToCE = (dateString: string): string => {
    const date = new Date(dateString);

    if (date.getFullYear() > 2500) {
        date.setFullYear(date.getFullYear() - 543);
    }

    // แปลงเป็น UTC ก่อนลงฐานข้อมูล
    const offset = date.getTimezoneOffset() * 60000; // คำนวณ Offset (เป็น milliseconds)
    const utcDate = new Date(date.getTime() - offset);

    return utcDate.toISOString().replace("T", " ").substring(0, 23);
};