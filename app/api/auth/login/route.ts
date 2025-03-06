import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { CEncrypt } from '../../../../hooks/CEncrypt';

console.log("process login 2.1");
const SECRET_KEY = process.env.SECRET_KEY as string;

interface User {
  FTUsrCode: string| null;
  FTUsrLogin: string | null;
  FTUsrLoginPwd: string | null;
  FTUsrName: string | null;
  FTBchCode: string | null;
  FTAgnCode: string | null;
  FTMerCode: string | null;
}

export async function POST(req: Request) {
  const { username, password } = await req.json();
  console.log("process login 2.2");
  
  // 🛑 ตรวจสอบ Username/Password
  const oPool = await C_CTDoConnectToDatabase();
    const aResult = await oPool.request().query(`
      SELECT DISTINCT
        USRLI.FTUsrCode,
        FTUsrLogin,
		    FTUsrLoginPwd,
	      USRL.FTUsrName,
		    USRG.FTBchCode,
        USRL.FTAgnCode,
	      USRG.FTMerCode
      FROM TCNMUsrLogin USRLI WITH (NOLOCK)
      INNER JOIN TCNMUser_L USRL
        ON USRL.FTUsrCode = USRLI.FTUsrCode
	      AND USRL.FTAgnCode = USRLI.FTAgnCode
      INNER JOIN TCNTUsrGroup USRG
        ON USRG.FTUsrCode = USRLI.FTUsrCode
	      AND USRL.FTAgnCode = USRLI.FTAgnCode
      WHERE
        FTUsrStaActive = '1'
        AND FTUsrLogType = '1'
        AND FTUsrLogin = '${username}'
        AND USRL.FNLngID = 1
        AND GETDATE() BETWEEN FDUsrPwdStart AND FDUsrPwdExpired
      ORDER BY FTUsrCode ASC;
     `);

  const aData = aResult.recordset;
  const oUserData = aData.map((user: User) => ({...user,}));
  const tEncryptedPassword = new CEncrypt("2").C_PWDtASE128Encrypt(password);

  const oUser = oUserData.find(
    (oUserData) => oUserData.FTUsrLoginPwd === tEncryptedPassword
  );

  if (!oUser) {
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