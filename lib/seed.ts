import bcrypt from "bcryptjs";
import {
  SAMPLE_ORGANIZER_NAME,
  SAMPLE_ORGANIZER_PASSWORD,
  SAMPLE_READER_PASSWORD,
  adminConfigured,
  adminName,
  adminPassword,
  databaseUrl,
} from "./config";
import type { Tx } from "./db";

function sqlBool(value: boolean): boolean | number {
  return databaseUrl() ? value : value ? 1 : 0;
}

type SeedUser = {
  id: string;
  name: string;
  age: number | null;
  role: "reader" | "organizer";
  createdAt: string;
};

const readers: SeedUser[] = [
  { id: "11111111-1111-4111-8111-111111111001", name: "Ava", age: 36, role: "reader", createdAt: "2026-11-01T10:00:00.000Z" },
  { id: "11111111-1111-4111-8111-111111111002", name: "Leo", age: 14, role: "reader", createdAt: "2026-11-01T10:05:00.000Z" },
  { id: "11111111-1111-4111-8111-111111111003", name: "Mira", age: 33, role: "reader", createdAt: "2026-11-01T10:10:00.000Z" },
  { id: "11111111-1111-4111-8111-111111111004", name: "Ned", age: 12, role: "reader", createdAt: "2026-11-01T10:15:00.000Z" },
  { id: "11111111-1111-4111-8111-111111111005", name: "Nia", age: 35, role: "reader", createdAt: "2026-11-01T10:20:00.000Z" },
  { id: "11111111-1111-4111-8111-111111111006", name: "Otto", age: 12, role: "reader", createdAt: "2026-11-01T10:25:00.000Z" },
];

const sampleOrganizer: SeedUser = {
  id: "11111111-1111-4111-8111-111111111000",
  name: SAMPLE_ORGANIZER_NAME,
  age: null,
  role: "organizer",
  createdAt: "2026-11-01T09:00:00.000Z",
};

async function insertUser(tx: Tx, user: SeedUser, passwordHash: string) {
  await tx.run(
    `insert into users (id, name, password_hash, age, role, pair_id, created_at)
     values (?, ?, ?, ?, ?, null, ?)`,
    [user.id, user.name, passwordHash, user.age, user.role, user.createdAt],
  );
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
  const counts = await tx.all(`select count(*) as n from users`);
  if (Number(counts[0]?.n ?? 0) > 0) {
    await ensureAdmin(tx);
    return;
  }

  const readerHash = await bcrypt.hash(SAMPLE_READER_PASSWORD, 10);
  const organizerHash = await bcrypt.hash(SAMPLE_ORGANIZER_PASSWORD, 10);

  if (!adminConfigured()) {
    await insertUser(tx, sampleOrganizer, organizerHash);
  }
  for (const reader of readers) {
    await insertUser(tx, reader, readerHash);
  }

  const pairs = [
    {
      id: "22222222-2222-4222-8222-222222222001",
      createdBy: readers[0].id,
      members: [readers[0].id, readers[1].id],
      createdAt: "2026-11-01T16:00:00.000Z",
    },
    {
      id: "22222222-2222-4222-8222-222222222002",
      createdBy: readers[2].id,
      members: [readers[2].id, readers[3].id],
      createdAt: "2026-11-01T16:10:00.000Z",
    },
    {
      id: "22222222-2222-4222-8222-222222222003",
      createdBy: readers[4].id,
      members: [readers[4].id, readers[5].id],
      createdAt: "2026-11-01T16:20:00.000Z",
    },
  ];

  for (const pair of pairs) {
    await tx.run(
      `insert into pairs (id, created_by, pending_partner_name, created_at) values (?, ?, null, ?)`,
      [pair.id, pair.createdBy, pair.createdAt],
    );
    for (const memberId of pair.members) {
      await tx.run(`update users set pair_id = ? where id = ?`, [pair.id, memberId]);
    }
  }

  const avaLeo = pairs[0].id;
  const miraNed = pairs[1].id;
  const niaOtto = pairs[2].id;
  const ava = readers[0];
  const leo = readers[1];
  const ned = readers[3];
  const otto = readers[5];

  const entries: Array<{
    id: string;
    pairId: string;
    authorId: string;
    readerName: string;
    kind: string;
    title: string;
    body: string;
    borrowed: boolean;
    createdAt: string;
  }> = [
    {
      id: "33333333-3333-4333-8333-333333333001",
      pairId: avaLeo,
      authorId: ava.id,
      readerName: ava.name,
      kind: "kickoff",
      title: "A Wizard of Earthsea and The Hobbit",
      body: "We are starting with a wizard and a hobbit. One chapter after dinner, and we will keep going through December.",
      borrowed: false,
      createdAt: "2026-11-02T18:00:00.000Z",
    },
    {
      id: "33333333-3333-4333-8333-333333333002",
      pairId: avaLeo,
      authorId: leo.id,
      readerName: leo.name,
      kind: "currently_reading",
      title: "A Wizard of Earthsea",
      body: "",
      borrowed: false,
      createdAt: "2026-11-06T05:09:00.000Z",
    },
    {
      id: "33333333-3333-4333-8333-333333333003",
      pairId: avaLeo,
      authorId: leo.id,
      readerName: leo.name,
      kind: "finished",
      title: "The Hobbit!",
      body: "A forest, a wizard, and a very reluctant hobbit.\nWe read the library copy aloud after dinner.\nIt is the one we will remember from this November.",
      borrowed: true,
      createdAt: "2026-11-06T05:09:20.000Z",
    },
    {
      id: "33333333-3333-4333-8333-333333333004",
      pairId: avaLeo,
      authorId: ava.id,
      readerName: ava.name,
      kind: "finished",
      title: "the hobbit",
      body: "Same story, Ava's copy.\nStill one book for the pair.",
      borrowed: false,
      createdAt: "2026-11-06T05:09:40.000Z",
    },
    {
      id: "33333333-3333-4333-8333-333333333005",
      pairId: miraNed,
      authorId: ned.id,
      readerName: ned.name,
      kind: "finished",
      title: "Pippi Longstocking",
      body: "Pippi lives exactly as she likes.\nNed borrowed this one from Jade Book Nest.\nWe laughed at the pancakes and the horse.",
      borrowed: true,
      createdAt: "2026-11-06T05:10:00.000Z",
    },
    {
      id: "33333333-3333-4333-8333-333333333006",
      pairId: niaOtto,
      authorId: otto.id,
      readerName: otto.name,
      kind: "finished",
      title: "Pippi Longstocking",
      body: "Pippi lives exactly as she likes.\nOtto borrowed this one from Jade Book Nest.\nWe laughed at the pancakes and the horse.",
      borrowed: true,
      createdAt: "2026-11-06T05:11:00.000Z",
    },
  ];

  for (const entry of entries) {
    await tx.run(
      `insert into entries
        (id, pair_id, author_id, reader_name, kind, title, body, borrowed_from_jbn, created_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.pairId,
        entry.authorId,
        entry.readerName,
        entry.kind,
        entry.title,
        entry.body,
        sqlBool(entry.borrowed),
        entry.createdAt,
      ],
    );
  }

  const organizerId = adminConfigured() ? null : sampleOrganizer.id;
  await tx.run(
    `insert into adjustments (id, pair_id, points, note, created_by, created_at)
     values (?, ?, ?, ?, ?, ?)`,
    [
      "44444444-4444-4444-8444-444444444001",
      avaLeo,
      1,
      "Welcome bonus",
      organizerId,
      "2026-11-06T05:08:00.000Z",
    ],
  );

  await ensureAdmin(tx);
}
