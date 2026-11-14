export const scenario = {
  id: "northstar-launch-v1",
  title: "The launch is on you.",
  company: "Northstar",
  subtitle: "Your first week. A Friday deadline. A team that needs a plan.",
  brief:
    "Northstar helps independent clinics manage appointments. A pilot with three clinics starts Friday at 10:00 AM. Your job is to recommend a release plan that protects the booking experience and gives the client a clear next step.",
  objective:
    "Deliver a reliable booking flow for the pilot. Make trade-offs explicit, assign owners, and explain what would cause you to change course.",
  constraints: [
    "It is Tuesday, 9:00 AM. The pilot starts Friday at 10:00 AM.",
    "Two engineers are available: Sam and Jamie. One workday = 6 focused hours per person.",
    "The team has no overtime budget. Technical estimates exclude testing.",
    "The initial QA allocation is 6 hours on Thursday. A full regression takes 6 hours.",
  ],
  tasks: [
    {
      id: "NS-101",
      name: "Appointment booking",
      owner: "Sam",
      status: "In progress",
      hours: "6h",
      priority: "Essential",
      detail:
        "Create a booking and receive a confirmation. Must work for the pilot.",
    },
    {
      id: "NS-102",
      name: "Calendar integration",
      owner: "Jamie",
      status: "Blocked",
      hours: "12h after access",
      priority: "Requested",
      detail: "Waiting for vendor credentials. No confirmed delivery time.",
    },
    {
      id: "NS-103",
      name: "Cancellation & rescheduling",
      owner: "Sam",
      status: "Ready",
      hours: "6h",
      priority: "Essential",
      detail:
        "Patients can cancel or move an appointment without creating duplicate bookings.",
    },
    {
      id: "NS-104",
      name: "Analytics dashboard",
      owner: "Jamie",
      status: "New request",
      hours: "12h",
      priority: "Requested",
      detail:
        "Client requested weekly booking trends yesterday. Scope has not been agreed.",
    },
    {
      id: "NS-105",
      name: "Release verification",
      owner: "Taylor",
      status: "Planned",
      hours: "6h",
      priority: "Essential",
      detail:
        "Full regression of booking, confirmation, rescheduling, cancellation and permissions.",
    },
  ],
};
export const colleagues = {
  alex: {
    name: "Alex Chen",
    role: "Engineering Lead",
    initials: "AC",
    color: "mint",
    intro: "Let’s make the scope match the time we actually have.",
    notes: [
      {
        q: "What is blocking the integration?",
        a: "We are waiting for vendor credentials, with no confirmed arrival. Jamie needs 12 focused hours after access arrives, plus QA. Treat the date as uncertain.",
      },
      {
        q: "Can we launch without the integration?",
        a: "Yes. The core booking flow is independent of calendar sync. The clinics could use a manual daily export during the pilot. Jamie needs 3 hours to set up and verify the export; the client must agree to the workaround.",
      },
      {
        q: "What must we test before release?",
        a: "Booking, confirmation, cancellation, rescheduling and access permissions are critical. A focused smoke test takes 3 hours, but does not give the coverage of the 6-hour full regression. Any critical defect blocks release.",
      },
      {
        q: "Who can own the remaining work?",
        a: "Sam owns booking and cancellation/rescheduling: 12 hours remaining total. Jamie owns integration, export and analytics. Taylor owns QA. I can make the technical release recommendation, but cannot approve the client trade-off.",
      },
    ],
  },
  morgan: {
    name: "Morgan Reed",
    role: "Client Lead",
    initials: "MR",
    color: "lavender",
    intro: "The clinics need clarity. Tell me what changes and why.",
    notes: [
      {
        q: "What matters most to the client?",
        a: "The three clinics need reliable appointment booking, confirmations, cancellation and rescheduling. Patient-facing failures would undermine the pilot. Friday matters because training is already scheduled.",
      },
      {
        q: "Is analytics required for the pilot?",
        a: "No. Analytics is a request, not an agreed launch requirement. We can propose a later date, but should communicate the decision and owner explicitly.",
      },
      {
        q: "Would a manual export be acceptable?",
        a: "I can seek approval for a daily manual export for the pilot. Each clinic needs a named operator, instructions and a clear review date. It is not approved yet.",
      },
      {
        q: "Can we move the launch?",
        a: "A delay is possible if you explain the risk, alternative date or decision checkpoint, and impact on clinic training. I need to confirm the change with the client. Do not promise a date the team cannot support.",
      },
    ],
  },
};
export type Colleague = keyof typeof colleagues;
export const twist = {
  title: "Your testing window just got smaller.",
  body: "Taylor can now work only 3 hours on Thursday, instead of 6. Full regression still needs 6 hours. There is no extra QA capacity before Friday. Revisit your scope, release criteria and fallback plan before updating the client.",
};
export const criteria = [
  {
    id: "priorities",
    title: "Prioritization",
    question:
      "Did I protect the core booking flow and explicitly decide what to defer?",
    strong:
      "Connect scope decisions to the clinic pilot, dependencies and capacity. Distinguish requests from agreed requirements.",
  },
  {
    id: "execution",
    title: "An executable plan",
    question:
      "Does each next action have an owner, a realistic deadline and a dependency?",
    strong:
      "Use the stated capacity. Include client approval, the testing checkpoint and a release decision owner.",
  },
  {
    id: "risk",
    title: "Risk management",
    question:
      "Did I respond to the shorter QA window with release criteria and a fallback?",
    strong:
      "Explain reduced coverage, critical tests, a go/no-go checkpoint and what happens if a blocker remains.",
  },
  {
    id: "communication",
    title: "Client communication",
    question:
      "Would the client understand the decision, trade-offs and next update?",
    strong:
      "State what changes, what remains uncertain, what approval is needed, and when the next update arrives.",
  },
] as const;
export const fields = [
  {
    id: "decision",
    label: "Your release decision",
    placeholder: "What should ship, and when? Explain the trade-off.",
  },
  {
    id: "priorities",
    label: "Scope & priorities",
    placeholder:
      "Keep, defer or remove? Explain why each decision supports the pilot.",
  },
  {
    id: "actions",
    label: "Actions, owners & checkpoints",
    placeholder:
      "Who does what, by when? Include dependencies and the release decision.",
  },
  {
    id: "risks",
    label: "Risks & fallback plan",
    placeholder: "What could fail? What would trigger a change of plan?",
  },
  {
    id: "clientMessage",
    label: "Your message to the client",
    placeholder:
      "Write a concise status update with the decision, impact and next step.",
  },
] as const;
