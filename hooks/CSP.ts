import { Product, UserInfo } from "@/models/models";

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

export const C_INSxProducts = async (oProducts: Product[], oUserInfo: UserInfo): Promise<boolean> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH}/api/query/insertDataProduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: oProducts,
        userInfo: oUserInfo,
      }),
    });

    const data = await response.json();

    if (response.status === 201) {
      console.log("✅ Insert Success:", data);
      return true;
    } else {
      console.warn(`⚠️ Insert failed with status ${response.status}`, data);
      return false;
    }

  } catch (error) {
    console.error("❌ Insert Failed (Exception):", error);
    return false;
  }
};

export const C_INSxStock = async (oProducts: Product[], oUserInfo: UserInfo): Promise<boolean> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH}/api/query/insertDataAdjStk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: oProducts,
        userInfo: oUserInfo
      })
    });

    const data = await response.json();

    if (response.status === 201) {
      console.log("✅ Insert Success:", data);
      return true;
    } else {
      console.warn(`⚠️ Insert failed with status ${response.status}`, data);
      return false;
    }

  } catch (error) {
    console.error("❌ Insert Failed (Exception):", error);
    return false;
  }
};

export const C_GETtGenerateRandomID = () => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000000);
  return `${timestamp}-${randomNum}`;
};