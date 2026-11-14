import { newSession, revealEvent, revise, validatePlan } from "./engine";
import { colleagues, type Colleague } from "./scenario";
import { planSchema, type Session } from "./types";
export const staticPractice =
  process.env.NEXT_PUBLIC_PRACTICE_STATIC === "true";
const key = "careerverse-practice-v1";
const capabilities = { ai: false, storage: true, persistent: false };
export async function transport(
  action?: string,
  body: Record<string, unknown> = {},
) {
  if (!staticPractice) {
    const res = await fetch("/api/session", {
      method: action ? "POST" : "GET",
      cache: "no-store",
      headers: action ? { "Content-Type": "application/json" } : undefined,
      body: action ? JSON.stringify({ action, ...body }) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(
        data.error || "Could not complete this action.",
      ) as Error & { status: number };
      err.status = res.status;
      throw err;
    }
    return data;
  }
  let s: Session | null = null;
  try {
    s = JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    throw new Error(
      "Browser storage is unavailable. Enable site storage to save your practice.",
    );
  }
  if (!action) return { session: s, capabilities };
  if (action === "reset") {
    localStorage.removeItem(key);
    return { session: null, capabilities };
  }
  if (action === "start") {
    if (!s) {
      s = newSession(crypto.randomUUID());
      localStorage.setItem(key, JSON.stringify(s));
    }
    return { session: s, capabilities };
  }
  if (!s) throw new Error("Start a simulation first.");
  if (s.revision !== body.revision) {
    const e = new Error(
      "Your session changed in another tab. Reload to continue.",
    ) as Error & { status: number };
    e.status = 409;
    throw e;
  }
  switch (action) {
    case "save":
      if (s.stage === "review")
        throw new Error("Choose Improve my plan to edit.");
      s.draft = planSchema.parse(body.plan);
      break;
    case "reveal":
      s = revealEvent(s, planSchema.parse(body.plan));
      break;
    case "revise":
      s = revise(s);
      break;
    case "reference": {
      const who = body.colleague as Colleague;
      const note = colleagues[who]?.notes[Number(body.note)];
      if (!note) throw new Error("Choose a scenario note.");
      if (s.messages.length >= 100)
        throw new Error("This session has reached its conversation limit.");
      s.messages.push(
        {
          id: crypto.randomUUID(),
          colleague: who,
          role: "user",
          text: note.q,
          source: "reference",
        },
        {
          id: crypto.randomUUID(),
          colleague: who,
          role: "assistant",
          text: note.a,
          source: "reference",
        },
      );
      break;
    }
    case "submit": {
      if (s.stage !== "adapt")
        throw new Error("Review the new circumstance before submitting.");
      if (s.attempts.length >= 5)
        throw new Error("This session supports five attempts.");
      const plan = planSchema.parse(body.plan);
      validatePlan(plan, true);
      s.draft = plan;
      s.attempts.push({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        plan: { ...plan },
        feedback: null,
        selfCheck: {
          priorities: false,
          execution: false,
          risk: false,
          communication: false,
        },
        mode: "practice",
        status: "complete",
      });
      s.stage = "review";
      break;
    }
    case "selfcheck": {
      const attempt = s.attempts.at(-1);
      if (!attempt) throw new Error("Submit your plan first.");
      attempt.selfCheck = body.checks as Record<string, boolean>;
      break;
    }
    default:
      throw new Error("Live AI is not connected in this practice preview.");
  }
  s.revision++;
  try {
    localStorage.setItem(key, JSON.stringify(s));
  } catch {
    throw new Error(
      "Could not save your work. Your browser storage may be full. Export your existing work before clearing storage.",
    );
  }
  return { session: s, capabilities };
}
