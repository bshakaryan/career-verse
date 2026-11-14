import { describe, expect, it } from "vitest";
import { nextGuide } from "./guide";
import {
  newRun,
  replay,
  transition,
  type Action,
  type BugReport,
} from "./engine";
import { orders } from "./data";

describe("guided experience", () => {
  it("follows the actual customer actions, then hands off to QA and reflection", () => {
    let run = newRun();
    const act = (action: Action) => {
      run = transition(run, action).run;
    };
    const guide = (reviewed = false) => nextGuide(replay(run), reviewed);
    expect(guide()).toMatchObject({
      step: 1,
      target: "message",
      id: "manager",
    });
    act({ type: "READ_MESSAGE", id: "manager" });
    expect(guide()).toMatchObject({
      step: 2,
      target: "document",
      id: "promotion",
    });
    act({ type: "READ_DOCUMENT", id: "promotion" });
    expect(guide().id).toBe("refunds");
    act({ type: "READ_DOCUMENT", id: "refunds" });
    for (const [index, order] of orders.entries()) {
      expect(guide()).toMatchObject({
        step: 3,
        target: "message",
        id: order.id,
      });
      act({ type: "READ_MESSAGE", id: order.id });
      expect(guide().target).toBe("order");
      act({ type: "ORDER_INSPECTED", id: order.id });
      expect(guide().target).toBe("refund");
      act({
        type: "REFUND_SUBMITTED",
        id: order.id,
        amount: [2000, 1200, 0][index],
      });
      expect(guide().target).toBe("reply");
      expect(guide().text).toContain(order.id);
      act({
        type: "CUSTOMER_REPLIED",
        id: order.id,
        text: `I have reviewed order ${order.id} and recorded the refund decision. We will investigate the checkout issue and update you.`,
      });
    }
    expect(guide()).toMatchObject({ target: "document", id: "escalation" });
    act({ type: "READ_DOCUMENT", id: "escalation" });
    expect(guide().target).toBe("escalation");
    act({
      type: "INCIDENT_ESCALATED",
      orderIds: ["SF-1042", "SF-1043"],
      symptom: "SAVE20 is not applied to carts with accessories.",
      priority: "High",
    });
    expect(guide().target).toBe("shift");
    act({ type: "ROLE_SWITCHED", skipEscalation: false });
    expect(guide()).toMatchObject({ step: 5, target: "ticket" });
    expect(guide(true)).toMatchObject({ target: "document", id: "bugs" });
    act({ type: "READ_DOCUMENT", id: "bugs" });
    expect(guide(true).target).toBe("test");
    act({
      type: "CHECKOUT_TESTED",
      cart: { subtotal: 10000, category: "mixed", promo: "SAVE20" },
    });
    expect(guide(true).title).toBe("Find a passing control");
    act({
      type: "CHECKOUT_TESTED",
      cart: { subtotal: 10000, category: "apparel", promo: "SAVE20" },
    });
    expect(guide(true)).toMatchObject({ step: 7, target: "report" });
    const report: BugReport = {
      title: "SAVE20 missing from mixed carts",
      preconditions: "A fresh $100 cart containing apparel and accessories.",
      steps:
        "1. Add apparel and accessories to a mixed cart.\n2. Apply SAVE20 to the cart.\n3. Observe the $100 charged total.",
      expected: 8000,
      actual: 10000,
      severity: "High",
      condition: "accessories",
      testIndex: 0,
    };
    act({
      type: "BUG_REPORT_SUBMITTED",
      report: { ...report, steps: "It fails" },
    });
    expect(guide(true).title).toBe("Revise the engineering handoff");
    act({ type: "BUG_REPORT_SUBMITTED", report });
    expect(guide(true)).toMatchObject({ step: 8, target: "reflection" });
    act({
      type: "SCENARIO_COMPLETED",
      supportInterest: 3,
      qaInterest: 4,
      preference: "investigation",
    });
    expect(guide().target).toBe("learn");
    expect(nextGuide(replay(JSON.parse(JSON.stringify(run))))).toEqual(guide());
  });

  it("keeps the guide on the unfinished customer and reports their actual decision", () => {
    let run = newRun();
    for (const action of [
      { type: "READ_MESSAGE", id: "manager" },
      { type: "READ_DOCUMENT", id: "promotion" },
      { type: "READ_DOCUMENT", id: "refunds" },
      { type: "READ_MESSAGE", id: "SF-1042" },
      { type: "ORDER_INSPECTED", id: "SF-1042" },
      { type: "REFUND_SUBMITTED", id: "SF-1042", amount: 3000 },
      { type: "READ_MESSAGE", id: "SF-1043" },
    ] as Action[])
      run = transition(run, action).run;
    const guide = nextGuide(replay(run));
    expect(guide.target).toBe("reply");
    expect(guide.id).toBe("SF-1042");
    expect(guide.text).toContain("$30.00");
  });
});
