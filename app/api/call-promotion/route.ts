import { NextResponse } from "next/server";
import { C_GetoUrlObject } from "../../../hooks/CConfig";
import { PdtData } from "@/models/call-promotion";

// const urlMaster = 'https://dev.ada-soft.com:44340/AdaStandard/API2PSMaster/V5';

export async function POST(request: Request) {
     try {
          const pdtData: PdtData = await request.json();

          // Get the URL dynamically
          const urlMaster = await C_GetoUrlObject();

          const response = await fetch(
               `${urlMaster}/Check/CheckProduct`,
               {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                 },
                 body: JSON.stringify(pdtData)
               }
          );

          if (!response.ok) {
               throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          const result = {
               rtCode: data.rtCode,
               rtDesc: data.rtDesc,
               roItem: data.roItem
          };

          return NextResponse.json(result, { status: 200 });
     } catch (error) {
          console.log('Error fetching product data:', error);
          if (error instanceof Error) {
               return NextResponse.json({ message: `Error: ${error.message}` }, { status: 403 });
          } else {
               return NextResponse.json({ message: 'Unknown error occurred' }, { status: 403 });
          }
     }
}