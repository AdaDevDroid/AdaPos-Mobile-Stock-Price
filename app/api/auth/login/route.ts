import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { CEncrypt } from '../../../../hooks/CEncrypt';

console.log("process login 2.1");
const SECRET_KEY = process.env.SECRET_KEY as string;

interface User {
  FTUsrCode: string;
  FTUsrLogin: string | null;
  FTUsrName: string | null;
  FTUsrLogType: string | null;
  FTUsrLoginPwd: string | null;
  FTUsrStaActive: string | null;
  FDUsrPwdStart: Date | null;
  FDUsrPwdExpired: Date | null;
}

export async function POST(req: Request) {
  const { username, password } = await req.json();
  console.log("process login 2.2");
  
  // 🛑 ตรวจสอบ Username/Password
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
          AND USL.FTUsrStaActive = '1' 
          AND USL.FTUsrLogType = '1'
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
          WHERE FTUsrLogType = '1') AS USL2 ON USL2.FTUsrCode = USR.FTUsrCode
     WHERE 
          USL.FDUsrPwdStart IS NOT NULL 
          AND USL.FDUsrPwdExpired IS NOT NULL 
          AND GETDATE() BETWEEN USL.FDUsrPwdStart AND USL.FDUsrPwdExpired
     ORDER BY 
          USR.FTUsrCode, 
          USL.FDUsrPwdStart DESC;
     `);

  const data = result.recordset;
  const formattedData = data.map((user: User) => ({
    ...user,
    FDUsrPwdStart: user.FDUsrPwdStart ? new Date(user.FDUsrPwdStart).toISOString() : null,
    FDUsrPwdExpired: user.FDUsrPwdExpired ? new Date(user.FDUsrPwdExpired).toISOString() : null,
  }));

  const tEncryptedPassword = new CEncrypt("2").C_PWDtASE128Encrypt(password);

  const user = formattedData.find(
    (user) => user.FTUsrName === username && user.FTUsrLoginPwd === tEncryptedPassword
  );

  if (!user) {
    return new NextResponse(JSON.stringify({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }), { status: 401 });
  }

  // ✅ สร้าง JWT Token 
  console.log("process login 2.3");
  const token = jwt.sign(
    { id: 1, username }, // ใส่ข้อมูลผู้ใช้ลงไป
    SECRET_KEY,
    { expiresIn: "2h" } // ⏳ Token หมดอายุใน 1 วัน
  );

  console.log("process login 2.4");
  // 🍪 สร้าง HttpOnly Cookie เพื่อเก็บ Token
  const cookie = serialize("session_token", token, {
    httpOnly: true,
    secure: false, // ✅ ปิด secure ถ้าเป็น localhost
    sameSite: "lax", // ✅ ป้องกัน Cookie หายบน HTTP
    path: "/",
    maxAge: 60 * 60 * 24, // 1 วัน (24 ชั่วโมง)
  });

  console.log("process login 2.5");
  return new NextResponse(JSON.stringify({ message: "Login Success" }), {
    status: 200,
    headers: { "Set-Cookie": cookie },
  });
}