import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "./prisma";
import { encrypt, decrypt } from "./session-core";

// JWT logic moved to session-core.ts

export async function login(user: any) {
  // Session-only cookie (no expires/maxAge in options)
  // Payload still has its own expiration as a safety measure
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h absolute limit

  const sessionId = crypto.randomUUID();
  const lastActivity = Date.now();

  const session = await encrypt({ user, sessionId, lastActivity, expires });
  (await cookies()).set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Omit 'expires' to make it a session cookie (terminates on browser close)
  });
}

export async function logout() {
  (await cookies()).set("session", "", { expires: new Date(0) });
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;

  const parsed = await decrypt(session);
  if (!parsed) return null;

  // 1. Check absolute expiration
  if (parsed.expires && new Date() > new Date(parsed.expires as Date)) {
    return null;
  }

  // 2. Check inactivity timeout (15 minutes)
  const now = Date.now();
  const lastActivity = Number(parsed.lastActivity || 0);
  const INACTIVITY_LIMIT = 15 * 60 * 1000;

  if (now - lastActivity > INACTIVITY_LIMIT) {
    return null; // Expired by inactivity
  }

  return parsed;
}

export async function updateSessionData(newData: any) {
  const session = (await cookies()).get("session")?.value;
  if (!session) return;

  const parsed = await decrypt(session);
  if (!parsed) return;

  const updatedPayload = { 
    ...parsed, 
    ...newData,
    lastActivity: Date.now() // Update activity on data update
  };

  const encrypted = await encrypt(updatedPayload);
  (await cookies()).set("session", encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  const parsed = await decrypt(session);
  if (!parsed) return;

  // Verify inactivity before extending
  const now = Date.now();
  const lastActivity = Number(parsed.lastActivity || 0);
  const INACTIVITY_LIMIT = 15 * 60 * 1000;

  if (now - lastActivity > INACTIVITY_LIMIT) {
    // Session expired, don't extend
    const res = NextResponse.next();
    res.cookies.set("session", "", { expires: new Date(0) });
    return res;
  }

  // Extend activity
  parsed.lastActivity = Date.now();

  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  return res;
}
