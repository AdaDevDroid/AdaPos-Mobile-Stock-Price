import { NextResponse } from "next/server";
import { PdtData } from "@/models/call-promotion";
import { C_GEToRequiredSession } from "../auth/session";

interface RequestBody extends PdtData {
    urlMaster: string;
}

export async function POST(request: Request) {
     try {
          const { response: unauthorizedResponse } = C_GEToRequiredSession(request);
          if (unauthorizedResponse) return unauthorizedResponse;

          const { urlMaster, ...pdtData }: RequestBody  = await request.json();
          const promotionUrl = C_GETtPromotionUrl(urlMaster);

          const response = await fetch(
               promotionUrl,
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

const C_GETtPromotionUrl = (urlMaster: string): string => {
     const url = new URL(urlMaster);
     const allowedHosts = (process.env.PROMOTION_URL_ALLOWLIST || "")
          .split(",")
          .map((host) => host.trim().toLowerCase())
          .filter(Boolean);

     if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid promotion URL protocol");
     }

     if (allowedHosts.length > 0 && !allowedHosts.includes(url.host.toLowerCase()) && !allowedHosts.includes(url.hostname.toLowerCase())) {
          throw new Error("Promotion URL host is not allowed");
     }

     if (allowedHosts.length === 0 && C_ISbPrivateHost(url.hostname)) {
          throw new Error("Promotion URL host is not allowed");
     }

     return `${url.origin}${url.pathname.replace(/\/+$/, "")}/Check/CheckProduct`;
};

const C_ISbPrivateHost = (hostname: string): boolean => {
     const host = hostname.toLowerCase();

     return (
          host === "localhost" ||
          host.endsWith(".localhost") ||
          host === "0.0.0.0" ||
          host === "127.0.0.1" ||
          host === "::1" ||
          /^127\./.test(host) ||
          /^10\./.test(host) ||
          /^192\.168\./.test(host) ||
          /^169\.254\./.test(host) ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(host)
     );
};
