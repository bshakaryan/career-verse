import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { newSession, revealEvent, revise, validatePlan } from "@/lib/engine";
import {
  deleteSession,
  persistent,
  readSession,
  reserveBudget,
  saveSession,
  storageReady,
} from "@/lib/store";
import { aiReady, colleagueReply, evaluate } from "@/lib/ai";
import { colleagues } from "@/lib/scenario";
import { planSchema, type Session } from "@/lib/types";
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
const cookie = "cv_guest";
function identity(req: NextRequest) {
  const token = req.cookies.get(cookie)?.value;
  return token && /^[a-f0-9]{64}$/.test(token)
    ? createHash("sha256").update(token).digest("hex")
    : null;
}
function result(session: Session | null) {
  return NextResponse.json(
    {
      session,
      capabilities: {
        ai: aiReady(),
        storage: storageReady(),
        persistent: persistent(),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
function error(e: unknown) {
  const message =
    e instanceof Error ? e.message : "Something went wrong. Please retry.";
  console.error("[CareerVerse]", e instanceof Error ? e.name : "UnknownError");
  const external =
    e instanceof Error &&
    /API|RateLimit|Authentication|Connection|Timeout/.test(e.name);
  const safe = external
    ? "The AI service could not complete this request. Your work is safe; please retry."
    : message;
  return NextResponse.json(
    { error: safe },
    {
      status: message.includes("session changed") ? 409 : 400,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
export async function GET(req: NextRequest) {
  try {
    const id = identity(req);
    return result(id && storageReady() ? await readSession(id) : null);
  } catch (e) {
    return error(e);
  }
}
const bodySchema = z.object({
  action: z.enum([
    "start",
    "save",
    "reveal",
    "chat",
    "reference",
    "submit",
    "retry",
    "revise",
    "reset",
    "selfcheck",
  ]),
  revision: z.number().int().nonnegative().optional(),
  plan: planSchema.optional(),
  colleague: z.enum(["alex", "morgan"]).optional(),
  text: z.string().min(1).max(2000).optional(),
  note: z.number().int().min(0).max(3).optional(),
  checks: z.record(z.boolean()).optional(),
});
export async function POST(req: NextRequest) {
  let locked: Session | null = null;
  try {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.headers.get("host"))
      throw new Error("Request origin is not allowed.");
    const raw = await req.text();
    if (Buffer.byteLength(raw) > 40000)
      throw new Error("This request is too large.");
    const b = bodySchema.parse(JSON.parse(raw));
    const id = identity(req);
    let s = id ? await readSession(id) : null;
    if (b.action === "reset") {
      if (s) {
        if (s.leaseUntil > Date.now())
          throw new Error(
            "Please wait for the current request before resetting.",
          );
        await deleteSession(s.id);
      }
      const r = result(null);
      r.cookies.delete(cookie);
      return r;
    }
    if (b.action === "start") {
      if (s) return result(s);
      const token = randomBytes(32).toString("hex");
      s = await saveSession(
        newSession(createHash("sha256").update(token).digest("hex")),
        null,
      );
      const r = result(s);
      r.cookies.set(cookie, token, {
        httpOnly: true,
        secure: req.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return r;
    }
    if (!s) throw new Error("Start a simulation first.");
    if (s.revision !== b.revision)
      throw new Error(
        "Your session changed. Reload to use the latest version.",
      );
    if (s.leaseUntil > Date.now())
      throw new Error("A request is already running. Please wait.");
    const revision = s.revision;
    if (b.action === "save") {
      if (s.stage === "review")
        throw new Error("Choose Improve my plan to edit this work.");
      s.draft = planSchema.parse(b.plan);
    }
    if (b.action === "reveal") s = revealEvent(s, planSchema.parse(b.plan));
    if (b.action === "revise") s = revise(s);
    if (b.action === "reference") {
      if (!b.colleague || b.note === undefined)
        throw new Error("Choose a scenario note.");
      if (s.messages.length >= 100)
        throw new Error("This session has reached its conversation limit.");
      const n = colleagues[b.colleague].notes[b.note];
      s.messages.push(
        {
          id: randomUUID(),
          colleague: b.colleague,
          role: "user",
          text: n.q,
          source: "reference",
        },
        {
          id: randomUUID(),
          colleague: b.colleague,
          role: "assistant",
          text: n.a,
          source: "reference",
        },
      );
    }
    if (b.action === "selfcheck") {
      const a = s.attempts.at(-1);
      if (!a || a.mode !== "practice")
        throw new Error(
          "Self-review is available after a practice submission.",
        );
      a.selfCheck = z
        .object({
          priorities: z.boolean(),
          execution: z.boolean(),
          risk: z.boolean(),
          communication: z.boolean(),
        })
        .parse(b.checks);
    }
    if (b.action === "chat" || b.action === "submit" || b.action === "retry") {
      if (b.action === "chat" && (!b.colleague || !b.text))
        throw new Error("Write a message first.");
      if (b.action === "submit") {
        if (s.stage !== "adapt")
          throw new Error("Review the new circumstance before submitting.");
        if (s.attempts.length >= 5)
          throw new Error("This session supports five attempts.");
        const plan = planSchema.parse(b.plan);
        validatePlan(plan, true);
        s.draft = plan;
        s.attempts.push({
          id: randomUUID(),
          createdAt: new Date().toISOString(),
          plan: { ...plan },
          feedback: null,
          selfCheck: {
            priorities: false,
            execution: false,
            risk: false,
            communication: false,
          },
          mode: aiReady() ? "ai" : "practice",
          status: aiReady() ? "pending" : "complete",
        });
        s.stage = "review";
      }
      if (b.action === "retry") {
        const a = s.attempts.at(-1);
        if (!a || a.mode !== "ai" || a.status === "complete")
          throw new Error("There is no review to retry.");
        a.status = "pending";
      }
      if (b.action === "chat" || b.action === "retry" || aiReady()) {
        if (!aiReady())
          throw new Error(
            "AI is not connected. Use the scenario notes in practice mode.",
          );
        if (s.aiCalls >= 40)
          throw new Error("This session has reached its AI request limit.");
        await reserveBudget();
        s.aiCalls++;
        s.leaseUntil = Date.now() + 65000;
        locked = await saveSession(s, revision);
        s = locked;
        if (b.action === "chat") {
          const reply = await colleagueReply(s, b.colleague!, b.text!);
          s.messages.push(
            {
              id: randomUUID(),
              colleague: b.colleague!,
              role: "user",
              text: b.text!,
              source: "ai",
            },
            {
              id: randomUUID(),
              colleague: b.colleague!,
              role: "assistant",
              text: reply,
              source: "ai",
            },
          );
        } else {
          const a = s.attempts.at(-1)!;
          a.feedback = await evaluate(s, a.plan);
          a.status = "complete";
        }
        s.leaseUntil = 0;
        const saved = await saveSession(s, locked.revision);
        locked = null;
        return result(saved);
      }
    }
    return result(await saveSession(s, revision));
  } catch (e) {
    if (locked) {
      try {
        locked.leaseUntil = 0;
        const last = locked.attempts.at(-1);
        if (last?.status === "pending") last.status = "failed";
        await saveSession(locked, locked.revision);
      } catch {}
    }
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { error: "Check the required fields and text lengths." },
        { status: 400 },
      );
    return error(e);
  }
}
