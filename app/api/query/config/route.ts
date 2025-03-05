import { NextRequest, NextResponse } from "next/server";
import { parse } from "cookie";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';

export async function GET(req: NextRequest) {

  try {

    const pool = await C_CTDoConnectToDatabase();
    const result = await pool.request().query(`

     `);
 

    return NextResponse.json(result.recordset, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 403 });
  }
}