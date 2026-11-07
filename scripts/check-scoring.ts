import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { normalizeTitle, scoreEntry, type ScoreInput } from "../lib/scoring.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const hobbit: ScoreInput = {
  id: "leo",
  kind: "finished",
  title: "The Hobbit!",
  borrowed: true,
  createdAt: "2026-11-06T05:09:20.000Z",
};
const later: ScoreInput = {
  id: "ava",
  kind: "finished",
  title: "the hobbit",
  borrowed: false,
  createdAt: "2026-11-06T05:09:40.000Z",
};
const outside: ScoreInput = {
  id: "early",
  kind: "finished",
  title: "The Hobbit",
  borrowed: true,
  createdAt: "2026-10-31T23:00:00.000Z",
};
const kick: ScoreInput = {
  id: "kick",
  kind: "kickoff",
  title: "Starting",
  borrowed: false,
  createdAt: "2026-11-02T18:00:00.000Z",
};
const best: ScoreInput = {
  id: "best",
  kind: "best",
  title: "Favourite",
  borrowed: false,
  createdAt: "2026-11-06T12:00:00.000Z",
};

const reading: ScoreInput = {
  id: "now",
  kind: "currently_reading",
  title: "Earthsea",
  borrowed: false,
  createdAt: "2026-11-06T05:00:00.000Z",
};
const libraryBook: ScoreInput = {
  id: "lib",
  kind: "finished",
  title: "Pippi Longstocking",
  borrowed: true,
  createdAt: "2026-11-06T06:00:00.000Z",
};
const ownCopy: ScoreInput = {
  id: "own",
  kind: "finished",
  title: "Charlotte's Web",
  borrowed: false,
  createdAt: "2026-11-06T07:00:00.000Z",
};

assert(normalizeTitle("The Hobbit!") === "the hobbit", "trailing punctuation");
assert(scoreEntry(reading, [reading, libraryBook, ownCopy]).points === 2, "first entry scores 2");
assert(scoreEntry(libraryBook, [reading, libraryBook, ownCopy]).points === 2, "later library book scores 2");
assert(scoreEntry(libraryBook, [reading, libraryBook, ownCopy]).showJbn, "library badge");
assert(scoreEntry(ownCopy, [reading, libraryBook, ownCopy]).points === 1, "later own copy scores 1");
assert(!scoreEntry(ownCopy, [reading, libraryBook, ownCopy]).showJbn, "own copy has no library badge");
assert(scoreEntry(hobbit, [hobbit, later]).points === 2, "earliest finished title scores");
assert(scoreEntry(hobbit, [hobbit, later]).showJbn, "jbn badge");
assert(scoreEntry(later, [hobbit, later]).points === 0, "duplicate scores 0");
assert(scoreEntry(later, [hobbit, later]).notCounted, "duplicate labeled");
assert(scoreEntry(later, [outside, later]).points === 1, "outside window does not consume the title");
const earlier = { ...reading, id: "earlier", createdAt: "2026-11-01T12:00:00.000Z" };
assert(scoreEntry(kick, [earlier, kick]).points === 2, "later kick-off in window");
assert(scoreEntry(best, [earlier, best]).points === 0, "later best book outside its window");
assert(scoreEntry(best, [earlier, best]).reason.includes("outside its date window"), "outside copy");
assert(scoreEntry(best, [best]).points === 2, "a lone first entry still scores 2");

process.env.VERCEL = "1";
delete process.env.DATABASE_URL;
const { databaseConfigError } = await import("../lib/config.ts");
assert(databaseConfigError()?.includes("DATABASE_URL"), "vercel without DATABASE_URL explains the missing variable");
const { query } = await import("../lib/db.ts");
let opened: unknown;
try {
  await query("select 1");
} catch (error) {
  opened = error;
}
assert(
  opened instanceof Error && opened.message.includes("DATABASE_URL") && !opened.message.includes("ENOENT"),
  "vercel does not mkdir a file database",
);
delete process.env.VERCEL;
assert(databaseConfigError() === null, "local file database stays available");

process.env.BOOKNEST_SQLITE_PATH = path.join(mkdtempSync(path.join(tmpdir(), "bn-")), "test.sqlite");
delete process.env.DATABASE_URL;
delete process.env.ADMIN_NAME;
delete process.env.ADMIN_PASSWORD;

const { loadBoard } = await import("../lib/board.ts");
const board = await loadBoard();
assert(board.pairs.length === 0, "no sample pairs");
assert(board.juniors.length === 0, "no sample juniors");
assert(board.readingNow.length === 0 && board.finished.length === 0, "no sample entries");
const text = JSON.stringify(board);
assert(!text.includes("Ava") && !text.includes("Otto") && !text.includes("readtogether"), "sample names gone");

const { readFileSync } = await import("fs");
const { splitSql } = await import("../lib/db.ts");
const migration = readFileSync(new URL("../supabase/migrations/0001_init.sql", import.meta.url), "utf8");
const statements = splitSql(migration);
const doblock = statements.find((statement) => statement.startsWith("do $$"));
assert(doblock?.includes("foreign key (pair_id) references pairs (id);"), "migration do-block stays intact");
assert(statements.some((statement) => statement.includes("create table if not exists users")), "users table");
assert(statements.filter((statement) => statement.includes("create table if not exists")).length === 5, "five tables");

console.log("scoring and seed ok");
