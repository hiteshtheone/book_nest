export function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  return url ? url : undefined;
}

export function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

export const MISSING_DATABASE_MESSAGE =
  "This app has no database yet. Set DATABASE_URL to your Supabase Postgres connection string. Locally, put it in .env.local. On Vercel, set it in the project environment variables.";

export function databaseConfigError(): string | null {
  if (databaseUrl()) return null;
  if (!isVercel() && explicitSqlitePath()) return null;
  return MISSING_DATABASE_MESSAGE;
}

export function isFileDatabase(): boolean {
  return !databaseUrl() && !isVercel() && Boolean(explicitSqlitePath());
}

function explicitSqlitePath(): string | undefined {
  const file = process.env.BOOKNEST_SQLITE_PATH?.trim();
  return file ? file : undefined;
}

export function adminName(): string {
  return process.env.ADMIN_NAME?.trim() ?? "";
}

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function adminConfigured(): boolean {
  return adminName().length > 0 && adminPassword().length > 0;
}

export function sqlitePath(): string {
  const file = process.env.BOOKNEST_SQLITE_PATH?.trim();
  if (!file) throw new Error(MISSING_DATABASE_MESSAGE);
  return file;
}

export function databaseHost(url = databaseUrl()): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function directSupabaseRef(hostname: string | null): string | null {
  if (!hostname) return null;
  const match = /^db\.([a-z0-9]+)\.supabase\.co$/i.exec(hostname);
  return match?.[1] ?? null;
}

export function directHostUnreachableMessage(ref: string): string {
  return `The database host db.${ref}.supabase.co is IPv6-only, so this network reports getaddrinfo ENOTFOUND. In Supabase, click Connect, choose Session pooler, and put that URI in DATABASE_URL. Locally it goes in .env.local. Use the same Session pooler string on Vercel. The username is postgres.${ref} and the host ends in pooler.supabase.com.`;
}
