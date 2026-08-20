import { NextResponse } from 'next/server';
import { C_GETtRequestDatabasePart } from '../auth/session';
import {
  C_GEToDatabasePartResolution,
  C_GETtDefaultEnvPathPart,
} from '../database-settings/config';

const C_GEToPartResponse = (request: Request) => {
  const requestedPart = C_GETtRequestDatabasePart(request) || C_GETtDefaultEnvPathPart();
  const resolution = C_GEToDatabasePartResolution(requestedPart);

  if (resolution.status === "active") {
    return { requestedPart, resolution, response: null };
  }

  const status = resolution.status === "deleted" ? 410 : 404;
  return {
    requestedPart,
    resolution,
    response: NextResponse.json({
      status: "invalid-part",
      code: resolution.status === "deleted" ? "database-part-deleted" : "database-part-not-configured",
      part: requestedPart,
    }, { status }),
  };
};

export async function GET(request: Request) {
  try {
    const partResult = C_GEToPartResponse(request);
    if (partResult.response) return partResult.response;

    const currentTime = new Date().toISOString();
    
    // คำนวณเวลา restart ถัดไป
    const now = new Date();
    const nextRestart = new Date();
    nextRestart.setHours(1, 0, 0, 0);
    if (now >= nextRestart) {
      nextRestart.setDate(nextRestart.getDate() + 1);
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: currentTime,
      version: process.env.NEXT_PUBLIC_VERSION || 'unknown',
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || process.env.NEXT_PUBLIC_VERSION || 'unknown',
      basePath: `/${partResult.resolution.part}`,
      nextAutoRestart: nextRestart.toISOString(),
      timeUntilRestart: `${Math.floor((nextRestart.getTime() - now.getTime()) / (1000 * 60 * 60))}h ${Math.floor(((nextRestart.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m`
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function HEAD(request: Request) {
  const partResult = C_GEToPartResponse(request);
  return new NextResponse(null, { status: partResult.response?.status || 200 });
}
