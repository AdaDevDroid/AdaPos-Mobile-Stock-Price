// import { Product } from "@/models/models";
import { C_GEToDatabaseHeaders, C_GETtPartUrl } from "@/hooks/CDatabaseSettings";

export const C_GetoUrlObject = async (): Promise<string> => {
  try {
    
    const response = await fetch(C_GETtPartUrl("/api/query/selectUrlObject"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...C_GEToDatabaseHeaders() },
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
