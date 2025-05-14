import { NextResponse } from "next/server";
import { PdtData } from "@/models/call-promotion";

interface RequestBody extends PdtData {
    urlMaster: string;
}

export async function POST(request: Request) {
     try {
          const { urlMaster, ...pdtData }: RequestBody  = await request.json();

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