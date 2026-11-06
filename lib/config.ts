export const SAMPLE_ORGANIZER_NAME = "organizer";
export const SAMPLE_ORGANIZER_PASSWORD = "1z835v003e1f";
export const SAMPLE_READER_PASSWORD = "readtogether";

export function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  return url ? url : undefined;
}

export function isFileDatabase(): boolean {
  return !databaseUrl();
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
