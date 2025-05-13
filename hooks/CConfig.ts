// import { Product } from "@/models/models";

export const C_GetoUrlObject = async (): Promise<string> => {
  try {
    // กำหนด base URL จาก environment variable หรือใช้ค่าเริ่มต้น
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = new URL(`${process.env.NEXT_PUBLIC_BASE_PATH}/api/query/selectUrlObject`, baseUrl);

    const response = await fetch(url.toString(), {
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