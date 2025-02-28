import sql from 'mssql';

const USER_DB = process.env.USER_DB as string;
const PASSWORD_DB = process.env.PASSWORD_DB as string;
const SERVER_DB = process.env.SERVER_DB as string;
const PORT_DB = parseInt(process.env.PORT_DB as string, 10);
const NAME_DB = process.env.NAME_DB as string;

const config = {
  user: USER_DB, // ชื่อผู้ใช้
  password: PASSWORD_DB, //รหัสผ่าน
  server: SERVER_DB, // ชื่อเซิร์ฟเวอร์
  port: PORT_DB, // พอร์ต
  database: NAME_DB, // ชื่อฐานข้อมูล
  options: {
    encrypt: true, // ใช้ true ถ้าใช้ Azure
    trustServerCertificate: true // ใช้ true ถ้าใช้ self-signed certificate
  }
};

export async function C_CTDoConnectToDatabase() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
}
