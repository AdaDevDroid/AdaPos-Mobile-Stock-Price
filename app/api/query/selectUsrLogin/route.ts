import { NextResponse } from "next/server";
import { C_CTDoConnectToDatabase } from "../../database/connect_db";
import { CEncrypt } from "../../../../hooks/CEncrypt";
import { C_GETtRequestDatabasePart, C_GETtSessionToken } from "../../auth/session";

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
  FTStaHasGroup: string;
}

type SqlPool = Awaited<ReturnType<typeof C_CTDoConnectToDatabase>>;

const agencySchemaByPool = new WeakMap<SqlPool, Promise<boolean>>();

const C_ISbAgencyUserSchema = async (pool: SqlPool): Promise<boolean> => {
  let schemaPromise = agencySchemaByPool.get(pool);
  if (!schemaPromise) {
    schemaPromise = pool.request().query(`
      SELECT 1 AS ok
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'TCNMUsrLogin'
        AND COLUMN_NAME = 'FTAgnCode'
    `).then((result) => result.recordset.length > 0);
    agencySchemaByPool.set(pool, schemaPromise);
  }

  try {
    return await schemaPromise;
  } catch (error) {
    agencySchemaByPool.delete(pool);
    throw error;
  }
};

const C_GETtLoginQuery = (isAgencySchema: boolean): string => {
  if (isAgencySchema) {
    return `
      SELECT DISTINCT
      USRLI.FTUsrCode,
      USRLI.FTUsrLogin,
      USRLI.FTUsrLoginPwd,
      USRL.FTUsrName,
      USRG.FTBchCode,
      BCHL.FTBchName,
      USRL.FTAgnCode,
      AGNL.FTAgnName,
      USRG.FTMerCode,
      ISNULL(IMGAGY.FTImgObj, IMGCOMP.FTImgObj) AS FTImgObj,
      CASE WHEN USRG.FTUsrCode IS NULL THEN '0' ELSE '1' END AS FTStaHasGroup
      FROM TCNMUsrLogin USRLI WITH (NOLOCK)
      INNER JOIN TCNMUser_L USRL WITH (NOLOCK)
        ON USRL.FTUsrCode = USRLI.FTUsrCode
       AND USRL.FTAgnCode = USRLI.FTAgnCode
      LEFT JOIN TCNTUsrGroup USRG WITH (NOLOCK)
        ON USRG.FTUsrCode = USRLI.FTUsrCode
       AND USRG.FTAgnCode = USRLI.FTAgnCode
      LEFT JOIN TCNMBranch_L BCHL WITH (NOLOCK)
        ON BCHL.FTBchCode = USRG.FTBchCode
       AND BCHL.FNLngID = 1
      LEFT JOIN TCNMAgency_L AGNL WITH (NOLOCK)
        ON AGNL.FTAgnCode = USRLI.FTAgnCode
       AND AGNL.FNLngID = 1
      OUTER APPLY (
        SELECT TOP 1 FTImgObj
        FROM TCNMImgObj WITH (NOLOCK)
        WHERE TCNMImgObj.FTAgnCode = USRLI.FTAgnCode
          AND TCNMImgObj.FTImgTable = 'TCNMAgency'
      ) IMGAGY
      OUTER APPLY (
        SELECT TOP 1 FTImgObj
        FROM TCNMImgObj WITH (NOLOCK)
        WHERE FTImgTable = 'TCNMComp'
      ) IMGCOMP
      WHERE USRLI.FTUsrStaActive = '1'
        AND USRLI.FTUsrLogType = '1'
        AND USRLI.FTUsrLogin = @username
        AND USRL.FNLngID = 1
        AND GETDATE() BETWEEN USRLI.FDUsrPwdStart AND USRLI.FDUsrPwdExpired
      ORDER BY USRLI.FTUsrCode ASC;
    `;
  }

  return `
    SELECT DISTINCT
    USRLI.FTUsrCode,
    USRLI.FTUsrLogin,
    USRLI.FTUsrLoginPwd,
    USRL.FTUsrName,
    USRG.FTBchCode,
    BCHL.FTBchName,
    USRG.FTAgnCode,
    AGNL.FTAgnName,
    USRG.FTMerCode,
    ISNULL(IMGCOMP.FTImgObj, '') AS FTImgObj,
    CASE WHEN USRG.FTUsrCode IS NULL THEN '0' ELSE '1' END AS FTStaHasGroup
    FROM TCNMUsrLogin USRLI WITH (NOLOCK)
    INNER JOIN TCNMUser_L USRL WITH (NOLOCK)
      ON USRL.FTUsrCode = USRLI.FTUsrCode
    LEFT JOIN TCNTUsrGroup USRG WITH (NOLOCK)
      ON USRG.FTUsrCode = USRLI.FTUsrCode
    LEFT JOIN TCNMBranch_L BCHL WITH (NOLOCK)
      ON BCHL.FTBchCode = USRG.FTBchCode
     AND BCHL.FNLngID = 1
    LEFT JOIN TCNMAgency_L AGNL WITH (NOLOCK)
      ON AGNL.FTAgnCode = USRG.FTAgnCode
     AND AGNL.FNLngID = 1
    OUTER APPLY (
      SELECT TOP 1 FTImgObj
      FROM TCNMImgObj WITH (NOLOCK)
      WHERE FTImgTable = 'TCNMComp'
    ) IMGCOMP
    WHERE USRLI.FTUsrStaActive = '1'
      AND USRLI.FTUsrLogType = '1'
      AND USRLI.FTUsrLogin = @username
      AND USRL.FNLngID = 1
      AND GETDATE() BETWEEN USRLI.FDUsrPwdStart AND USRLI.FDUsrPwdExpired
    ORDER BY USRLI.FTUsrCode ASC;
  `;
};

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
    }

    const pool = await C_CTDoConnectToDatabase(req);
    const isAgencySchema = await C_ISbAgencyUserSchema(pool);
    const result = await pool.request()
      .input("username", username)
      .query(C_GETtLoginQuery(isAgencySchema));

    const users = (result.recordset || []).map((user: User) => ({ ...user }));
    const encryptedPassword = new CEncrypt("2").C_PWDtASE128Encrypt(password);
    const matchedUsers = users.filter((user: User) => user.FTUsrLoginPwd === encryptedPassword);

    if (matchedUsers.length === 0) {
      return NextResponse.json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const branchUsers = matchedUsers.filter((user: User) => user.FTStaHasGroup === "1");
    if (branchUsers.length === 0) {
      return NextResponse.json(
        { code: "no-branch-available", message: "ไม่พบข้อมูลสาขาในระบบ กรุณาติดต่อผู้ดูแล" },
        { status: 409 },
      );
    }

    const token = C_GETtSessionToken(branchUsers[0], C_GETtRequestDatabasePart(req));
    return NextResponse.json({ message: "Query Success", user: branchUsers, token });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
