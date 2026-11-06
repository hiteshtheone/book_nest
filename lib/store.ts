import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { execute, query, sqlBool, transaction, type Row, type Tx } from "./db";
import { sameName } from "./names";
import type { Kind } from "./scoring";

export type User = {
  id: string;
  name: string;
  age: number | null;
  role: "reader" | "organizer";
  pairId: string | null;
  createdAt: string;
};

export type UserWithPassword = User & { passwordHash: string };

export type Pair = {
  id: string;
  createdBy: string;
  pendingPartnerName: string | null;
  createdAt: string;
};

export type Entry = {
  id: string;
  pairId: string;
  authorId: string;
  readerName: string;
  kind: Kind;
  title: string;
  body: string;
  borrowed: boolean;
  createdAt: string;
};

export type Adjustment = {
  id: string;
  pairId: string;
  points: number;
  note: string;
  createdBy: string | null;
  createdAt: string;
};

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapUser(row: Row, withPassword: boolean): UserWithPassword {
  const user: UserWithPassword = {
    id: String(row.id),
    name: String(row.name),
    age: row.age === null || row.age === undefined ? null : Number(row.age),
    role: row.role === "organizer" ? "organizer" : "reader",
    pairId: row.pair_id ? String(row.pair_id) : null,
    createdAt: iso(row.created_at),
    passwordHash: withPassword ? String(row.password_hash) : "",
  };
  return user;
}

function mapPair(row: Row): Pair {
  return {
    id: String(row.id),
    createdBy: String(row.created_by),
    pendingPartnerName: row.pending_partner_name ? String(row.pending_partner_name) : null,
    createdAt: iso(row.created_at),
  };
}

function mapEntry(row: Row): Entry {
  return {
    id: String(row.id),
    pairId: String(row.pair_id),
    authorId: String(row.author_id),
    readerName: String(row.reader_name),
    kind: String(row.kind) as Kind,
    title: String(row.title),
    body: String(row.body ?? ""),
    borrowed: Boolean(row.borrowed_from_jbn),
    createdAt: iso(row.created_at),
  };
}

function mapAdjustment(row: Row): Adjustment {
  return {
    id: String(row.id),
    pairId: String(row.pair_id),
    points: Number(row.points),
    note: String(row.note),
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: iso(row.created_at),
  };
}

export async function getUserByName(name: string): Promise<UserWithPassword | null> {
  const rows = await query(`select * from users where lower(name) = lower(?)`, [name]);
  return rows[0] ? mapUser(rows[0], true) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const rows = await query(`select * from users where id = ?`, [id]);
  if (!rows[0]) return null;
  const user = mapUser(rows[0], false);
  return user;
}

export async function listUsers(): Promise<User[]> {
  const rows = await query(`select * from users order by created_at asc, name asc`);
  return rows.map((row) => mapUser(row, false));
}

export async function listPairs(): Promise<Pair[]> {
  const rows = await query(`select * from pairs order by created_at asc`);
  return rows.map(mapPair);
}

export async function getPair(id: string): Promise<Pair | null> {
  const rows = await query(`select * from pairs where id = ?`, [id]);
  return rows[0] ? mapPair(rows[0]) : null;
}

export async function listEntries(): Promise<Entry[]> {
  const rows = await query(`select * from entries order by created_at asc, id asc`);
  return rows.map(mapEntry);
}

export async function getEntry(id: string): Promise<Entry | null> {
  const rows = await query(`select * from entries where id = ?`, [id]);
  return rows[0] ? mapEntry(rows[0]) : null;
}

export async function listAdjustments(): Promise<Adjustment[]> {
  const rows = await query(`select * from adjustments order by created_at asc, id asc`);
  return rows.map(mapAdjustment);
}

export async function findPairWaitingFor(name: string): Promise<Pair | null> {
  const rows = await query(
    `select * from pairs where pending_partner_name is not null and lower(pending_partner_name) = lower(?) order by created_at asc`,
    [name],
  );
  return rows[0] ? mapPair(rows[0]) : null;
}

async function insertUser(
  tx: Tx,
  input: { name: string; passwordHash: string; age: number | null; role: "reader" | "organizer" },
): Promise<User> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await tx.run(
    `insert into users (id, name, password_hash, age, role, pair_id, created_at) values (?, ?, ?, ?, ?, null, ?)`,
    [id, input.name, input.passwordHash, input.age, input.role, createdAt],
  );
  return {
    id,
    name: input.name,
    age: input.age,
    role: input.role,
    pairId: null,
    createdAt,
  };
}

export async function registerAndCreatePair(input: {
  name: string;
  password: string;
  age: number;
  partnerName: string;
}): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return transaction(async (tx) => {
    const taken = await tx.all(`select id from users where lower(name) = lower(?)`, [input.name]);
    if (taken.length > 0) throw new Error("NAME_TAKEN");
    const partner = await tx.all(`select id, pair_id from users where lower(name) = lower(?)`, [input.partnerName]);
    if (partner[0]?.pair_id) throw new Error("PARTNER_IN_PAIR");
    const waiting = await tx.all(
      `select id from pairs where pending_partner_name is not null and lower(pending_partner_name) = lower(?)`,
      [input.partnerName],
    );
    if (waiting.length > 0) throw new Error("PARTNER_ALREADY_INVITED");
    const user = await insertUser(tx, {
      name: input.name,
      passwordHash,
      age: input.age,
      role: "reader",
    });
    const pairId = randomUUID();
    await tx.run(
      `insert into pairs (id, created_by, pending_partner_name, created_at) values (?, ?, ?, ?)`,
      [pairId, user.id, input.partnerName, user.createdAt],
    );
    await tx.run(`update users set pair_id = ? where id = ?`, [pairId, user.id]);
    return { ...user, pairId };
  });
}

export async function registerAndJoinPair(input: {
  name: string;
  password: string;
  age: number;
}): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return transaction(async (tx) => {
    const taken = await tx.all(`select id from users where lower(name) = lower(?)`, [input.name]);
    if (taken.length > 0) throw new Error("NAME_TAKEN");
    const waiting = await tx.all(
      `select * from pairs where pending_partner_name is not null and lower(pending_partner_name) = lower(?) order by created_at asc`,
      [input.name],
    );
    if (!waiting[0]) throw new Error("NO_INVITE");
    const pair = mapPair(waiting[0]);
    const user = await insertUser(tx, {
      name: input.name,
      passwordHash,
      age: input.age,
      role: "reader",
    });
    await tx.run(`update users set pair_id = ? where id = ?`, [pair.id, user.id]);
    await tx.run(`update pairs set pending_partner_name = null where id = ?`, [pair.id]);
    return { ...user, pairId: pair.id };
  });
}

export async function claimInviteOnSignIn(user: User): Promise<User> {
  if (user.pairId) return user;
  return transaction(async (tx) => {
    const waiting = await tx.all(
      `select * from pairs where pending_partner_name is not null and lower(pending_partner_name) = lower(?) and created_by <> ? order by created_at asc`,
      [user.name, user.id],
    );
    if (!waiting[0]) return user;
    const pair = mapPair(waiting[0]);
    await tx.run(`update users set pair_id = ? where id = ? and pair_id is null`, [pair.id, user.id]);
    await tx.run(`update pairs set pending_partner_name = null where id = ?`, [pair.id]);
    return { ...user, pairId: pair.id };
  });
}

export async function insertEntry(input: {
  pairId: string;
  authorId: string;
  readerName: string;
  kind: Kind;
  title: string;
  body: string;
  borrowed: boolean;
  createdAt: string;
}): Promise<void> {
  await execute(
    `insert into entries
      (id, pair_id, author_id, reader_name, kind, title, body, borrowed_from_jbn, created_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      input.pairId,
      input.authorId,
      input.readerName,
      input.kind,
      input.title,
      input.body,
      sqlBool(input.borrowed),
      input.createdAt,
    ],
  );
}

export async function deleteEntry(id: string): Promise<void> {
  await execute(`delete from entries where id = ?`, [id]);
}

export async function insertAdjustment(input: {
  pairId: string;
  points: number;
  note: string;
  createdBy: string;
  createdAt: string;
}): Promise<void> {
  await execute(
    `insert into adjustments (id, pair_id, points, note, created_by, created_at) values (?, ?, ?, ?, ?, ?)`,
    [randomUUID(), input.pairId, input.points, input.note, input.createdBy, input.createdAt],
  );
}

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string): Promise<string> {
  const id = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_MS).toISOString();
  await execute(`insert into sessions (id, user_id, expires_at) values (?, ?, ?)`, [id, userId, expires]);
  return id;
}

export async function deleteSession(id: string): Promise<void> {
  await execute(`delete from sessions where id = ?`, [id]);
}

export async function userForSession(sessionId: string): Promise<User | null> {
  const rows = await query(
    `select users.*, sessions.expires_at as session_expires
     from sessions join users on users.id = sessions.user_id
     where sessions.id = ?`,
    [sessionId],
  );
  const row = rows[0];
  if (!row) return null;
  if (new Date(iso(row.session_expires)).getTime() < Date.now()) {
    await deleteSession(sessionId);
    return null;
  }
  return mapUser(row, false);
}

export function membersOf(users: User[], pairId: string): User[] {
  return users
    .filter((user) => user.pairId === pairId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name));
}

export function readerMatchesMember(members: User[], who: string): User | undefined {
  return members.find((member) => sameName(member.name, who));
}
