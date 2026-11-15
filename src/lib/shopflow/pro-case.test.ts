import { describe, expect, it } from "vitest";
import { actOnAttempt, assessAttempt, newAttempt, newPractice, readPractice, replayAttempt, runRegression, startNext, submitAttempt, type ProAttempt, type ProReport } from "./pro-case";

const goodReport: ProReport = { decision: "release", cause: "uncertain", evidence: "paid", recommendation: "verify", note: "Verified the record and all timeout checks." };
function tested(attempt: ProAttempt) {
  let a = actOnAttempt(attempt, { type: "fix", fix: "verify" });
  for (const test of ["normal", "captured", "interrupted"] as const) a = actOnAttempt(a, { type: "test", test });
  return a;
}
function recovered() {
  return actOnAttempt(actOnAttempt(newAttempt(), { type: "inspect" }), { type: "confirm" });
}

describe("Pro checkout practice", () => {
  it("distinguishes the two sides of a timeout and a blocked legitimate retry", () => {
    expect(runRegression("retry", "captured", 7900)).toMatchObject({ charged: 15800, payments: 2, passed: false });
    expect(runRegression("retry", "interrupted", 7900)).toMatchObject({ charged: 7900, passed: true });
    expect(runRegression("block", "interrupted", 7900)).toMatchObject({ charged: 0, shown: "Pending", passed: false });
    for (const test of ["normal", "captured", "interrupted"] as const) expect(runRegression("verify", test, 7900)).toMatchObject({ charged: 7900, shown: "Paid", passed: true });
  });
  it("charges a duplicate, allows exact recovery and retains the original mistake in feedback", () => {
    let a = actOnAttempt(newAttempt(), { type: "retry" });
    expect(replayAttempt(a)).toMatchObject({ excess: 7900, duplicateCreated: 7900, blindRetries: 1 });
    a = actOnAttempt(a, { type: "inspect" });
    a = actOnAttempt(a, { type: "refund", cents: 7900 });
    a = actOnAttempt(a, { type: "inspect" });
    a = actOnAttempt(a, { type: "confirm" });
    a = submitAttempt(tested(a), goodReport);
    expect(replayAttempt(a)).toMatchObject({ excess: 0, resolved: true });
    expect(assessAttempt(a).score).toBe(80);
    expect(assessAttempt(a).findings[1].detail).toContain("later corrected");
  });
  it("does not erase unpaid fulfilment when an order is confirmed", () => {
    const a = submitAttempt(actOnAttempt(newAttempt("interrupted"), { type: "confirm" }), goodReport);
    expect(replayAttempt(a)).toMatchObject({ missing: 4900, confirmed: true, resolved: false });
    expect(assessAttempt(a).findings[0].detail).toContain("$49.00");
    expect(assessAttempt(a).releaseSafe).toBe(false);
  });
  it("requires different customer recovery for the transfer exercise", () => {
    let a = actOnAttempt(newAttempt("interrupted"), { type: "inspect" });
    a = actOnAttempt(a, { type: "retry" });
    a = actOnAttempt(a, { type: "inspect" });
    a = actOnAttempt(a, { type: "confirm" });
    expect(assessAttempt(submitAttempt(tested(a), { ...goodReport, evidence: "unpaid" })).score).toBe(100);
  });
  it("requires all tests on the current revision, even when switching back to a previously tested policy", () => {
    let a = tested(recovered());
    expect(replayAttempt(a).verifiedFix).toBe(true);
    a = actOnAttempt(a, { type: "fix", fix: "block" });
    a = actOnAttempt(a, { type: "fix", fix: "verify" });
    expect(replayAttempt(a).verifiedFix).toBe(false);
    expect(assessAttempt(submitAttempt(a, goodReport)).releaseSafe).toBe(false);
  });
  it("gives evidence-specific feedback for an incorrect handoff", () => {
    const a = tested(recovered());
    expect(assessAttempt(submitAttempt(a, goodReport)).score).toBe(100);
    const wrong = assessAttempt(submitAttempt(a, { ...goodReport, cause: "declined", evidence: "unpaid", recommendation: "retry" }));
    expect(wrong.score).toBe(85);
    expect(wrong.findings[3].detail).toContain("$79.00 captured");
    expect(wrong.findings[3].detail).toContain("not proof of a card decline");
  });
  it("rejects excess refunds and exposes an over-refund as a missing payment", () => {
    let a = actOnAttempt(newAttempt(), { type: "refund", cents: 8000 });
    expect(replayAttempt(a).net).toBe(7900);
    a = actOnAttempt(a, { type: "refund", cents: 7900 });
    expect(replayAttempt(a).missing).toBe(7900);
    expect(() => actOnAttempt(a, { type: "refund", cents: 0 })).toThrow();
  });
  it("freezes submitted attempts, persists drafts, and preserves independent prior outcomes", () => {
    const current = submitAttempt(tested(recovered()), goodReport);
    expect(actOnAttempt(current, { type: "retry" })).toBe(current);
    expect(submitAttempt(current, { ...goodReport, decision: "hold" })).toBe(current);
    const next = startNext({ ...newPractice(), current }, "interrupted");
    next.current.draft = { ...goodReport, note: "Unfinished handoff" };
    const loaded = readPractice(JSON.stringify(next));
    expect(loaded.history[0].report).toEqual(goodReport);
    expect(loaded.current.actions).toEqual([]);
    expect(loaded.current.draft.note).toBe("Unfinished handoff");
    expect(assessAttempt(loaded.history[0]).score).toBe(100);
    expect(readPractice('{"version":1,"current":{"scenario":"broken"}}')).toEqual(newPractice());
  });
});
