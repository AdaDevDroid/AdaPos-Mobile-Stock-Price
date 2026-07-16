export const C_ISbValidSettingsAdmin = (username: unknown, password: unknown) => {
  const adminUser = process.env.SETTINGS_ADMIN_USER;
  const adminPassword = process.env.SETTINGS_ADMIN_PASSWORD;

  if (process.env.NODE_ENV === "production" && (!adminUser || !adminPassword)) {
    throw new Error("SETTINGS_ADMIN_USER and SETTINGS_ADMIN_PASSWORD are required in production");
  }

  return username === (adminUser || "009") && password === (adminPassword || "12345678");
};
