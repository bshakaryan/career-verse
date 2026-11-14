import { orders, money } from "./data";
import type { State } from "./engine";

export type GuideTarget =
  | "message"
  | "document"
  | "order"
  | "refund"
  | "reply"
  | "escalation"
  | "shift"
  | "ticket"
  | "test"
  | "report"
  | "reflection"
  | "learn";
export type Guide = {
  step: number;
  title: string;
  text: string;
  button: string;
  target: GuideTarget;
  id?: string;
  tips: string[];
};

export function nextGuide(s: State, ticketReviewed = false): Guide {
  if (s.stage === "complete")
    return {
      step: 8,
      title: "Your first workday is complete",
      text: "You have tried Support and QA. Review your decisions, then choose a course if you want to learn more.",
      button: "Explore related courses",
      target: "learn",
      tips: [
        "Your work is saved on this device. You can export it from the review.",
        "Your interests and task results describe different things; a single exercise does not determine your career.",
      ],
    };
  if (s.stage === "support") {
    if (!s.read.includes("manager"))
      return {
        step: 1,
        title: "Meet your manager",
        text: "Avery has left your first assignment. Start by reading what happened and what the team needs from you.",
        button: "Read Avery’s message",
        target: "message",
        id: "manager",
        tips: [
          "You start as a Support specialist. QA comes after your customer handoff.",
          "Use the next-step button whenever you are unsure where to go.",
        ],
      };
    for (const id of ["promotion", "refunds"])
      if (!s.docs.includes(id))
        return {
          step: 2,
          title:
            id === "promotion"
              ? "Check how the discount should work"
              : "Check the refund policy",
          text:
            id === "promotion"
              ? "Before replying, read the discount rules. Note the minimum order value, percentage and eligible categories."
              : "Find out what can be refunded and what your customer response must explain.",
          button:
            id === "promotion"
              ? "Read promotion requirements"
              : "Read refund policy",
          target: "document",
          id,
          tips: [
            "Calculate the expected charge using the policy, independently of what checkout charged.",
            "Use dollars with two decimal places in amount fields, for example 12.50.",
          ],
        };
    const order = orders.find((o) => !s.replies[o.id]);
    if (order) {
      const index = orders.indexOf(order) + 1;
      const base = {
        step: 3,
        id: order.id,
        tips: [
          `Customer ${index} of ${orders.length}. Work on one complaint at a time.`,
          "The next customer appears after you send this reply.",
        ],
      };
      if (!s.read.includes(order.id))
        return {
          ...base,
          title: `Customer ${index}/3 · ${order.customer}`,
          text: `Read the complaint for ${order.id}. Find the charge the customer wants you to check.`,
          button: "Read customer message",
          target: "message",
        };
      if (!s.inspected.includes(order.id))
        return {
          ...base,
          title: `Inspect order ${order.id}`,
          text: "Compare the items, merchandise subtotal, promotion and amount paid. You will decide whether an overcharge occurred.",
          button: "Inspect this customer’s order",
          target: "order",
        };
      if (s.refunds[order.id] === undefined)
        return {
          ...base,
          title: `Decide the refund for ${order.id}`,
          text: "In Refund amount ($), enter only the overcharge: amount paid minus the amount required by the policy. Enter 0.00 when the charge is correct.",
          button: "Go to refund amount",
          target: "refund",
          tips: [
            ...base.tips,
            "For a qualifying order, expected total = subtotal × 0.80. Refund = paid − expected.",
            "Check the calculation before recording it. Refund decisions are final within this attempt.",
          ],
        };
      return {
        ...base,
        title: `Reply to ${order.customer.split(" ")[0]}`,
        text: `Your refund decision is ${money(s.refunds[order.id])}. In Your response, include ${order.id}, that amount with two decimals, why you chose it and what happens next.`,
        button: "Write the customer reply",
        target: "reply",
        tips: [
          ...base.tips,
          "Suggested structure: Hello [name]. I checked [order]. [Explain the charge and refund]. [State your next step].",
          "Do not tell the customer the bug is fixed before QA verifies it.",
        ],
      };
    }
    if (!s.docs.includes("escalation"))
      return {
        step: 4,
        title: "Prepare your handoff to QA",
        text: "The customer replies are sent. Read the escalation policy before deciding which orders belong in the incident.",
        button: "Read escalation policy",
        target: "document",
        id: "escalation",
        tips: [
          "Look for complaints with the same symptom.",
          "The policy explains the priority for customer overcharges.",
        ],
      };
    if (!s.escalation)
      return {
        step: 4,
        title: "Give QA enough evidence to start",
        text: "Select the affected orders, describe the shared symptom in your own words and choose a priority. Then create the QA ticket.",
        button: "Prepare the QA ticket",
        target: "escalation",
        tips: [
          "Link orders whose charge disagrees with the promotion requirements. A correctly charged order can be a useful control, but is not affected.",
          "Describe what you observed. For example: [code] was used on [kind of cart], but [observed result].",
        ],
      };
    return {
      step: 4,
      title: "Your Support handoff is ready",
      text: "Now take the QA seat. You will investigate the same issue using the ticket you just created.",
      button: "Continue as QA Tester",
      target: "shift",
      tips: [
        "Your refunds, replies and ticket carry forward.",
        "Switching roles locks the Support decisions for this attempt.",
      ],
    };
  }
  if (!ticketReviewed)
    return {
      step: 5,
      title: "Read the ticket from Support",
      text: "You are now the QA Tester. Review the inherited complaint and linked orders before starting your investigation.",
      button: "Open your QA handoff",
      target: "ticket",
      tips: [
        "Read the symptom and the linked orders, then select “I’ve reviewed the ticket”.",
        "Missing Support evidence means you will need to reconstruct the issue yourself.",
      ],
    };
  if (!s.docs.includes("bugs"))
    return {
      step: 5,
      title: "Know what engineering needs",
      text: "Read the bug-reporting guide. You will need repeatable steps, exact totals and a test another person can reproduce.",
      button: "Read bug-reporting guide",
      target: "document",
      id: "bugs",
      tips: [
        "A passing control helps identify the boundary of the defect.",
        "Your report is checked against tests you actually ran.",
      ],
    };
  if (!s.tests.some((t) => t.expected !== t.actual))
    return {
      step: 6,
      title: s.tests.length
        ? "Try a different cart"
        : "Run your first checkout test",
      text: "Enter a merchandise subtotal, choose a cart category and enter SAVE20. Run checkout, then compare the charged amount with the promotion rules.",
      button: "Open checkout test fields",
      target: "test",
      tips: [
        "Start with the cart described in the customer complaint. For example, enter 100.00 as the subtotal and select its category.",
        "If the charge matches the policy, try a different category while keeping the subtotal and promo code unchanged.",
      ],
    };
  if (!s.tests.some((t) => t.expected === t.actual))
    return {
      step: 6,
      title: "Find a passing control",
      text: "You found a charge that disagrees with the policy. Change one input and run another test that works correctly, so you can narrow down the cause.",
      button: "Run a control test",
      target: "test",
      tips: [
        "Keep the subtotal and SAVE20 unchanged and try another category.",
        "Your test history records the input and actual charge for each attempt.",
      ],
    };
  if (!s.reports.at(-1)?.ready)
    return {
      step: 7,
      title: s.reports.length
        ? "Revise the engineering handoff"
        : "Write your bug report",
      text: s.reports.length
        ? "The report needs clarification. Use the review below your form to correct the missing evidence, then resubmit."
        : "Describe the defect, starting conditions and three reproduction steps. Enter the expected and actual totals from one failing test, choose severity and link that test.",
      button: "Go to bug-report form",
      target: "report",
      tips: [
        "Title: what fails and under which condition. Preconditions: cart value, category and code.",
        "Steps: one action per line. Expected total comes from the policy; actual total comes from the selected test.",
        "Choose the failing test in Evidence. Use the policy to choose severity; the most severe option is not automatically correct.",
      ],
    };
  return {
    step: 8,
    title: "Compare how the two roles felt",
    text: "Your report is ready for engineering. Rate your interest in Support and QA, choose the work style you preferred, then open your review.",
    button: "Finish and review my experience",
    target: "reflection",
    tips: [
      "These ratings are your preferences, not another test.",
      "Engineering still owns the fix. Completing your QA handoff does not mean the product has been repaired.",
    ],
  };
}
