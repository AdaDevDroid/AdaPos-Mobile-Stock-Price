import { NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

type SessionUser = {
  FTUsrCode: string | null;
  FTUsrLogin: string | null;
  FTAgnCode?: string | null;
};

export type AdaSessionPayload = JwtPayload & {
  FTUsrCode: string;
  FTUsrLogin: string;
  FTAgnCode?: string | null;
  FTDbPart: string;
};

const SESSION_TTL_SECONDS = 24 * 60 * 60;

const C_GETtSessionSecret = () => {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }

  return process.env.PASSWORD_DB || "AdaPos-Mobile-Stock-Price-Session";
};

export const C_GETtRequestDatabasePart = (request: Request): string => {
  const selectedPath = request.headers.get("x-ada-db-part") || request.headers.get("x-forwarded-prefix") || "";
  return selectedPath.replace(/^\/+/, "").split("/").filter(Boolean)[0] || "";
};

export const C_GETtSessionToken = (user: SessionUser, databasePart: string) => {
  return jwt.sign(
    {
      FTUsrCode: user.FTUsrCode || "",
      FTUsrLogin: user.FTUsrLogin || "",
      FTAgnCode: user.FTAgnCode || null,
      FTDbPart: databasePart,
    },
    C_GETtSessionSecret(),
    { expiresIn: SESSION_TTL_SECONDS }
  );
};

export const C_GEToSessionPayload = (request: Request): AdaSessionPayload | null => {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, C_GETtSessionSecret());
    if (typeof payload === "string") {
      return null;
    }

    const session = payload as AdaSessionPayload;
    if (
      !session.FTUsrCode ||
      !session.FTUsrLogin ||
      typeof session.FTDbPart !== "string" ||
      session.FTDbPart !== C_GETtRequestDatabasePart(request)
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
};

export const C_GEToUnauthorizedResponse = () => {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
};

export const C_GEToRequiredSession = (request: Request) => {
  const session = C_GEToSessionPayload(request);
  return {
    session,
    response: session ? null : C_GEToUnauthorizedResponse(),
  };
};
