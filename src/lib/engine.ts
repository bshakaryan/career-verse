import { emptyPlan, type Plan, type Session } from "./types";
import { scenario } from "./scenario";
export function newSession(id: string): Session {
  return {
    id,
    scenarioId: scenario.id,
    revision: 0,
    stage: "explore",
    draft: { ...emptyPlan },
    initialPlan: null,
    messages: [],
    attempts: [],
    aiCalls: 0,
    leaseUntil: 0,
    createdAt: new Date().toISOString(),
  };
}
export function validatePlan(plan: Plan, final = false) {
  const keys: (keyof Plan)[] = ["decision", "priorities", "actions", "risks"];
  if (final) keys.push("clientMessage");
  if (keys.some((k) => !plan[k].trim()))
    throw new Error("Complete each required section before continuing.");
}
export function revealEvent(session: Session, plan: Plan): Session {
  if (session.stage !== "explore")
    throw new Error("This update has already been revealed.");
  validatePlan(plan);
  return { ...session, initialPlan: { ...plan }, draft: plan, stage: "adapt" };
}
export function revise(session: Session): Session {
  if (session.stage !== "review")
    throw new Error("Submit your work before starting a revision.");
  return {
    ...session,
    stage: "adapt",
    draft: { ...session.attempts.at(-1)!.plan },
  };
}
