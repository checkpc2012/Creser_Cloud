# Creser Cloud Demo Deployment Guide (V1.1.0-demo)

This guide outlines the steps to deploy the Creser Cloud Demo to Vercel and Neon.

## 1. Prerequisites
- **GitHub Account**: To host the repository.
- **Vercel Account (Hobby)**: For application hosting.
- **Neon Console Account**: For the serverless PostgreSQL database.

## 2. Database Setup (Neon)
1.  Create a new project in Neon named `creser-cloud-demo`.
2.  In the Neon dashboard, get your **Pooled** and **Direct** connection strings.
    - **Pooled URL**: `postgresql://[user]:[pass]@[host]/neondb?sslmode=require&pgbouncer=true`
    - **Direct URL**: `postgresql://[user]:[pass]@[host]/neondb?sslmode=require` (Disable Connection Pooling in the URL builder).
3.  Ensure the following schemas exist (run in Neon SQL Editor):
    ```sql
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS domain;
    CREATE SCHEMA IF NOT EXISTS audit;
    CREATE SCHEMA IF NOT EXISTS staging;
    ```

## 3. GitHub Push
1.  Initialize git in `C:\Users\ferx0\OneDrive\Documentos\Creser_new\Cloud`.
2.  Commit all files (ensure `.env` is NOT committed).
3.  Push to a new private or public repository on GitHub.

## 4. Vercel Deployment
1.  Import the repository in Vercel.
2.  Configure Environment Variables:
    - `DATABASE_URL`: [Your Neon Pooled URL]
    - `DIRECT_URL`: [Your Neon Direct URL]
    - `JWT_SECRET`: [Generate a random long string]
    - `NEXT_PUBLIC_APP_URL`: [Your Vercel deployment URL]
    - `NEXT_PUBLIC_DEMO_MODE`: `true`
3.  **Override Build Command**: If needed, set it to `npx prisma generate && next build`.

## 5. Post-Deployment Seeding
Once the project is deployed and the database is initialized:
1.  Run the seeding script locally pointing to the Neon database (update your `.env` temporarily) OR use the `seed_pg.js` script via a manual trigger if implemented.

## 6. Access
- **Demo User**: `demouser`
- **Default Password**: (Check `prisma/seed_pg.js` for the dummy hash or update the script before pushing).
    - *Note: In a real demo, you should use a known password hash.*
