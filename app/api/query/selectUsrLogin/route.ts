import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { CEncrypt } from '../../../../hooks/CEncrypt';

interface User {
     FTUsrCode: string | null;
     FTUsrLogin: string | null;
     FTUsrLoginPwd: string | null;
     FTUsrName: string | null;
     FTBchCode: string | null;
     FTAgnCode: string | null;
     FTMerCode: string | null;
}

export async function POST(req: Request) {
     const { username, password } = await req.json();
     try {
          const oPool = await C_CTDoConnectToDatabase();
          const aResult = await oPool.request()
               .input("username", username)
               .query(`
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
                    AND FTUsrLogin = @username
                    AND USRL.FNLngID = 1
                    AND GETDATE() BETWEEN FDUsrPwdStart AND FDUsrPwdExpired
               ORDER BY FTUsrCode ASC;
               `);

          const aData = aResult.recordset;
          const oUserData = aData.map((user: User) => ({ ...user }));
          const tEncryptedPassword = new CEncrypt("2").C_PWDtASE128Encrypt(password);

          const oUser = oUserData.find(
               (oUserData) => oUserData.FTUsrLoginPwd === tEncryptedPassword
          );

          if (!oUser) {
               return new NextResponse(JSON.stringify({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }), { status: 401 });
          }

          return new NextResponse(
               JSON.stringify({ message: "Query Success", user: oUser }),
               { status: 200 }
          );
     } catch (error) {
          console.error("Database error:", error);
          return new NextResponse(JSON.stringify({ message: "เกิดข้อผิดพลาด", error: (error as Error).message }), {
               status: 500,
          });
     }
}