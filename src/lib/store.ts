import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Session } from "./types";
const directory = path.join(process.cwd(), ".local-data");
export function persistent() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
export function storageReady() {
  return (
    persistent() ||
    (!process.env.VERCEL &&
      (process.env.NODE_ENV === "development" ||
        process.env.ALLOW_LOCAL_STORAGE === "true"))
  );
}
function db() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
function requireStorage() {
  if (!storageReady())
    throw new Error(
      "Storage is not configured. Add the server database settings before starting a session.",
    );
}
let localQueue: Promise<unknown> = Promise.resolve();
function local<T>(fn: () => Promise<T>): Promise<T> {
  const operation = localQueue.then(fn, fn);
  localQueue = operation.catch(() => {});
  return operation;
}
export async function readSession(id: string): Promise<Session | null> {
  requireStorage();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  if (persistent()) {
    const { data, error } = await db()
      .from("cv_sessions")
      .select("state")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error("Could not load your saved session.");
    return data?.state ?? null;
  }
  try {
    return JSON.parse(
      await fs.readFile(path.join(directory, id + ".json"), "utf8"),
    );
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}
export async function saveSession(
  state: Session,
  expected: number | null,
): Promise<Session> {
  requireStorage();
  const next = { ...state, revision: expected === null ? 0 : expected + 1 };
  if (persistent()) {
    const client = db();
    const result =
      expected === null
        ? await client
            .from("cv_sessions")
            .insert({ id: next.id, revision: next.revision, state: next })
            .select("id")
        : await client
            .from("cv_sessions")
            .update({ revision: next.revision, state: next })
            .eq("id", next.id)
            .eq("revision", expected)
            .select("id");
    if (result.error || !result.data?.length)
      throw new Error(
        "Your session changed. Reload to use the latest version.",
      );
    return next;
  }
  return local(async () => {
    const prior = await readSession(next.id);
    if (
      (expected === null && prior) ||
      (expected !== null && prior?.revision !== expected)
    )
      throw new Error(
        "Your session changed. Reload to use the latest version.",
      );
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    const file = path.join(directory, next.id + ".json");
    await fs.writeFile(file + ".tmp", JSON.stringify(next), { mode: 0o600 });
    await fs.rename(file + ".tmp", file);
    return next;
  });
}
export async function deleteSession(id: string) {
  if (persistent()) {
    const { error } = await db().from("cv_sessions").delete().eq("id", id);
    if (error) throw new Error("Could not reset the session.");
  } else await fs.rm(path.join(directory, id + ".json"), { force: true });
}
export async function reserveBudget() {
  const limit = Number(process.env.AI_DAILY_REQUEST_LIMIT || 250);
  if (!Number.isFinite(limit) || limit < 1)
    throw new Error("AI request budget is disabled.");
  if (persistent()) {
    const { data, error } = await db().rpc("cv_reserve_ai_request", {
      daily_limit: limit,
    });
    if (error || !data)
      throw new Error(
        "The daily AI request budget has been reached. Please try again tomorrow.",
      );
    return;
  }
  await local(async () => {
    await fs.mkdir(directory, { recursive: true });
    const file = path.join(directory, "budget.json");
    const date = new Date().toISOString().slice(0, 10);
    let budget = { date, count: 0 };
    try {
      const old = JSON.parse(await fs.readFile(file, "utf8"));
      if (old.date === date) budget = old;
    } catch {}
    if (budget.count >= limit)
      throw new Error("The daily AI request budget has been reached.");
    budget.count++;
    await fs.writeFile(file, JSON.stringify(budget), { mode: 0o600 });
  });
}
