import fs from "fs";
import path from "path";
import { databaseConfigError, databaseUrl, sqlitePath } from "./config";
import { seedIfEmpty } from "./seed";

export type Row = Record<string, unknown>;

export type Tx = {
  all(sql: string, params?: unknown[]): Promise<Row[]>;
  run(sql: string, params?: unknown[]): Promise<void>;
  exec(sql: string): Promise<void>;
};

type Driver = Tx & { file: boolean };

const SQLITE_SCHEMA = `
create table if not exists users (
  id text primary key,
  name text not null,
  password_hash text not null,
  age integer,
  role text not null default 'reader',
  pair_id text,
  created_at text not null
);
create table if not exists pairs (
  id text primary key,
  created_by text not null,
  pending_partner_name text,
  created_at text not null
);
create table if not exists entries (
  id text primary key,
  pair_id text not null,
  author_id text not null,
  reader_name text not null,
  kind text not null,
  title text not null,
  body text not null default '',
  borrowed_from_jbn integer not null default 0,
  created_at text not null
);
create table if not exists adjustments (
  id text primary key,
  pair_id text not null,
  points integer not null,
  note text not null,
  created_by text,
  created_at text not null
);
create table if not exists sessions (
  id text primary key,
  user_id text not null,
  expires_at text not null
);
create unique index if not exists users_name_lower_idx on users (lower(name));
create index if not exists entries_pair_created_idx on entries (pair_id, created_at);
create index if not exists adjustments_pair_idx on adjustments (pair_id, created_at);
create index if not exists sessions_user_idx on sessions (user_id);
`;

const globalDb = globalThis as unknown as { __booknest?: Promise<Driver> };

function plain(row: unknown): Row {
  return { ...(row as Row) };
}

function toPg(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

export function splitSql(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let dollar = false;
  for (let i = 0; i < sql.length; i += 1) {
    if (sql.startsWith("$$", i)) {
      dollar = !dollar;
      current += "$$";
      i += 1;
      continue;
    }
    if (!dollar && sql[i] === ";") {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      continue;
    }
    current += sql[i];
  }
  const statement = current.trim();
  if (statement) statements.push(statement);
  return statements;
}

async function openSqlite(): Promise<Driver> {
  const problem = databaseConfigError();
  if (problem) throw new Error(problem);
  const file = path.resolve(process.cwd(), sqlitePath());
  if (file.startsWith("/var/task")) {
    throw new Error(
      "Refusing to create a file database under /var/task. Set DATABASE_URL to your Supabase Postgres connection string.",
    );
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(file);
  db.exec("pragma journal_mode = WAL;");
  db.exec("pragma foreign_keys = ON;");
  return {
    file: true,
    async exec(sql: string) {
      db.exec(sql);
    },
    async all(sql: string, params: unknown[] = []) {
      const bound = params as (string | number | null)[];
      return db
        .prepare(sql)
        .all(...bound)
        .map(plain);
    },
    async run(sql: string, params: unknown[] = []) {
      const bound = params as (string | number | null)[];
      db.prepare(sql).run(...bound);
    },
  };
}

async function openPostgres(): Promise<Driver> {
  const { Pool } = await import("pg");
  const url = databaseUrl()!;
  const local = /localhost|127\.0\.0\.1/.test(url);
  const pool = new Pool({
    connectionString: url,
    ssl: local ? undefined : { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  return {
    file: false,
    async exec(sql: string) {
      await client.query(sql);
    },
    async all(sql: string, params: unknown[] = []) {
      const result = await client.query(toPg(sql), params);
      return result.rows.map(plain);
    },
    async run(sql: string, params: unknown[] = []) {
      await client.query(toPg(sql), params);
    },
  };
}

async function ensureSchema(driver: Driver) {
  if (driver.file) {
    await driver.exec(SQLITE_SCHEMA);
    return;
  }
  const file = path.join(process.cwd(), "supabase/migrations/0001_init.sql");
  const sql = fs.readFileSync(file, "utf8");
  for (const statement of splitSql(sql)) {
    await driver.exec(statement);
  }
}

async function openAndSeed(): Promise<Driver> {
  const problem = databaseConfigError();
  if (problem) throw new Error(problem);
  const driver = databaseUrl() ? await openPostgres() : await openSqlite();
  await driver.exec("BEGIN");
  try {
    await ensureSchema(driver);
    await seedIfEmpty(driver);
    await driver.exec("COMMIT");
    return driver;
  } catch (error) {
    try {
      await driver.exec("ROLLBACK");
    } catch {
      // The original error is the one to surface.
    }
    throw error;
  }
}

function driver(): Promise<Driver> {
  if (!globalDb.__booknest) {
    globalDb.__booknest = openAndSeed().catch((error) => {
      globalDb.__booknest = undefined;
      throw error;
    });
  }
  return globalDb.__booknest;
}

let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function sqlBool(value: boolean): boolean | number {
  return databaseUrl() ? value : value ? 1 : 0;
}

export function query(sql: string, params: unknown[] = []): Promise<Row[]> {
  return enqueue(async () => {
    const tx = await driver();
    return tx.all(sql, params);
  });
}

export function execute(sql: string, params: unknown[] = []): Promise<void> {
  return enqueue(async () => {
    const tx = await driver();
    await tx.run(sql, params);
  });
}

export function transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return enqueue(async () => {
    const tx = await driver();
    await tx.exec("BEGIN");
    try {
      const result = await fn(tx);
      await tx.exec("COMMIT");
      return result;
    } catch (error) {
      try {
        await tx.exec("ROLLBACK");
      } catch {
        // Keep the original failure.
      }
      throw error;
    }
  });
}
