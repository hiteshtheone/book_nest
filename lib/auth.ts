import { cookies, headers } from "next/headers";
import { databaseConfigError } from "./config";
import { createSession, deleteSession, userForSession, type User } from "./store";

const COOKIE = "bn_session";

export async function getCurrentUser(): Promise<User | null> {
  if (databaseConfigError()) return null;
  try {
    const jar = await cookies();
    const sessionId = jar.get(COOKIE)?.value;
    if (!sessionId) return null;
    return await userForSession(sessionId);
  } catch {
    return null;
  }
}

export async function startSession(userId: string): Promise<void> {
  const sessionId = await createSession(userId);
  const jar = await cookies();
  const proto = (await headers()).get("x-forwarded-proto")?.split(",")[0]?.trim();
  jar.set(COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: proto === "https",
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const sessionId = jar.get(COOKIE)?.value;
  if (sessionId) await deleteSession(sessionId);
  jar.delete(COOKIE);
}
