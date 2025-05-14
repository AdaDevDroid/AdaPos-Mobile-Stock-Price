// import { Product } from "@/models/models";

export const C_GetoUrlObject = async (): Promise<string> => {
  try {
    
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/AdaCheckStockSTD';
    const url = `${basePath}/api/query/selectUrlObject`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      console.log('URL object:', data.data[0].FTUrlAddress);
      return data.data[0].FTUrlAddress;
    } else {
      throw new Error("No URL found");
    }
  } catch (error) {
    console.log('Error fetching URL object:', error);
    throw error;
  }
};