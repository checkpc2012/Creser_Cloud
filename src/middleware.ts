import { NextRequest, NextResponse } from "next/server";
import { decrypt, encrypt } from "@/lib/session-core";

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("session")?.value;
  let session = null;
  let shouldClearSession = false;
  let shouldExtendSession = false;

  if (sessionToken) {
    session = await decrypt(sessionToken);
    
    if (session) {
      // 1. Check absolute expiration
      if (session.expires && new Date() > new Date(session.expires as Date)) {
        session = null;
        shouldClearSession = true;
      } else {
        // 2. Check inactivity timeout (15 minutes)
        const now = Date.now();
        const lastActivity = Number(session.lastActivity || 0);
        const INACTIVITY_LIMIT = 15 * 60 * 1000;
        
        if (now - lastActivity > INACTIVITY_LIMIT) {
          session = null;
          shouldClearSession = true;
        } else {
          session.lastActivity = now;
          shouldExtendSession = true;
        }
      }
    }
  }

  const { pathname } = request.nextUrl;
  let response = NextResponse.next();

  // 1. Si no hay sesión y trata de acceder al dashboard -> al login
  if (!session && pathname.startsWith("/dashboard")) {
    response = NextResponse.redirect(new URL("/login", request.url));
  }
  // 2. Si hay sesión y trata de ir al login -> al dashboard
  else if (session && pathname === "/login") {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  }
  // 3. Forzar cambio de contraseña si mustChange es true
  else if (session && session.user.mustChange) {
    if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/settings/password") {
      response = NextResponse.redirect(new URL("/dashboard/settings/password", request.url));
    }
  }
  // 4. RBAC - Proteccción de rutas por rol
  else if (session && pathname.startsWith("/dashboard")) {
    const { canAccessPath } = await import("@/lib/permissions");
    if (!canAccessPath(session.user.rol, pathname)) {
      response = NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Handle session cookies
  if (shouldClearSession) {
    response.cookies.set("session", "", { expires: new Date(0) });
  } else if (shouldExtendSession && session) {
    response.cookies.set({
      name: "session",
      value: await encrypt(session),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
      // Session-only, no expires
    });
  }

  return response;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login"],
};

