import { describe, it, expect } from "vitest";
import { newSession, revealEvent, revise, validatePlan } from "./engine";
import { type Plan } from "./types";
const plan: Plan = {
  decision: "Release core booking Friday, subject to a Thursday go/no-go.",
  priorities: "Defer analytics; seek approval for a daily export.",
  actions:
    "Sam finishes booking Wednesday; Jamie builds export; Taylor tests Thursday.",
  risks:
    "Critical failures block release; Morgan confirms training changes if delayed.",
  clientMessage:
    "Please approve the limited pilot and manual export. Next update Thursday noon.",
};
describe("simulation progression", () => {
  it("starts with a private, independent empty draft", () => {
    const a = newSession("a");
    const b = newSession("b");
    a.draft.decision = "changed";
    expect(b.draft.decision).toBe("");
    expect(a.initialPlan).toBeNull();
    expect(a.stage).toBe("explore");
  });
  it("requires all core sections before revealing new information", () => {
    expect(() =>
      revealEvent(newSession("a"), { ...plan, actions: " " }),
    ).toThrow();
  });
  it("snapshots the first decision and reveals the event only once", () => {
    const s = revealEvent(newSession("a"), plan);
    expect(s.stage).toBe("adapt");
    s.draft = { ...s.draft, decision: "Changed" };
    expect(s.initialPlan?.decision).toBe(plan.decision);
    expect(() => revealEvent(s, plan)).toThrow();
  });
  it("allows short answers but requires a client message for the final work", () => {
    validatePlan({ ...plan, decision: "Delay." }, true);
    expect(() => validatePlan({ ...plan, clientMessage: "" }, true)).toThrow();
    validatePlan({ ...plan, clientMessage: "" }, false);
  });
  it("only revises submitted work and never mutates that snapshot", () => {
    expect(() => revise(newSession("a"))).toThrow();
    const s = newSession("a");
    s.stage = "review";
    s.attempts = [
      {
        id: "one",
        createdAt: "now",
        plan: { ...plan },
        feedback: null,
        selfCheck: {},
        status: "complete",
        mode: "practice",
      },
    ];
    const updated = revise(s);
    updated.draft.decision = "Different recommendation";
    expect(updated.stage).toBe("adapt");
    expect(updated.attempts[0].plan.decision).toBe(plan.decision);
  });
});
