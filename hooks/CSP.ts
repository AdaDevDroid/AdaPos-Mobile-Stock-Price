import { Product } from "@/models/models";

export function C_SETxFormattedDate(): string {
    const now = new Date();

    const buddhistYear = now.getFullYear() + 543;
    
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

    return `${buddhistYear}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export const C_INSxProducts = async (oProducts: Product[]) => {
    try {
      const response = await fetch('/api/query/insertDataProduct', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(oProducts)
      });
  
      const data = await response.json();
      console.log("✅ Insert Success:", data);
    } catch (error) {
      console.log("❌ Insert Failed:", error);
    }
};

export const C_INSxStock = async (oProducts: Product[]) => {
  try {
    const response = await fetch('/api/query/insertDataAdjStk', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(oProducts)
    });

    const data = await response.json();
    console.log("✅ Insert Success:", data);
  } catch (error) {
    console.log("❌ Insert Failed:", error);
  }
};