// import { Product } from "@/models/models";

export const C_GetoUrlObject = async (): Promise<string> => {
  try {
    const response = await fetch('/api/query/selectUrlObject', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].FTUrlAddress; // Return the fetched URL
    } else {
      throw new Error("No URL found");
    }
  } catch (error) {
    console.log('Error fetching URL object:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
};