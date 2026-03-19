# 🚀 Creser Cloud Demo: Publish Checklist

Follow these exact steps to go from local to live in < 10 minutes.

## 1. Neon Database (Storage)
- [ ] **Create Project**: Go to [Neon Console](https://console.neon.tech/) and create a project named `creser-cloud`.
- [ ] **Copy URLs**: 
    - **Pooled**: `postgresql://[user]:[pass]@[host]-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&options=-c%20search_path%3Dauth,domain,audit,staging,public`
    - **Direct**: `postgresql://[user]:[pass]@[host].us-east-1.aws.neon.tech/neondb?sslmode=require`
- [ ] **Prepare Schemas**: Run this in Neon SQL Editor:
  ```sql
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE SCHEMA IF NOT EXISTS domain;
  CREATE SCHEMA IF NOT EXISTS audit;
  CREATE SCHEMA IF NOT EXISTS staging;
  ```

## 2. GitHub (Source Control)
Run these commands in `C:\Users\ferx0\OneDrive\Documentos\Creser_new\Cloud`:
```powershell
git init
git add .
git commit -m "feat: initial cloud demo fork V1.1.0-demo"
git branch -M main
# Replace NEW_REPO_URL with your GitHub repo (e.g. https://github.com/user/creser-demo.git)
git remote add origin NEW_REPO_URL
git push -u origin main
```

## 3. Vercel (Hosting)
- [ ] **Import Project**: Select the GitHub repository.
- [ ] **Configure Environment Variables** (Copy-Paste Names Exactly):
    - `DATABASE_URL`: [Your Neon Pooled URL]
    - `DIRECT_URL`: [Your Neon Direct URL]
    - `JWT_SECRET`: `creser-demo-secret-2026-$(date +%s)` (or any random string)
    - `NEXT_PUBLIC_APP_URL`: `https://[your-app-name].vercel.app`
    - `NEXT_PUBLIC_DEMO_MODE`: `true`
- [ ] **Deploy**: Click Deploy.

## 4. Final Database Initialization & Seeding
Once Vercel is configured and linked to Neon:
1.  **Deploy Schema**: In your local Cloud folder, update `.env` with the Neon URL and run:
    ```powershell
    npx prisma migrate deploy
    ```
2.  **Seed Data**: Run the robust seeding script:
    ```powershell
    node prisma/seed_pg.js
    ```

## 5. Success Verification
- [ ] **URL**: Open your Vercel URL.
- [ ] **Login**: Use `demouser` / `123456`.
- [ ] **Dashboard**: Verify the 15 sanitized clients appear.

---
**Ambiguity Zero Goal**: All paths, commands, and variables are verified against the V1.1.0-demo architecture.
