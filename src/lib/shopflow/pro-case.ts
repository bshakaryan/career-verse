import { z } from "zod";

export const proCaseKey = "careerverse-pro-practice-v1";
export const scenarios = {
  captured: { title: "Payment taken, confirmation lost", order: "SF-3101", cents: 7900, captured: true },
  interrupted: { title: "Request lost before payment", order: "SF-3102", cents: 4900, captured: false },
} as const;
export type Scenario = keyof typeof scenarios;
export const fixes = {
  retry: "Retry every failed checkout",
  block: "Block all retries after a timeout",
  verify: "Check payment status before retrying",
} as const;
export type Fix = keyof typeof fixes;
export const testCases = {
  normal: "Normal connection",
  captured: "Connection drops after payment",
  interrupted: "Connection drops before payment",
} as const;
export type TestCase = keyof typeof testCases;

const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("inspect") }),
  z.object({ type: z.literal("retry") }),
  z.object({ type: z.literal("confirm") }),
  z.object({ type: z.literal("refund"), cents: z.number().int().min(1).max(100000) }),
  z.object({ type: z.literal("fix"), fix: z.enum(["retry", "block", "verify"]) }),
  z.object({ type: z.literal("test"), test: z.enum(["normal", "captured", "interrupted"]) }),
]);
export type ProAction = z.infer<typeof actionSchema>;
export const reportSchema = z.object({
  decision: z.enum(["hold", "release"]),
  cause: z.enum(["unknown", "declined", "uncertain"]),
  evidence: z.enum(["none", "paid", "unpaid"]),
  recommendation: z.enum(["retry", "block", "verify"]),
  note: z.string().max(1600),
});
export type ProReport = z.infer<typeof reportSchema>;
export const emptyReport: ProReport = { decision: "hold", cause: "unknown", evidence: "none", recommendation: "retry", note: "" };
const attemptSchema = z.object({
  scenario: z.enum(["captured", "interrupted"]),
  actions: z.array(actionSchema).max(100),
  report: reportSchema.nullable(),
  draft: reportSchema.default(emptyReport),
});
export type ProAttempt = z.infer<typeof attemptSchema>;
const practiceSchema = z.object({ version: z.literal(1), current: attemptSchema, history: z.array(attemptSchema).max(8) });
export type ProPractice = z.infer<typeof practiceSchema>;
export function newAttempt(scenario: Scenario = "captured"): ProAttempt {
  return { scenario, actions: [], report: null, draft: { ...emptyReport } };
}
export function newPractice(): ProPractice {
  return { version: 1, current: newAttempt(), history: [] };
}
export function readPractice(raw: string | null): ProPractice {
  try {
    const parsed = practiceSchema.safeParse(JSON.parse(raw ?? "null"));
    return parsed.success ? parsed.data : newPractice();
  } catch { return newPractice(); }
}
export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// A payment request can fail on either side of capture. Retry behavior is a
// chosen policy, not a predetermined success string. All money is in cents.
export function runRegression(fix: Fix, test: TestCase, cents: number) {
  let payments = test === "interrupted" ? 0 : 1;
  let shown = test === "normal" ? "Paid" : "Failed";
  if (test !== "normal") {
    if (fix === "retry") { payments++; shown = "Paid"; }
    if (fix === "block") shown = "Pending";
    if (fix === "verify") { if (payments === 0) payments++; shown = "Paid"; }
  }
  const charged = payments * cents;
  return { charged, payments, shown, passed: charged === cents && shown === "Paid" };
}

export function replayAttempt(attempt: ProAttempt) {
  const scenario = scenarios[attempt.scenario];
  const s = {
    charged: scenario.captured ? scenario.cents : 0, refunded: 0,
    confirmed: false, inspected: false, lastInspectedNet: null as number | null,
    fix: "retry" as Fix, revision: 0, tests: [] as { test: TestCase; fix: Fix; revision: number; result: ReturnType<typeof runRegression> }[],
    blindRetries: 0, duplicateCreated: 0, unverifiedConfirmations: 0,
    ledger: [] as string[], log: [] as string[],
  };
  if (scenario.captured) s.ledger.push(`Initial payment captured: ${money(scenario.cents)}`);
  for (const action of attempt.actions) {
    switch (action.type) {
      case "inspect":
        s.inspected = true;
        s.lastInspectedNet = s.charged - s.refunded;
        s.log.push(`Checked payment record: net ${money(s.lastInspectedNet)}.`);
        break;
      case "retry": {
        if (s.lastInspectedNet === null) s.blindRetries++;
        const before = s.charged - s.refunded;
        s.charged += scenario.cents;
        s.duplicateCreated += Math.max(0, before + scenario.cents - scenario.cents) - Math.max(0, before - scenario.cents);
        s.ledger.push(`New payment captured: ${money(scenario.cents)}`);
        s.log.push(`Retried payment: another ${money(scenario.cents)} captured.`);
        s.lastInspectedNet = null;
        break;
      }
      case "confirm":
        if (s.lastInspectedNet !== scenario.cents) s.unverifiedConfirmations++;
        s.confirmed = true;
        s.log.push("Confirmed the order for fulfilment.");
        break;
      case "refund":
        if (action.cents > s.charged - s.refunded) {
          s.log.push(`Refund rejected: ${money(action.cents)} exceeds the available payment.`);
          break;
        }
        s.refunded += action.cents;
        s.ledger.push(`Refund issued: −${money(action.cents)}`);
        s.log.push(`Refunded ${money(action.cents)}.`);
        s.lastInspectedNet = null;
        break;
      case "fix":
        if (s.fix !== action.fix) { s.fix = action.fix; s.revision++; }
        s.log.push(`Selected fix: ${fixes[action.fix]}.`);
        break;
      case "test": {
        const result = runRegression(s.fix, action.test, scenario.cents);
        s.tests.push({ test: action.test, fix: s.fix, revision: s.revision, result });
        s.log.push(`Tested ${testCases[action.test]}: ${money(result.charged)}, ${result.shown}.`);
        break;
      }
    }
  }
  const currentTests = s.tests.filter(t => t.revision === s.revision);
  const verifiedFix = (Object.keys(testCases) as TestCase[]).every(test => currentTests.some(t => t.test === test && t.result.passed));
  const net = s.charged - s.refunded;
  return { ...s, net, excess: Math.max(0, net - scenario.cents), missing: Math.max(0, scenario.cents - net), verifiedFix,
    resolved: net === scenario.cents && s.confirmed };
}

export function actOnAttempt(attempt: ProAttempt, action: ProAction): ProAttempt {
  if (attempt.report || attempt.actions.length >= 100) return attempt;
  return { ...attempt, actions: [...attempt.actions, actionSchema.parse(action)] };
}
export function submitAttempt(attempt: ProAttempt, report: ProReport): ProAttempt {
  if (attempt.report) return attempt;
  return { ...attempt, report: reportSchema.parse(report) };
}
export function startNext(practice: ProPractice, scenario: Scenario): ProPractice {
  if (!practice.current.report) return practice;
  return { version: 1, current: newAttempt(scenario), history: [...practice.history, practice.current].slice(-8) };
}

export function assessAttempt(attempt: ProAttempt) {
  const s = replayAttempt(attempt);
  const scenario = scenarios[attempt.scenario];
  const report = attempt.report;
  const releaseSafe = s.fix === "verify" && s.verifiedFix && s.resolved;
  const findings: { title: string; detail: string; next: string; good: boolean }[] = [];
  findings.push({ title: "Customer recovery", good: s.resolved,
    detail: s.excess ? `The customer still has ${money(s.excess)} in excess charges.` : s.missing ? `${money(s.missing)} is missing${s.confirmed ? " on an order you confirmed for fulfilment" : " from the payment"}.` : s.confirmed ? `One ${money(scenario.cents)} payment remains and the order is confirmed.` : "Payment is correct, but the customer's order is still pending.",
    next: s.excess ? "Reconcile the payment record and refund only the extra charge." : s.missing ? s.refunded > 0 ? "Your refund removed money needed for this order. In a fresh attempt, keep one full payment and refund only an excess charge." : "Verify that no payment was captured before retrying; confirm only after capture." : "Check the payment record before confirming the order." });
  findings.push({ title: "Investigation before action", good: s.inspected && !s.blindRetries && !s.unverifiedConfirmations && !s.duplicateCreated,
    detail: s.duplicateCreated ? `Your retries created ${money(s.duplicateCreated)} in duplicate charges${s.excess === 0 ? ", even though you later corrected the balance" : ""}.` : s.blindRetries ? "You retried without first checking the current payment record." : s.unverifiedConfirmations ? "You confirmed the order without verifying one full payment." : s.inspected ? "You checked the payment record before committing to recovery." : "You never checked the payment record. The checkout message alone does not establish whether money moved.",
    next: "A timeout means the result is unknown. Look up the existing transaction before retrying or confirming." });
  findings.push({ title: "Regression coverage", good: s.verifiedFix,
    detail: s.verifiedFix ? "Your current fix passes normal checkout and both sides of the timeout." : `Current fix: ${fixes[s.fix]}. ${s.fix === "retry" ? "A retry after capture charges twice." : s.fix === "block" ? "Blocking every retry leaves a payment interrupted before capture unpaid." : "The fix needs passing evidence from all three checks."}`,
    next: "Check normal checkout, interruption before capture and interruption after capture on the same fix. Earlier test results do not validate a new fix." });
  const reportGood = !!report && report.cause === "uncertain" && report.evidence === (scenario.captured ? "paid" : "unpaid") && report.recommendation === "verify" && s.inspected;
  const reportErrors = report ? [
    report.cause === "declined" ? "You diagnosed a card decline, but a network timeout is not proof of a card decline." : report.cause === "unknown" ? "You left the timeout diagnosis unresolved." : "",
    report.evidence !== (scenario.captured ? "paid" : "unpaid") ? `Your handoff ${report.evidence === "none" ? "omitted the payment evidence" : report.evidence === "paid" ? "reported a captured payment" : "reported no captured payment"}; the original record shows ${scenario.captured ? `${money(scenario.cents)} captured` : "no capture"}.` : "",
    report.recommendation === "retry" ? "Your recommendation can repeat an already captured payment." : report.recommendation === "block" ? "Your recommendation blocks recovery even when no payment was captured." : "",
    !s.inspected ? "You did not inspect the payment record during this attempt." : "",
  ].filter(Boolean).join(" ") : "No report submitted.";
  findings.push({ title: "Evidence in your handoff", good: reportGood,
    detail: reportGood ? "Your diagnosis and recovery recommendation match the original payment record." : reportErrors,
    next: "Separate what the customer saw from what the payment service recorded. Cite the original capture, then recommend checking status before a retry." });
  const decisionGood = !!report && (report.decision === "release" ? releaseSafe : !releaseSafe);
  findings.push({ title: "Release decision", good: decisionGood,
    detail: !report ? "No release decision yet." : report.decision === "release" ? releaseSafe ? "You released after resolving the order and verifying the fix." : `You released with ${s.resolved ? "a fix that was unsafe or not fully tested" : "an unresolved customer order"}.` : releaseSafe ? "The order is resolved and all checks pass. Holding this build adds an avoidable delay." : "You held the release while customer recovery or regression checks were incomplete.",
    next: "Release when the order is reconciled and the current fix has passed all three checks. Otherwise hold and name the remaining blocker." });
  const points = [30, 20, 25, 15, 10];
  const score = findings.reduce((sum, finding, i) => sum + (finding.good ? points[i] : 0), 0);
  return { score, findings: findings.map((f, i) => ({ ...f, points: points[i] })), releaseSafe,
    nextSkill: !findings[1].good ? "Verify before retrying" : !findings[2].good ? "Test both sides of a timeout" : !findings[3].good ? "Write an evidence-based handoff" : !findings[0].good ? "Finish customer recovery" : "Handle a different payment failure" };
}
