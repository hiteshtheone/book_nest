import bcrypt from "bcryptjs";
import { adminConfigured, adminName, adminPassword } from "./config";
import type { Tx } from "./db";

const SAMPLE_USER_IDS = [
  "11111111-1111-4111-8111-111111111000",
  "11111111-1111-4111-8111-111111111001",
  "11111111-1111-4111-8111-111111111002",
  "11111111-1111-4111-8111-111111111003",
  "11111111-1111-4111-8111-111111111004",
  "11111111-1111-4111-8111-111111111005",
  "11111111-1111-4111-8111-111111111006",
];

const SAMPLE_PAIR_IDS = [
  "22222222-2222-4222-8222-222222222001",
  "22222222-2222-4222-8222-222222222002",
  "22222222-2222-4222-8222-222222222003",
];

function marks(ids: string[]): string {
  return ids.map(() => "?").join(", ");
}

async function removeSampleData(tx: Tx) {
  const users = marks(SAMPLE_USER_IDS);
  const pairs = marks(SAMPLE_PAIR_IDS);
  await tx.run(
    `delete from entries where pair_id in (${pairs}) or author_id in (${users})`,
    [...SAMPLE_PAIR_IDS, ...SAMPLE_USER_IDS],
  );
  await tx.run(
    `delete from adjustments where pair_id in (${pairs}) or created_by in (${users})`,
    [...SAMPLE_PAIR_IDS, ...SAMPLE_USER_IDS],
  );
  await tx.run(`delete from sessions where user_id in (${users})`, SAMPLE_USER_IDS);
  await tx.run(`update users set pair_id = null where pair_id in (${pairs})`, SAMPLE_PAIR_IDS);
  await tx.run(
    `delete from pairs where id in (${pairs}) or created_by in (${users})`,
    [...SAMPLE_PAIR_IDS, ...SAMPLE_USER_IDS],
  );
  await tx.run(`delete from users where id in (${users})`, SAMPLE_USER_IDS);
}

async function ensureAdmin(tx: Tx) {
  if (!adminConfigured()) return;
  const name = adminName();
  const existing = await tx.all(`select id from users where lower(name) = lower(?)`, [name]);
  if (existing.length > 0) {
    await tx.run(`update users set role = 'organizer' where id = ?`, [existing[0].id]);
    return;
  }
  const hash = await bcrypt.hash(adminPassword(), 10);
  await tx.run(
    `insert into users (id, name, password_hash, age, role, pair_id, created_at)
     values (?, ?, ?, null, 'organizer', null, ?)`,
    [crypto.randomUUID(), name, hash, new Date().toISOString()],
  );
}

export async function seedIfEmpty(tx: Tx) {
  await removeSampleData(tx);
  await ensureAdmin(tx);
}
