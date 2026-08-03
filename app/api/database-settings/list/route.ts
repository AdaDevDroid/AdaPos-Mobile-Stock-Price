import { NextResponse } from "next/server";
import { C_ISbValidSettingsAdmin } from "../admin";
import {
  C_GEToDatabaseConnectionSetting,
  C_GEToMergedDatabaseSettings,
  C_GEToPublicDatabaseSetting,
  C_GETaSortedSettingParts,
  PublicDatabaseSetting,
} from "../config";
import { C_ISbDatabaseConnected } from "../sql-connection";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!C_ISbValidSettingsAdmin(username, password)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const settings = C_GEToMergedDatabaseSettings();
    const data = await Promise.all(
      C_GETaSortedSettingParts(Object.keys(settings)).map(
        async (part): Promise<PublicDatabaseSetting | null> => {
          const setting = settings[part];
          const publicSetting = C_GEToPublicDatabaseSetting(part, setting);
          if (!publicSetting) return null;

          const connectionSetting = C_GEToDatabaseConnectionSetting(setting);
          if (!connectionSetting) return publicSetting;

          return {
            ...publicSetting,
            connected: await C_ISbDatabaseConnected(connectionSetting),
          };
        },
      ),
    );

    return NextResponse.json({
      data: data.filter((setting): setting is PublicDatabaseSetting => Boolean(setting)),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load database settings", error: (error as Error).message },
      { status: 500 },
    );
  }
}
