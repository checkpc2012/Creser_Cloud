import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    const start = Date.now();

    try {
        // Basic connectivity check: query the database for a simple count or raw query
        await prisma.$queryRaw`SELECT 1`;

        const duration = Date.now() - start;

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            db: 'connected',
            latency: `${duration}ms`,
            version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
        }, { status: 200 });

    } catch (error) {
        console.error('Health Check Failed:', error);

        return NextResponse.json({
            status: 'error',
            timestamp: new Date().toISOString(),
            db: 'disconnected',
            error: 'Database connection failed'
        }, { status: 503 });
    }
}
