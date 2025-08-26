import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const currentTime = new Date().toISOString();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
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
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      uptimeSeconds: Math.floor(uptime),
      version: process.env.NEXT_PUBLIC_VERSION || '0.1.0',
      environment: process.env.NODE_ENV,
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/AdaCheckStockSTD',
      nextAutoRestart: nextRestart.toISOString(),
      timeUntilRestart: `${Math.floor((nextRestart.getTime() - now.getTime()) / (1000 * 60 * 60))}h ${Math.floor(((nextRestart.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m`,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version
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
