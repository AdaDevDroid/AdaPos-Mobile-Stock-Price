import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
      version: process.env.NEXT_PUBLIC_VERSION || '1.0.9',
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || process.env.NEXT_PUBLIC_VERSION || '1.0.9',
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/AdaCheckStockSTD',
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

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
