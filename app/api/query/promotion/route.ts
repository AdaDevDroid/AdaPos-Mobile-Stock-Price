import { NextRequest, NextResponse } from "next/server";
import { parse } from "cookie";
import { C_CTDoConnectToDatabase } from '../../database/connect_db';
import axios from 'axios';

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

          const response = await axios.post<PdtData>(
               'https://dev.ada-soft.com:44340/AdaStandard/API2PSMaster/V5/Check/CheckProduct', 
               pdtData,
               {
                 headers: {
                   'Content-Type': 'application/json',
                   // 'Authorization': `Bearer ${YOUR_TOKEN}`
                 }
               }
             );
         
          console.log('PdtData :', response.data);

          return NextResponse.json(response.data, { status: 200 });
     } catch (error) {
          return NextResponse.json({ message: error }, { status: 403 });
     }
}