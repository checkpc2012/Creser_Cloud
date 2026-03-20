# DEMO_NUBE - Baseline V1.0.0

**Date**: 2026-03-19
**Project**: DEMO_NUBE (Creser Cloud)
**Status**: Official Baseline / V1.0.0

## Purpose
This baseline represents the first fully validated stable state of the DEMO_NUBE project, including real authentication, PostgreSQL/Neon integration, and Vercel cloud readiness.

## Included Scope
- **Framework**: Next.js 16.1.6 (Turbopack).
- **Database**: PostgreSQL (Neon) with Prisma ORM.
- **Authentication**: 
  - Standard Bcrypt-based auth.
  - Mandatory password change on first login.
  - Route protection via `src/proxy.ts` (Next.js 16 Middleware).
- **Users**: 11 real users imported from LOCAL (Fernando Rebollo, etc.).
- **Organizational Structure**: Castillos, Rocha, Lascano, and La Coronilla branches synced.
- **Security**: All auth bypasses and hardcoded credentials removed.
- **UX Fixes**: 
  - Login form resets on failure.
  - Logout ensures clean state.

## Resource Constraints
- **Database**: Under 300MB strategy for Neon free tier.
- **Vercel**: Hobby tier compatible.

## Safe Rollback Point
A full snapshot of this state is stored in `_backups/V1.0.0/`.
Future iterations must preserve the stability and security verified in this version.
