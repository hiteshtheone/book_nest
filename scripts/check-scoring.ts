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

assert(normalizeTitle("The Hobbit!") === "the hobbit", "trailing punctuation");
assert(scoreEntry(hobbit, [hobbit, later]).points === 2, "first hobbit scores 2");
assert(scoreEntry(hobbit, [hobbit, later]).showJbn, "jbn badge");
assert(scoreEntry(later, [hobbit, later]).points === 0, "duplicate scores 0");
assert(scoreEntry(later, [hobbit, later]).notCounted, "duplicate labeled");
assert(scoreEntry(later, [outside, later]).points === 1, "outside window does not consume the title");
assert(scoreEntry(kick, [kick]).points === 2, "kick-off in window");
assert(scoreEntry(best, [best]).points === 0, "best book outside its window");
assert(scoreEntry(best, [best]).reason.includes("outside its date window"), "outside copy");

process.env.BOOKNEST_SQLITE_PATH = path.join(mkdtempSync(path.join(tmpdir(), "bn-")), "test.sqlite");
delete process.env.DATABASE_URL;
delete process.env.ADMIN_NAME;
delete process.env.ADMIN_PASSWORD;

const { loadBoard } = await import("../lib/board.ts");
const board = await loadBoard();
const ava = board.pairs.find((pair) => pair.label === "Ava & Leo");
const mira = board.pairs.find((pair) => pair.label === "Mira & Ned");
const nia = board.pairs.find((pair) => pair.label === "Nia & Otto");
assert(ava?.pointsLabel === "5 points (4 read, +1 adjusted)", `ava points ${ava?.pointsLabel}`);
assert(ava?.notes[0] === "+1 organizer adjustment: Welcome bonus", "welcome bonus");
assert(mira?.pointsLabel === "2 points", "mira");
assert(nia?.pointsLabel === "2 points", "nia");
assert(board.pairs.map((pair) => pair.label).join("|") === "Ava & Leo|Mira & Ned|Nia & Otto", "pair order");
assert(board.juniors.map((junior) => `${junior.name} ${junior.age} ${junior.points}`).join("|") === "Leo 14 2|Ned 12 2|Otto 12 2", "juniors");
assert(board.readingNow[0]?.title === "A Wizard of Earthsea", "earthsea");
assert(board.readingNow[0]?.readerName === "Leo", "read by Leo");
assert(board.finished[0]?.title === "Pippi Longstocking" && board.finished[0]?.readerName === "Otto", "newest review");
const duplicate = board.finished.find((entry) => entry.title === "the hobbit");
assert(duplicate?.score.notCounted && duplicate.score.reason === "This title already counted once for the pair.", "hobbit duplicate copy");

const { readFileSync } = await import("fs");
const { splitSql } = await import("../lib/db.ts");
const migration = readFileSync(new URL("../supabase/migrations/0001_init.sql", import.meta.url), "utf8");
const statements = splitSql(migration);
const doblock = statements.find((statement) => statement.startsWith("do $$"));
assert(doblock?.includes("foreign key (pair_id) references pairs (id);"), "migration do-block stays intact");
assert(statements.some((statement) => statement.includes("create table if not exists users")), "users table");
assert(statements.filter((statement) => statement.includes("create table if not exists")).length === 5, "five tables");

console.log("scoring and seed ok");
