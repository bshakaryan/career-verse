import { describe, it, expect } from "vitest";
import { actualTotal, expectedTotal, shippingTotals, orders } from "./data";
import {
  newRun,
  replay,
  transition,
  assessSupport,
  recommendation,
  type Run,
  type Action,
  type BugReport,
} from "./engine";
const step = (run: Run, action: Action) => transition(run, action).run;
function support(escalate = true, wrong = false) {
  let r = newRun();
  for (const id of ["promotion", "refunds", "bugs"])
    r = step(r, { type: "READ_DOCUMENT", id });
  for (const [i, order] of orders.entries()) {
    const amount = i === 0 ? (wrong ? 10000 : 2000) : i === 1 ? 1200 : 0;
    r = step(r, { type: "READ_MESSAGE", id: order.id });
    r = step(r, { type: "ORDER_INSPECTED", id: order.id });
    r = step(r, { type: "REFUND_SUBMITTED", id: order.id, amount });
    r = step(r, {
      type: "CUSTOMER_REPLIED",
      id: order.id,
      text: `Hello, I checked order ${order.id}. The verified refund is $${(amount / 100).toFixed(2)}. I will share the checkout issue with our QA team and update you after verification.`,
    });
  }
  if (escalate)
    r = step(r, {
      type: "INCIDENT_ESCALATED",
      orderIds: ["SF-1042", "SF-1043"],
      symptom:
        "SAVE20 orders with accessories were charged without the discount.",
      priority: "High",
    });
  return step(r, { type: "ROLE_SWITCHED", skipEscalation: !escalate });
}
const good: BugReport = {
  title: "SAVE20 excluded from mixed carts with accessories",
  preconditions:
    "A new checkout with $100 of merchandise, including accessories.",
  steps:
    "1. Add $80 apparel and $20 accessories to a mixed cart.\n2. Apply SAVE20 to the $100 subtotal.\n3. Observe the final checkout charge.",
  expected: 8000,
  actual: 10000,
  severity: "High",
  condition: "accessories",
  testIndex: 0,
};
function qa() {
  let r = support();
  r = step(r, {
    type: "CHECKOUT_TESTED",
    cart: { subtotal: 10000, category: "mixed", promo: "SAVE20" },
  });
  return step(r, {
    type: "CHECKOUT_TESTED",
    cart: { subtotal: 10000, category: "apparel", promo: "SAVE20" },
  });
}
describe("ShopFlow connected incident", () => {
  it("reproduces only the defined promotion defect, including boundaries and controls", () => {
    for (const category of ["apparel", "accessories", "mixed"] as const) {
      for (const subtotal of [4999, 5000, 6000, 10000]) {
        const cart = { subtotal, category, promo: "SAVE20" };
        const failing = category !== "apparel" && subtotal >= 5000;
        expect(actualTotal(cart) !== expectedTotal(cart)).toBe(failing);
        expect(actualTotal({ ...cart, promo: "" })).toBe(subtotal);
        expect(expectedTotal({ ...cart, promo: "WRONG" })).toBe(subtotal);
      }
    }
    expect(shippingTotals(7500)).toEqual({ expected: 7500, actual: 8199 });
    expect(shippingTotals(7499).actual).toBe(shippingTotals(7499).expected);
    expect(shippingTotals(7501).actual).toBe(shippingTotals(7501).expected);
  });
  it("inherits the support evidence, refunds and elapsed time without mutating the source run", () => {
    const base = newRun();
    const inspected = step(base, { type: "ORDER_INSPECTED", id: "SF-1042" });
    expect(base.events).toHaveLength(0);
    expect(inspected.events).toHaveLength(1);
    const r = support();
    const s = replay(r);
    expect(s.stage).toBe("qa");
    expect(s.qaTicket?.orderIds).toEqual(["SF-1042", "SF-1043"]);
    expect(s.impact.refunded).toBe(3200);
    expect(s.replies["SF-1042"]).toContain("20.00");
    expect(assessSupport(s).total).toBe(100);
  });
  it("produces different financial and QA consequences for poor support decisions", () => {
    const goodState = replay(support());
    const badState = replay(support(false, true));
    expect(badState.impact.excessRefund).toBe(8000);
    expect(badState.impact.qaDelay).toBe(15);
    expect(badState.qaTicket?.status).toBe("Blocked");
    expect(badState.qaTicket?.orderIds).toHaveLength(0);
    expect(assessSupport(badState).total).toBeLessThan(
      assessSupport(goodState).total,
    );
  });
  it("freezes support evidence before QA reads more documents", () => {
    let r = support();
    r = {...r, events: r.events.filter(e => !(e.action.type === "READ_DOCUMENT" && e.action.id === "promotion"))};
    const before = assessSupport(replay(r));
    expect(before.total).toBeLessThan(100);
    r = step(r, {type: "READ_DOCUMENT", id: "promotion"});
    expect(assessSupport(replay(r))).toEqual(before);
  });
  it("rejects repeated refunds, negative amounts and skipping the role workflow", () => {
    let r = newRun();
    expect(() =>
      step(r, { type: "ROLE_SWITCHED", skipEscalation: true }),
    ).toThrow();
    expect(() =>
      step(r, {
        type: "CHECKOUT_TESTED",
        cart: { subtotal: 10000, category: "mixed", promo: "SAVE20" },
      }),
    ).toThrow();
    r = step(r, { type: "ORDER_INSPECTED", id: "SF-1042" });
    expect(() =>
      step(r, { type: "REFUND_SUBMITTED", id: "SF-1042", amount: -1 }),
    ).toThrow();
    r = step(r, { type: "REFUND_SUBMITTED", id: "SF-1042", amount: 2000 });
    expect(() =>
      step(r, { type: "REFUND_SUBMITTED", id: "SF-1042", amount: 2000 }),
    ).toThrow();
    expect(() =>
      step(support(), { type: "REFUND_SUBMITTED", id: "SF-1042", amount: 0 }),
    ).toThrow();
  });
  it("checks reports against actual tests and retains rejected report attempts", () => {
    let r = qa();
    r = step(r, {
      type: "BUG_REPORT_SUBMITTED",
      report: {
        ...good,
        title: "bug",
        steps: "It fails",
        expected: 10000,
        condition: "all",
        severity: "Low",
      },
    });
    expect(replay(r).reports[0].ready).toBe(false);
    r = step(r, { type: "BUG_REPORT_SUBMITTED", report: good });
    const s = replay(r);
    expect(s.reports).toHaveLength(2);
    expect(s.reports[1].ready).toBe(true);
    expect(s.reports[1].score.total).toBe(100);
    expect(s.reports[0].score.total).toBeLessThan(50);
    expect(s.qaTicket?.status).toBe("Done");
  });
  it("does not accept an apparently complete report linked to a passing control", () => {
    const r = step(qa(), {
      type: "BUG_REPORT_SUBMITTED",
      report: { ...good, testIndex: 1, actual: 8000 },
    });
    expect(replay(r).reports[0].ready).toBe(false);
  });
  it("keeps interest independent, supports a real follow-up and preserves the original on replay", () => {
    let r = step(qa(), { type: "BUG_REPORT_SUBMITTED", report: good });
    r = step(r, {
      type: "SCENARIO_COMPLETED",
      supportInterest: 5,
      qaInterest: 2,
      preference: "people",
    });
    expect(recommendation(replay(r))).toContain("met every rubric criterion");
    const original = JSON.stringify(r);
    r = step(r, { type: "READ_DOCUMENT", id: "shipping" });
    r = step(r, { type: "FOLLOWUP_TESTED", subtotal: 7500 });
    r = step(r, { type: "FOLLOWUP_TESTED", subtotal: 7600 });
    r = step(r, {
      type: "FOLLOWUP_SUBMITTED",
      report: {
        title: "Free shipping missing at exactly $75",
        preconditions: "A fresh checkout without any promotion code.",
        steps:
          "1. Add merchandise worth $75.\n2. Proceed to shipping selection.\n3. Observe the final charged total.",
        expected: 7500,
        actual: 8199,
        severity: "High",
        condition: "threshold",
        testIndex: 0,
      },
    });
    const s = replay(r);
    expect(s.followupReports[0].ready).toBe(true);
    expect(s.followupReports[0].score.total).toBe(100);
    expect(s.interest?.support).toBe(5);
    expect(replay(JSON.parse(original)).followupReports).toHaveLength(0);
    const fresh = newRun();
    expect(fresh.id).not.toBe(r.id);
    expect(replay(fresh).refunds).toEqual({});
    expect(replay(fresh).minutes).toBe(0);
  });
});
