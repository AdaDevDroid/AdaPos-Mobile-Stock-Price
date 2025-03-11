import { NextRequest, NextResponse } from "next/server";
import { parse } from "cookie";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';

interface PdtData {
     ptAgnCode: string;
     ptBchCode: string;
     ptMerCode: string;
     ptShpCode: string;
     ptWahCode: string;
     ptPdtCode: string;
}

export async function GET(req: NextRequest) {

     try {
          const pdtData: PdtData = {
               ptAgnCode: '00001',
               ptBchCode: '00001',
               ptMerCode: '00001',
               ptShpCode: '00001',
               ptWahCode: '00001',
               ptPdtCode: '00001',
          };

          const response = await fetch(
               'https://dev.ada-soft.com:44340/AdaStandard/API2PSMaster/V5/Check/CheckProduct', 
               {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                   // 'Authorization': `Bearer ${YOUR_TOKEN}`
                 },
                 body: JSON.stringify(pdtData)
               }
             );
         
          const data = await response.json();
          console.log('PdtData :', data);

          return NextResponse.json(data, { status: 200 });
     } catch (error) {
          return NextResponse.json({ message: error }, { status: 403 });
     }
}