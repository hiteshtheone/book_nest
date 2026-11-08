"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { endSession, getCurrentUser, startSession } from "@/lib/auth";
import { databaseProblem } from "@/lib/db";
import { cleanName, sameName, validName, validPassword } from "@/lib/names";
import { isKind } from "@/lib/scoring";
import {
  claimInviteOnSignIn,
  deleteEntry,
  getEntry,
  getPair,
  getUserByName,
  insertAdjustment,
  insertEntry,
  membersOf,
  listUsers,
  readerMatchesMember,
  registerAndCreatePair,
  registerAndJoinPair,
} from "@/lib/store";

export type ActionState = { error: string; ok?: boolean };

function knownError(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  if (error.message.includes("DATABASE_URL") || error.message.includes("Session pooler")) return error.message;
  switch (error.message) {
    case "NAME_TAKEN":
      return "That name is already registered. Sign in instead.";
    case "PARTNER_IN_PAIR":
      return "That person is already in a pair.";
    case "PARTNER_ALREADY_INVITED":
      return "A pair is already waiting for that name.";
    case "NO_INVITE":
      return "No pair is waiting for that name. Ask your partner to create the pair, or create one yourself.";
    default:
      return null;
  }
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const config = await databaseProblem();
  if (config) return { error: config };
  const name = cleanName(String(formData.get("name") ?? ""));
  const password = String(formData.get("password") ?? "");
  try {
    const user = name ? await getUserByName(name) : null;
    const matches = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !matches) {
      return { error: "That name and password do not match." };
    }
    const joined = await claimInviteOnSignIn(user);
    await startSession(joined.id);
  } catch (error) {
    const message = knownError(error);
    if (message) return { error: message };
    throw error;
  }
  redirect("/dashboard");
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = cleanName(String(formData.get("name") ?? ""));
  const password = String(formData.get("password") ?? "");
  const ageRaw = String(formData.get("age") ?? "").trim();
  const mode = String(formData.get("mode") ?? "");
  const partner = cleanName(String(formData.get("partner") ?? ""));

  if (!validName(name)) {
    return { error: "Enter a name using letters, spaces, apostrophes, or hyphens." };
  }
  if (!validPassword(password)) {
    return { error: "Use a password of at least 4 characters." };
  }
  const age = Number(ageRaw);
  if (!Number.isInteger(age) || age < 1 || age > 120) {
    return { error: "Enter an age from 1 to 120." };
  }
  if (mode !== "create" && mode !== "join") {
    return { error: "Choose whether you are creating or joining a pair." };
  }
  const config = await databaseProblem();
  if (config) return { error: config };

  let user;
  try {
    if (mode === "join") {
      user = await registerAndJoinPair({ name, password, age });
    } else {
      if (!validName(partner)) return { error: "Enter your partner's name." };
      if (sameName(name, partner)) return { error: "Your partner needs their own name." };
      user = await registerAndCreatePair({ name, password, age, partnerName: partner });
    }
  } catch (error) {
    const message = knownError(error);
    if (message) return { error: message };
    throw error;
  }
  await startSession(user.id);
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/");
}

export async function addEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const config = await databaseProblem();
  if (config) return { error: config };
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.pairId) return { error: "Join a pair before adding entries." };

  const kindRaw = String(formData.get("kind") ?? "");
  if (!isKind(kindRaw)) return { error: "Choose a kind of entry." };
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Enter a title." };
  if (title.length > 300) return { error: "That title is too long." };
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  if (kindRaw !== "currently_reading" && !body) return { error: "Add a few words." };
  if (body.length > 4000) return { error: "That note is too long." };

  const who = cleanName(String(formData.get("who") ?? ""));
  const members = membersOf(await listUsers(), user.pairId);
  const reader = readerMatchesMember(members, who);
  if (!reader) return { error: "Who needs to be a person in your pair." };

  await insertEntry({
    pairId: user.pairId,
    authorId: user.id,
    readerName: reader.name,
    kind: kindRaw,
    title,
    body,
    borrowed: formData.get("borrowed") === "on",
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/reading-log");
  revalidatePath("/dashboard");
  revalidatePath("/pair");
  return { error: "", ok: true };
}

export async function removeEntry(formData: FormData): Promise<void> {
  if (await databaseProblem()) redirect("/sign-in");
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const id = String(formData.get("id") ?? "");
  const entry = await getEntry(id);
  const allowed = entry && (user.role === "organizer" || user.pairId === entry.pairId);
  if (allowed) await deleteEntry(id);
  revalidatePath("/reading-log");
  revalidatePath("/dashboard");
  revalidatePath("/pair");
  redirect("/reading-log");
}

export async function addAdjustment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const config = await databaseProblem();
  if (config) return { error: config };
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "organizer") return { error: "Only an organizer can add an adjustment." };
  const pair = await getPair(String(formData.get("pairId") ?? ""));
  if (!pair) return { error: "That pair was not found." };
  const points = Number(String(formData.get("points") ?? "").trim());
  if (!Number.isInteger(points) || points === 0 || points < -100 || points > 100) {
    return { error: "Enter a whole number of points, other than zero, from -100 to 100." };
  }
  const note = String(formData.get("note") ?? "").trim();
  if (!note || note.length > 200) return { error: "Add a short note." };
  await insertAdjustment({
    pairId: pair.id,
    points,
    note,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/pair");
  revalidatePath("/dashboard");
  revalidatePath("/reading-log");
  return { error: "", ok: true };
}
