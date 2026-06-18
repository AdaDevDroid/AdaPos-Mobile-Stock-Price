import { NextRequest, NextResponse } from "next/server";
import mssql from "mssql";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { C_GEToRequiredSession } from "../../auth/session";


export async function POST(req: NextRequest) {
    let newFTXthDocSeq = 0;
    let transaction: mssql.Transaction | null = null;
    try {
        const { session, response } = C_GEToRequiredSession(req);
        if (response) return response;

        const { products, userInfo } = await req.json();
        const tUserCode = session?.FTUsrCode || userInfo?.FTUsrCode;

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ message: "Invalid Data" }, { status: 400 });
        }

        if (!tUserCode) {
            return NextResponse.json({ message: "Invalid User" }, { status: 400 });
        }

        const pool = await C_CTDoConnectToDatabase(req);
        transaction = new mssql.Transaction(pool);
        await transaction.begin(mssql.ISOLATION_LEVEL.SERIALIZABLE);

        const res = await new mssql.Request(transaction)
            .input("FTBchCode", products[0].FTBchCode)
            .input("FTAgnCode", products[0].FTAgnCode)
            .query(`
                SELECT TOP 1 FTXthDocSeq
                FROM TMBTDocDTTmp WITH (UPDLOCK, HOLDLOCK)
                WHERE FTBchCode = @FTBchCode
                  AND FTAgnCode = @FTAgnCode
                ORDER BY TRY_CAST(FTXthDocSeq AS INT) DESC;
            `);

        newFTXthDocSeq = res?.recordset?.[0]?.FTXthDocSeq ? parseInt(res.recordset[0].FTXthDocSeq, 10) + 1 : 1;

        const batchSize = 100;

        for (let batchStart = 0; batchStart < products.length; batchStart += batchSize) {
            const batch = products.slice(batchStart, batchStart + batchSize);
            const values = [];
            const parameters = [];
            const request = new mssql.Request(transaction);

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
                    { name: `FTLastUpdBy${idx}`, value: tUserCode },
                    { name: `FTCreateBy${idx}`, value: tUserCode },
                    { name: `FTAgnCode${idx}`, value: FTAgnCode },
                    { name: `FTPORef${idx}`, value: FTPORef }
                );
            }

            parameters.forEach(p => request.input(p.name, p.value));

            const insertSql = `
        INSERT INTO dbo.TMBTDocDTTmp (
            FTBchCode, FTXthDocSeq, FTXthDocNo, FNXtdSeqNo, FTXthDocKey, FTXthDocType, 
            FTXtdBarCode, FCXtdQty, FCXtdQtyAll, FCXtdCostIn, FDLastUpdOn, 
            FDCreateOn, FTLastUpdBy, FTCreateBy, FTAgnCode, FTPORef
        ) VALUES
        ${values.join(",\n")}
    `;

            await request.query(insertSql);
        }

        await transaction.commit();
        transaction = null;

        return NextResponse.json({ message: "Insert Success", count: products.length }, { status: 201 });

    } catch (error) {
        console.error("Insert Error: ", error);

        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError);
            }
        }

        return NextResponse.json({ message: "Insert Failed", error: (error as Error).message }, { status: 500 });
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
