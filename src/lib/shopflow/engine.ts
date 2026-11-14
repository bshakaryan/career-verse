import { z } from "zod";
import {
  actualTotal,
  expectedTotal,
  shippingTotals,
  orders,
  documents,
  money,
  type Cart,
} from "./data";

const shortText = z.string().trim().max(3000);
const cents = z.number().int().min(0).max(100000);
export const reportSchema = z.object({
  title: shortText,
  preconditions: shortText,
  steps: shortText,
  expected: cents,
  actual: cents,
  severity: z.enum(["Low", "Medium", "High", "Critical"]),
  condition: z.enum(["accessories", "threshold", "all", "unknown"]),
  testIndex: z.number().int().min(0).max(199),
});
export type BugReport = z.infer<typeof reportSchema>;
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("READ_MESSAGE"), id: shortText }),
  z.object({ type: z.literal("READ_DOCUMENT"), id: shortText }),
  z.object({ type: z.literal("ORDER_INSPECTED"), id: shortText }),
  z.object({
    type: z.literal("REFUND_SUBMITTED"),
    id: shortText,
    amount: cents,
  }),
  z.object({
    type: z.literal("CUSTOMER_REPLIED"),
    id: shortText,
    text: shortText.min(15),
  }),
  z.object({
    type: z.literal("INCIDENT_ESCALATED"),
    orderIds: z.array(z.string()).max(3),
    symptom: shortText.min(10),
    priority: z.enum(["Low", "Medium", "High"]),
  }),
  z.object({ type: z.literal("ROLE_SWITCHED"), skipEscalation: z.boolean() }),
  z.object({
    type: z.literal("CHECKOUT_TESTED"),
    cart: z.object({
      subtotal: cents.min(100),
      category: z.enum(["apparel", "accessories", "mixed"]),
      promo: z.string().max(30),
    }),
  }),
  z.object({ type: z.literal("BUG_REPORT_SUBMITTED"), report: reportSchema }),
  z.object({
    type: z.literal("HINT_USED"),
    topic: z.enum(["refund", "escalation", "testing", "report"]),
  }),
  z.object({
    type: z.literal("SCENARIO_COMPLETED"),
    supportInterest: z.number().int().min(1).max(5),
    qaInterest: z.number().int().min(1).max(5),
    preference: z.enum(["people", "investigation", "both", "unsure"]),
  }),
  z.object({ type: z.literal("FOLLOWUP_TESTED"), subtotal: cents.min(100) }),
  z.object({ type: z.literal("FOLLOWUP_SUBMITTED"), report: reportSchema }),
]);
export type Action = z.infer<typeof actionSchema>;
export const runSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  events: z
    .array(z.object({ action: actionSchema, at: z.string().datetime() }))
    .max(200),
});
export type Run = z.infer<typeof runSchema>;
type Criterion = {
  label: string;
  score: number;
  weight: number;
  evidence: string;
};
export type Assessment = { total: number; criteria: Criterion[] };
type Test = { cart: Cart; expected: number; actual: number; minute: number };
export type ReportAttempt = {
  report: BugReport;
  score: Assessment;
  ready: boolean;
  minute: number;
};
export type State = {
  supportAssessment: Assessment | null;
  followupMinutes: number;
  stage: "support" | "qa" | "complete";
  minutes: number;
  roleMinutes: { support: number; qa: number };
  severity: "Investigating" | "High";
  read: string[];
  docs: string[];
  inspected: string[];
  refunds: Record<string, number>;
  replies: Record<string, string>;
  escalation: {
    orderIds: string[];
    symptom: string;
    priority: string;
    minute: number;
  } | null;
  qaTicket: {
    title: string;
    body: string;
    orderIds: string[];
    status: "Todo" | "In Progress" | "Blocked" | "Done";
  } | null;
  tests: Test[];
  reports: ReportAttempt[];
  followupTests: { subtotal: number; expected: number; actual: number }[];
  followupReports: ReportAttempt[];
  history: { type: string; text: string; minute: number }[];
  hints: { role: string; topic: string }[];
  interest: { support: number; qa: number; preference: string } | null;
  impact: {
    refunded: number;
    excessRefund: number;
    unresolvedOvercharge: number;
    qaDelay: number;
  };
};
export function newRun(): Run {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    events: [],
  };
}
const requireThat = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
function initialState(): State {
  return {
    supportAssessment: null,
    followupMinutes: 0,
    stage: "support",
    minutes: 0,
    roleMinutes: { support: 0, qa: 0 },
    severity: "Investigating",
    read: [],
    docs: [],
    inspected: [],
    refunds: {},
    replies: {},
    escalation: null,
    qaTicket: null,
    tests: [],
    reports: [],
    followupTests: [],
    followupReports: [],
    history: [],
    hints: [],
    interest: null,
    impact: {
      refunded: 0,
      excessRefund: 0,
      unresolvedOvercharge: 3200,
      qaDelay: 0,
    },
  };
}
function score(criteria: Criterion[]): Assessment {
  return {
    total: Math.round(
      criteria.reduce((sum, c) => sum + c.score * c.weight, 0) / 100,
    ),
    criteria,
  };
}
function percent(n: number, d: number) {
  return Math.round((n / d) * 100);
}
export function assessSupport(s: State): Assessment {
  if (s.supportAssessment) return s.supportAssessment;
  const correct = orders.filter(
    (o) => s.refunds[o.id] === actualTotal(o.cart) - expectedTotal(o.cart),
  ).length;
  const detailed = orders.filter((o) => {
    const text = s.replies[o.id]?.toLowerCase() || "";
    const amount = s.refunds[o.id];
    return (
      text.includes(o.id.toLowerCase()) &&
      amount !== undefined &&
      text.includes((amount / 100).toFixed(2)) &&
      text.length >= 60
    );
  }).length;
  const investigated =
    s.inspected.length +
    Number(s.docs.includes("refunds")) +
    Number(s.docs.includes("promotion"));
  const escalated = !!s.escalation;
  const priority =
    Number(escalated) * 40 +
    Number(s.escalation?.priority === "High") * 30 +
    Number(
      !!s.escalation &&
        ["SF-1042", "SF-1043"].every((id) =>
          s.escalation!.orderIds.includes(id),
        ),
    ) *
      30;
  return score([
    {
      label: "Task correctness",
      score: percent(correct, 3),
      weight: 40,
      evidence: `${correct}/3 refund decisions match the policy. ${money(s.impact.excessRefund)} excess refunds; ${money(s.impact.unresolvedOvercharge)} still owed.`,
    },
    {
      label: "Investigation",
      score: percent(investigated, 5),
      weight: 25,
      evidence: `${s.inspected.length}/3 orders inspected. Refund policy ${s.docs.includes("refunds") ? "read" : "not read"}; promotion requirements ${s.docs.includes("promotion") ? "read" : "not read"}.`,
    },
    {
      label: "Communication",
      score: percent(detailed, 3),
      weight: 20,
      evidence: `${detailed}/3 replies include the order ID, recorded amount with two decimals, and at least 60 characters of explanation. This checks completeness, not writing quality.`,
    },
    {
      label: "Prioritization",
      score: priority,
      weight: 15,
      evidence: escalated
        ? `Escalated at minute ${s.escalation!.minute}, priority ${s.escalation!.priority}, ${s.escalation!.orderIds.length} linked orders.`
        : "No escalation: QA inherited an untriaged issue and a 15-minute evidence-gathering delay.",
    },
  ]);
}
export function assessReport(
  s: State,
  r: BugReport,
  followup = false,
): ReportAttempt {
  const t = followup ? s.followupTests[r.testIndex] : s.tests[r.testIndex];
  const failing = !!t && t.expected !== t.actual;
  const totals = !!t && r.expected === t.expected && r.actual === t.actual;
  const condition = r.condition === (followup ? "threshold" : "accessories");
  const lines = r.steps.split(/\n/).filter((l) => l.trim().length >= 5);
  const steps =
    lines.length >= 3 &&
    (followup
      ? r.steps.includes("75")
      : /save20/i.test(r.steps) && /accessor|mixed/i.test(r.steps));
  const complete =
    Number(r.title.length >= 8) +
    Number(r.preconditions.length >= 12) +
    Number(steps) +
    Number(totals);
  const tests = followup ? s.followupTests : s.tests;
  const control = tests.some((test) => test.expected === test.actual);
  const docsRead = s.docs.includes(followup ? "shipping" : "promotion");
  const correct =
    Number(failing) * 25 + Number(totals) * 50 + Number(condition) * 25;
  const result = score([
    {
      label: "Task correctness",
      score: correct,
      weight: 40,
      evidence: `${failing ? "Failing" : "Passing or missing"} test linked; totals ${totals ? "match" : "do not match"} the engine; failure condition ${condition ? "identified" : "not identified"}.`,
    },
    {
      label: "Investigation",
      score:
        Number(failing) * 40 + Number(control) * 35 + Number(docsRead) * 25,
      weight: 25,
      evidence: `${tests.length} tests; passing control ${control ? "included" : "missing"}; requirements ${docsRead ? "read" : "not read"}.`,
    },
    {
      label: "Documentation",
      score: percent(complete, 4),
      weight: 20,
      evidence: `${complete}/4 checks: specific title, preconditions, three reproducible steps, exact result totals. ${steps ? "Steps include the triggering input." : followup ? "Include three steps and the $75 boundary." : "Include three steps, SAVE20 and accessories or a mixed cart."}`,
    },
    {
      label: "Prioritization",
      score: r.severity === "High" ? 100 : r.severity === "Critical" ? 50 : 0,
      weight: 15,
      evidence: `Selected ${r.severity}. Policy classifies a reproducible customer overcharge as High severity.`,
    },
  ]);
  return {
    report: r,
    score: result,
    ready:
      failing && totals && condition && complete === 4 && r.severity === "High",
    minute: s.minutes,
  };
}
export function replay(run: Run): State {
  const s = initialState();
  for (const { action: a } of run.events) apply(s, a);
  return s;
}
function apply(s: State, a: Action) {
  const wasComplete = s.stage === "complete";
  const phase = s.stage === "support" ? "support" : "qa";
  let cost = 0;
  let text = "";
  const supportOnly = () =>
    requireThat(
      s.stage === "support",
      "Support decisions are locked after the handoff. Start a fresh replay to change them.",
    );
  const qaOnly = () =>
    requireThat(s.stage === "qa", "Switch to QA before working on this task.");
  const getOrder = (id: string) => {
    const o = orders.find((o) => o.id === id);
    requireThat(o, "Unknown order.");
    return o!;
  };
  switch (a.type) {
    case "READ_MESSAGE":
      requireThat(
        a.id === "manager" || orders.some((o) => o.id === a.id),
        "Unknown message.",
      );
      if (s.read.includes(a.id)) return;
      s.read.push(a.id);
      cost = 1;
      text = `Read ${a.id === "manager" ? "manager briefing" : `customer message ${a.id}`}.`;
      break;
    case "READ_DOCUMENT":
      requireThat(
        documents.some((d) => d.id === a.id),
        "Unknown document.",
      );
      if (s.docs.includes(a.id)) return;
      s.docs.push(a.id);
      cost = 2;
      text = `Read ${documents.find((d) => d.id === a.id)!.title}.`;
      break;
    case "ORDER_INSPECTED":
      getOrder(a.id);
      if (s.inspected.includes(a.id)) return;
      s.inspected.push(a.id);
      cost = 2;
      text = `Inspected ${a.id}: cart, promotion and actual charge.`;
      break;
    case "REFUND_SUBMITTED": {
      supportOnly();
      const o = getOrder(a.id);
      requireThat(
        s.inspected.includes(a.id),
        "Inspect this order before deciding its refund.",
      );
      requireThat(
        s.refunds[a.id] === undefined,
        "This refund decision is already recorded. Replay to explore another decision.",
      );
      requireThat(
        a.amount <= actualTotal(o.cart),
        "A refund cannot exceed the amount paid.",
      );
      s.refunds[a.id] = a.amount;
      cost = 3;
      text = `Recorded ${money(a.amount)} refund for ${a.id}.`;
      break;
    }
    case "CUSTOMER_REPLIED":
      supportOnly();
      getOrder(a.id);
      requireThat(s.read.includes(a.id), "Read the customer's message first.");
      requireThat(
        s.refunds[a.id] !== undefined,
        "Record the refund decision before replying.",
      );
      requireThat(!s.replies[a.id], "This reply was already sent.");
      s.replies[a.id] = a.text;
      cost = 4;
      text = `Replied to ${a.id}; the customer received your refund decision.`;
      break;
    case "INCIDENT_ESCALATED":
      supportOnly();
      requireThat(!s.escalation, "An escalation is already recorded.");
      requireThat(
        new Set(a.orderIds).size === a.orderIds.length,
        "Link each order once.",
      );
      a.orderIds.forEach(getOrder);
      requireThat(
        a.orderIds.every((id) => s.inspected.includes(id)),
        "Inspect orders before attaching them.",
      );
      s.escalation = { ...a, minute: s.minutes };
      s.severity = "High";
      cost = 4;
      s.qaTicket = {
        title: "Checkout promotion discrepancy",
        body: a.symptom,
        orderIds: [...a.orderIds],
        status: a.orderIds.length ? "Todo" : "Blocked",
      };
      text = `Created QA-201 with ${a.orderIds.length} linked orders and ${a.priority} priority.`;
      break;
    case "ROLE_SWITCHED":
      supportOnly();
      requireThat(
        orders.every((o) => s.refunds[o.id] !== undefined && !!s.replies[o.id]),
        "Record refund decisions and reply to all three customers before the handoff.",
      );
      requireThat(
        s.escalation || a.skipEscalation,
        "Escalate or explicitly choose to hand off without escalation.",
      );
      if (!s.escalation) {
        cost = 15;
        s.impact.qaDelay = 15;
        s.qaTicket = {
          title: "Untriaged checkout complaints",
          body: "Support handed over without an escalation. Inspect the orders and requirements to rebuild the evidence before testing.",
          orderIds: [],
          status: "Blocked",
        };
      }
      s.stage = "qa";
      text = s.escalation
        ? "Perspective shifted to QA. Your escalation and refund decisions came with you."
        : "Perspective shifted to QA. Missing escalation cost 15 simulated minutes.";
      break;
    case "CHECKOUT_TESTED":
      qaOnly();
      requireThat(s.tests.length < 40, "This run supports 40 checkout tests.");
      s.tests.push({
        cart: a.cart,
        expected: expectedTotal(a.cart),
        actual: actualTotal(a.cart),
        minute: s.minutes,
      });
      if (s.qaTicket) s.qaTicket.status = "In Progress";
      cost = 3;
      text = `Tested ${money(a.cart.subtotal)} ${a.cart.category} cart with ${a.cart.promo || "no code"}: checkout charged ${money(actualTotal(a.cart))}.`;
      break;
    case "BUG_REPORT_SUBMITTED":
      qaOnly();
      requireThat(
        s.tests[a.report.testIndex],
        "Link a sandbox test to your report.",
      );
      requireThat(
        s.reports.length < 8,
        "Eight report attempts per run. Start a fresh replay to continue.",
      );
      {
        const result = assessReport(s, a.report);
        s.reports.push(result);
        if (s.qaTicket) s.qaTicket.status = result.ready ? "Done" : "Blocked";
        cost = 5;
        text = result.ready
          ? "QA handoff accepted. Engineering has a reproducible report; the bug is not yet fixed."
          : "QA handoff needs clarification. Review the evidence checks and revise your report.";
      }
      break;
    case "HINT_USED":
      requireThat(s.hints.length < 30, "Hint limit reached for this run.");
      s.hints.push({ role: phase, topic: a.topic });
      cost = 1;
      text = `Used a ${a.topic} hint.`;
      break;
    case "SCENARIO_COMPLETED":
      qaOnly();
      requireThat(
        s.reports.length,
        "Submit at least one QA report before comparing the roles.",
      );
      s.interest = {
        support: a.supportInterest,
        qa: a.qaInterest,
        preference: a.preference,
      };
      s.stage = "complete";
      text =
        "Completed both perspectives and recorded your own career interests.";
      break;
    case "FOLLOWUP_TESTED":
      requireThat(s.stage === "complete", "Complete the main incident first.");
      requireThat(s.followupTests.length < 30, "Follow-up test limit reached.");
      s.followupTests.push({
        subtotal: a.subtotal,
        ...shippingTotals(a.subtotal),
      });
      cost = 2;
      text = `Follow-up: tested shipping at ${money(a.subtotal)}.`;
      break;
    case "FOLLOWUP_SUBMITTED":
      requireThat(s.stage === "complete", "Complete the main incident first.");
      requireThat(
        s.followupTests[a.report.testIndex],
        "Run and link a follow-up test first.",
      );
      requireThat(
        s.followupReports.length < 8,
        "Follow-up report limit reached.",
      );
      s.followupReports.push(assessReport(s, a.report, true));
      cost = 4;
      text = "Assessed your free-shipping boundary report.";
      break;
  }
  s.minutes += cost;
  if (wasComplete) s.followupMinutes += cost;
  else s.roleMinutes[phase] += cost;
  s.impact.refunded = Object.values(s.refunds).reduce(
    (n, amount) => n + amount,
    0,
  );
  s.impact.excessRefund = orders.reduce(
    (n, o) =>
      n +
      Math.max(
        0,
        (s.refunds[o.id] || 0) - (actualTotal(o.cart) - expectedTotal(o.cart)),
      ),
    0,
  );
  s.impact.unresolvedOvercharge = orders.reduce(
    (n, o) =>
      n +
      Math.max(
        0,
        actualTotal(o.cart) - expectedTotal(o.cart) - (s.refunds[o.id] || 0),
      ),
    0,
  );
  if (a.type === "ROLE_SWITCHED") s.supportAssessment = assessSupport(s);
  s.history.push({ type: a.type, text, minute: s.minutes });
}
export function transition(
  raw: Run,
  action: Action,
  at = new Date().toISOString(),
) {
  const run = runSchema.parse(raw);
  const a = actionSchema.parse(action);
  requireThat(
    run.events.length < 200,
    "This run reached its event limit. Export it and start a fresh replay.",
  );
  const next = { ...run, events: [...run.events, { action: a, at }] };
  return { run: next, state: replay(next) };
}
export function recommendation(s: State) {
  const qa = s.reports.at(-1)?.score;
  const support = assessSupport(s);
  const role =
    (s.interest?.support || 0) > (s.interest?.qa || 0)
      ? "Customer Support"
      : (s.interest?.qa || 0) > (s.interest?.support || 0)
        ? "QA"
        : "both roles";
  const weak = [...support.criteria, ...(qa?.criteria || [])].sort(
    (a, b) => a.score - b.score,
  )[0];
  const focus = weak.score === 100
    ? "You met every rubric criterion in this incident. Next: apply those skills to a different defect at the free-shipping boundary."
    : `Your lowest evidence-based criterion is ${weak.label.toLowerCase()} (${weak.score}/100). Next: test a free-shipping boundary and practice a complete, evidence-based handoff.`;
  return `You reported the most interest in ${role}. ${focus} Interest and performance are separate; this is practice guidance, not a career aptitude diagnosis.`;
}
