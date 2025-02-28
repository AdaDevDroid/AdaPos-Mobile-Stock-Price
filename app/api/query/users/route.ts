import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import { NextApiRequest, NextApiResponse } from 'next';
import { C_CTDoConnectToDatabase } from '../../database/connect_db';

const SECRET_KEY = process.env.SECRET_KEY as string;

export async function GET(req: NextRequest) {
  // ✅ ดึง Cookie จาก Request
  const cookies = parse(req.headers.get("cookie") || "");
  const token = cookies.session_token;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {

    const pool = await C_CTDoConnectToDatabase();
    const result = await pool.request().query(`
     SELECT DISTINCT 
          USR.FTUsrCode, 
          USL.FTUsrLogin, 
          ISNULL(USRL.FTUsrName, '') AS FTUsrName,
          USL2.FTUsrLogType, 
          USL2.FTUsrLoginPwd, 
          USL2.FTUsrStaActive,
          USL.FDUsrPwdStart, 
          USL.FDUsrPwdExpired 
     FROM TCNMUser USR
     LEFT JOIN TCNMUser_L USRL 
          ON USRL.FTUsrCode = USR.FTUsrCode 
     LEFT JOIN TCNMUsrLogin USL 
          ON USL.FTUsrCode = USR.FTUsrCode  
          AND USL.FTUsrStaActive != '2' 
          AND USL.FTUsrLogType = '2'
     LEFT JOIN (
          SELECT 
               FTUsrCode, 
               FTUsrLogType, 
               FDUsrPwdStart, 
               FDUsrPwdExpired, 
               FTUsrLogin, 
               FTUsrLoginPwd, 
               FTUsrRmk, 
               FTUsrStaActive
          FROM TCNMUsrLogin 
          WHERE FTUsrLogType = '2') AS USL2 ON USL2.FTUsrCode = USR.FTUsrCode
     WHERE 
          USL.FDUsrPwdStart IS NOT NULL 
          AND USL.FDUsrPwdExpired IS NOT NULL 
          AND GETDATE() BETWEEN USL.FDUsrPwdStart AND USL.FDUsrPwdExpired
     ORDER BY 
          USR.FTUsrCode, 
          USL.FDUsrPwdStart DESC;
     `);
 

    return NextResponse.json(result.recordset, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 403 });
  }
}