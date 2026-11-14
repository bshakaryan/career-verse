import { z } from "zod";

export type Course = "support" | "qa" | "advanced";
export const courses = {
  support: {
    title: "Customer Support foundations",
    subtitle: "Make a fair refund decision and explain it clearly.",
    duration: "10–15 minutes",
    sections: [
      {
        title: "Find what the customer is owed",
        text: "Separate the amount paid from the amount the policy says should have been charged. The overcharge is paid minus expected. Then subtract refunds that already succeeded. A complaint is a reason to investigate, not proof that the whole purchase should be refunded.",
      },
      {
        title: "Check the payment history",
        text: "A settled refund has already returned money. A pending refund is still in flight: check its status before starting another. A failed refund has not returned money. Record your calculation and hand off unresolved payment issues to the person who owns them.",
      },
      {
        title: "Give the customer a useful next step",
        text: "Reference the order, state the verified amount, explain the decision in plain language and say what happens next. Do not promise that a bug is fixed or that money has arrived before you have confirmation.",
      },
    ],
    questions: [
      {
        prompt:
          "A customer paid $90, should have paid $72, and has already received a $6 refund. What remains owed?",
        options: ["$18", "$12", "$90"],
        answer: 1,
        explanation:
          "$90 − $72 = $18 overcharged. Subtract the $6 already returned: $12 remains.",
      },
      {
        prompt:
          "Another agent has a pending refund for the same overcharge. What should you do first?",
        options: [
          "Issue a second refund immediately",
          "Tell the customer both refunds succeeded",
          "Check its status and coordinate with its owner",
        ],
        answer: 2,
        explanation:
          "Pending is not failed. Verify the existing transaction and ownership before creating another refund.",
      },
    ],
  },
  qa: {
    title: "QA foundations",
    subtitle: "Turn a suspicious result into reproducible evidence.",
    duration: "10–15 minutes",
    sections: [
      {
        title: "Start with the requirement",
        text: "Write down what the product should do before testing it. Work out the expected result independently of the checkout. Otherwise a consistently wrong implementation can look correct.",
      },
      {
        title: "Change one thing at a time",
        text: "Compare a failing case with a passing control. For a rule that starts at $40 inclusive, test $39.99, $40.00 and $40.01. The boundary itself matters. Keep other settings the same so you can explain which input changes the outcome.",
      },
      {
        title: "Write a handoff someone can reproduce",
        text: "Name the affected condition in the title. Give the starting state and numbered actions. Include exact expected and actual values and link your failing test. Choose severity from customer impact. Under ShopFlow policy, a reproducible overcharge is High; reserve Critical for a wider outage.",
      },
    ],
    questions: [
      {
        prompt:
          "A fee should disappear at $40 or more. Which tests best check the boundary?",
        options: [
          "$39.99, $40.00 and $40.01",
          "$10, $20 and $30",
          "Repeat $100 three times",
        ],
        answer: 0,
        explanation:
          "Testing immediately below, exactly at and immediately above the boundary distinguishes > from ≥.",
      },
      {
        prompt: "Which evidence belongs in the defect report?",
        options: [
          "Only the final score",
          "A linked failing test, exact totals, steps and a passing control",
          "A guess that all checkouts are broken",
        ],
        answer: 1,
        explanation:
          "Reproducible evidence tells engineering what failed and what still works without overstating the scope.",
      },
    ],
  },
  advanced: {
    title: "The double-refund incident",
    subtitle: "Reconcile three accounts before the next payment batch.",
    duration: "10–15 minutes",
    sections: [
      {
        title: "One incident, one payment owner",
        text: "Two support agents can create two refunds for the same complaint. Assign one owner and reconcile by order and transaction ID. In this exercise, pending refunds can be cancelled before the batch runs. Settled transactions cannot be undone with another refund.",
      },
      {
        title: "Restore the correct balance",
        text: "Calculate total entitlement, subtract settled refunds, then inspect pending and failed entries. Cancel duplicates, retry verified failed payments only when nothing else is pending, and leave correctly charged orders alone. Never charge a customer again without authorization.",
      },
    ],
    questions: [
      {
        prompt:
          "The customer is owed $10. One $10 refund settled and another $10 is pending. What is the safe action in this exercise?",
        options: [
          "Cancel the pending duplicate",
          "Send a third refund",
          "Keep both refunds",
        ],
        answer: 0,
        explanation:
          "The settled refund already covers the entitlement. Cancel the pending duplicate before the batch runs.",
      },
      {
        prompt:
          "A verified refund failed and no other payment is pending. Has the customer received that money?",
        options: [
          "Yes, because it was requested",
          "No; verify the failure and retry through the payment owner",
          "Yes, if a support ticket is closed",
        ],
        answer: 1,
        explanation:
          "A failed payment returns no money. The ledger, not the ticket status, determines the outstanding balance.",
      },
    ],
  },
} as const;

export const learningActions = [
  z.object({
    type: z.literal("LESSON_ANSWERED"),
    course: z.enum(["support", "qa", "advanced"]),
    question: z.number().int().min(0).max(1),
    choice: z.number().int().min(0).max(2),
  }),
  z.object({
    type: z.literal("SUPPORT_PRACTICE_SUBMITTED"),
    amount: z.number().int().min(0).max(7200),
    nextStep: z.enum(["confirm", "promise", "close"]),
    reply: z.string().trim().min(15).max(3000),
  }),
  z.object({
    type: z.literal("ADVANCED_PRACTICE_SUBMITTED"),
    duplicate: z.enum(["cancel", "keep", "refund"]),
    failed: z.enum(["retry", "skip"]),
    correct: z.enum(["leave", "refund"]),
  }),
] as const;
export const learningActionSchema = z.discriminatedUnion(
  "type",
  learningActions,
);
export type LearningAction = z.infer<typeof learningActionSchema>;
export type PracticeResult = {
  score: number;
  passed: boolean;
  feedback: string[];
  excess: number;
  owed: number;
};
export type LearningState = {
  answers: {
    course: Course;
    question: number;
    choice: number;
    correct: boolean;
  }[];
  support: PracticeResult[];
  advanced: PracticeResult[];
};
export const newLearning = (): LearningState => ({
  answers: [],
  support: [],
  advanced: [],
});
export function lessonPassed(state: LearningState, course: Course) {
  return courses[course].questions.every(
    (_, index) =>
      state.answers
        .filter((a) => a.course === course && a.question === index)
        .at(-1)?.correct,
  );
}
export function applyLearning(
  state: LearningState,
  action: LearningAction,
): string {
  if (action.type === "LESSON_ANSWERED") {
    if (state.answers.length >= 40)
      throw new Error(
        "Lesson attempt limit reached. Start a fresh replay to continue.",
      );
    const q = courses[action.course].questions[action.question];
    if (action.choice >= q.options.length)
      throw new Error("Choose one of the listed answers.");
    const correct = action.choice === q.answer;
    state.answers.push({
      course: action.course,
      question: action.question,
      choice: action.choice,
      correct,
    });
    return correct
      ? "Knowledge check passed. Your learning progress is saved."
      : "Review the explanation and try the knowledge check again.";
  }
  const course =
    action.type === "SUPPORT_PRACTICE_SUBMITTED" ? "support" : "advanced";
  if (!lessonPassed(state, course))
    throw new Error("Pass both lesson checks before submitting this practice.");
  if (state[course].length >= 8)
    throw new Error(
      "Eight practice attempts per run. Start a fresh replay to continue.",
    );
  if (action.type === "SUPPORT_PRACTICE_SUBMITTED") {
    const amountCorrect = action.amount === 700;
    const nextCorrect = action.nextStep === "confirm";
    const replyComplete =
      /SF-1071/i.test(action.reply) &&
      /\b7\.00\b/.test(action.reply) &&
      action.reply.length >= 60;
    const passed = amountCorrect && nextCorrect && replyComplete;
    state.support.push({
      score:
        Number(amountCorrect) * 50 +
        Number(nextCorrect) * 25 +
        Number(replyComplete) * 25,
      passed,
      excess: Math.max(0, action.amount - 700),
      owed: Math.max(0, 700 - action.amount),
      feedback: [
        amountCorrect
          ? "Correct: $72 paid − $60 expected − $5 settled = $7 still owed."
          : "Reconcile all three values: $72 paid − $60 expected − $5 already returned = $7 remaining.",
        nextCorrect
          ? "You will confirm the refund status and update the customer."
          : "Confirm the payment status and update the customer; do not promise immediate receipt or close an unresolved case.",
        replyComplete
          ? "Your reply includes the order ID, $7.00 and enough detail for the completeness check."
          : "Include SF-1071, the additional $7.00 refund and a clear explanation (at least 60 characters). This checks completeness, not writing quality.",
      ],
    });
    return passed
      ? "Support practice complete. The customer receives the correct remaining refund."
      : "Support practice reviewed. Use the feedback to revise your decision.";
  }
  const checks = [
    action.duplicate === "cancel",
    action.failed === "retry",
    action.correct === "leave",
  ];
  const excess =
    (action.duplicate === "keep"
      ? 2000
      : action.duplicate === "refund"
        ? 4000
        : 0) + (action.correct === "refund" ? 6000 : 0);
  state.advanced.push({
    score: Math.round((checks.filter(Boolean).length / 3) * 100),
    passed: checks.every(Boolean),
    excess,
    owed: action.failed === "skip" ? 1500 : 0,
    feedback: [
      checks[0]
        ? "SF-2081: pending duplicate cancelled; the settled $20 covers the entitlement."
        : "SF-2081: cancel the pending $20 duplicate. Another refund adds to the overpayment.",
      checks[1]
        ? "SF-2082: the verified failed $15 refund is retried by its owner."
        : "SF-2082: a failed refund returned no money; $15 remains owed.",
      checks[2]
        ? "SF-2083: the correctly charged $60 order stays unchanged."
        : "SF-2083: no overcharge occurred. Refunding $60 creates an unnecessary loss.",
    ],
  });
  return checks.every(Boolean)
    ? "Payment batch reconciled. No excess refunds and no remaining customer debt."
    : "Payment batch reviewed. Inspect the consequences and revise your plan.";
}
