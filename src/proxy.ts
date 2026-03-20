import { NextRequest, NextResponse } from "next/server";
import { decrypt, encrypt } from "@/lib/session-core";

export async function proxy(request: NextRequest) {
    const sessionToken = request.cookies.get("session")?.value;

  let session = null;
    let shouldClearSession = false;
    let shouldExtendSession = false;

  if (sessionToken) {
        session = await decrypt(sessionToken);

      if (session) {
              if (session.expires && new Date() > new Date(session.expires as Date)) {
                        session = null;
                        shouldClearSession = true;
              } else {
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

  if (!session && pathname.startsWith("/dashboard")) {
        response = NextResponse.redirect(new URL("/login", request.url));
  }
    else if (session && pathname === "/login") {
          response = NextResponse.redirect(new URL("/dashboard", request.url));
    }
    else if (session && session.user.mustChange) {
          if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/settings/password") {
                  response = NextResponse.redirect(new URL("/dashboard/settings/password", request.url));
          }
    }
    else if (session && pathname.startsWith("/dashboard")) {
          const { canAccessPath } = await import("@/lib/permissions");
          if (!canAccessPath(session.user.rol, pathname)) {
                  response = NextResponse.redirect(new URL("/dashboard", request.url));
          }
    }

  if (shouldClearSession) {
        response.cookies.set("session", "", { expires: new Date(0) });
  } else if (shouldExtendSession && session) {
        response.cookies.set({
                name: "session",
                value: await encrypt(session),
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax"
        });
  }

  return response;
}

export const config = {
    matcher: ["/dashboard", "/dashboard/:path*", "/login"],
};
