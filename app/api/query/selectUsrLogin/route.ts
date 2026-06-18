import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import { CEncrypt } from '../../../../hooks/CEncrypt';
import { C_GETtSessionToken } from "../../auth/session";

interface User {
     FTUsrCode: string | null;
     FTUsrLogin: string | null;
     FTUsrLoginPwd: string | null;
     FTUsrName: string | null;
     FTBchCode: string | null;
     FTBchName: string | null;
     FTAgnCode: string | null;
     FTAgnName: string | null;
     FTMerCode: string | null;
     FTImgObj: string | null;
}

export async function POST(req: Request) {
     try {
          const { username, password } = await req.json();

          if (!username || !password) {
               return new NextResponse(JSON.stringify({ message: "Username and password are required" }), { status: 400 });
          }

          const oPool = await C_CTDoConnectToDatabase(req);
          const aResult = await oPool.request()
               .input("username", username)
               .query(`
               SELECT DISTINCT
               USRLI.FTUsrCode,
               FTUsrLogin,
               FTUsrLoginPwd,
               USRL.FTUsrName,
               USRG.FTBchCode,
               BCHL.FTBchName,
               USRL.FTAgnCode,
               AGNL.FTAgnName,
               USRG.FTMerCode,
               ISNULL(IMGAGY.FTImgObj, IMGCOMP.FTImgObj) AS FTImgObj
               FROM TCNMUsrLogin USRLI WITH (NOLOCK)
               INNER JOIN TCNMUser_L USRL WITH (NOLOCK)
               ON USRL.FTUsrCode = USRLI.FTUsrCode
               AND USRL.FTAgnCode = USRLI.FTAgnCode
               INNER JOIN TCNTUsrGroup USRG WITH (NOLOCK)
               ON USRG.FTUsrCode = USRLI.FTUsrCode
               AND USRG.FTAgnCode = USRLI.FTAgnCode
               LEFT JOIN TCNMBranch_L BCHL WITH (NOLOCK)
               ON BCHL.FTBchCode = USRG.FTBchCode
               LEFT JOIN TCNMAgency_L AGNL WITH (NOLOCK)
               ON AGNL.FTAgnCode = USRLI.FTAgnCode
               OUTER APPLY (
               SELECT TOP 1 FTImgObj
               FROM TCNMImgObj WITH (NOLOCK)
               WHERE FTAgnCode = USRLI.FTAgnCode AND FTImgTable = 'TCNMAgency'
               ) IMGAGY
               OUTER APPLY (
               SELECT TOP 1 FTImgObj
               FROM TCNMImgObj WITH (NOLOCK)
               WHERE FTImgTable = 'TCNMComp'
               ) IMGCOMP
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

          const oUser = oUserData.filter(
                  (oUserData) => oUserData.FTUsrLoginPwd === tEncryptedPassword
          );

          if (oUser.length === 0) {
               return new NextResponse(JSON.stringify({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }), { status: 401 });
          }

          const token = C_GETtSessionToken(oUser[0]);

          return new NextResponse(
               JSON.stringify({ message: "Query Success", user: oUser, token }),
               { status: 200 }
          );
     } catch (error) {
          console.error("Login error:", error);
          return new NextResponse(JSON.stringify({ message: "เกิดข้อผิดพลาด" }), {
               status: 500,
          });
     }
}
