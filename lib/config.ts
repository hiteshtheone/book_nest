export function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  return url ? url : undefined;
}

export function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

export const VERCEL_DATABASE_MESSAGE =
  "This deployment has no database yet. In the Vercel project settings, set DATABASE_URL to your Supabase Postgres connection string. The file database is only for local development.";

export function databaseConfigError(): string | null {
  if (isVercel() && !databaseUrl()) return VERCEL_DATABASE_MESSAGE;
  return null;
}

export function isFileDatabase(): boolean {
  return !databaseUrl() && !isVercel();
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
  return process.env.BOOKNEST_SQLITE_PATH?.trim() || "data/booknest.sqlite";
}
