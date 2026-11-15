import { z } from "zod";

const phaseSchema = z.enum([
  "intro", "support", "ticket", "ticket-sent", "developer", "choose-fix",
  "fix-applied", "qa", "qa-decision", "qa-approved", "resolution", "complete",
]);
export type Phase = z.infer<typeof phaseSchema>;

const expectedPayment = "Pay Now starts one payment and shows the result.";
const defaultReply = "Hi Maya! We fixed the checkout. You can try Pay Now again. Thanks for your patience!";

export function defaultHandoff(patch: MissionState["patch"]) {
  return patch === "guarded"
    ? "Pay Now locks while a payment runs. Check double-clicks and try again after a decline."
    : "Pay Now starts a payment again. Check a normal click and two quick clicks.";
}

export const ticketDefaults = {
  summary: "Pay Now does nothing on the Premium Plan checkout",
  evidence: "Clicking Pay Now gives no message. Refreshing the page does not help.",
  expected: expectedPayment,
  priority: "High",
};

const missionSchema = z.object({
  phase: phaseSchema,
  asked: z.boolean(),
  ticket: z.object({
    summary: z.string().max(100),
    evidence: z.string().max(240),
    expected: z.string().max(160).default(expectedPayment),
    priority: z.enum(["", "Low", "High"]),
  }),
  reproduced: z.boolean(),
  patch: z.enum(["missing", "connected", "guarded"]),
  previewPassed: z.boolean(),
  handoff: z.string().max(240).default(""),
  reply: z.string().max(320).default(defaultReply),
  qaReported: z.boolean(),
  qaResults: z.object({
    single: z.number().int().min(0).max(1).optional(),
    repeat: z.number().int().min(0).max(2).optional(),
    retry: z.number().int().min(0).max(1).optional(),
  }),
});

export type MissionState = z.infer<typeof missionSchema>;
export type TestCase = keyof MissionState["qaResults"];

export const initialMission: MissionState = {
  phase: "intro",
  asked: false,
  ticket: { summary: "", evidence: "", expected: expectedPayment, priority: "" },
  reproduced: false,
  patch: "missing",
  previewPassed: false,
  handoff: "",
  reply: defaultReply,
  qaReported: false,
  qaResults: {},
};

export function readMission(saved: string | null): MissionState {
  if (!saved) return initialMission;
  const previous = phaseSchema.safeParse(saved);
  if (previous.success) {
    const phase = previous.data;
    if (phase === "complete" || phase === "resolution") {
      return { ...initialMission, phase };
    }
    if (phase === "intro" || phase === "support" || phase === "ticket") {
      return { ...initialMission, phase: phase === "ticket" ? "support" : phase };
    }
    const readyForQa = ["fix-applied", "qa", "qa-decision", "qa-approved"].includes(phase);
    return {
      ...initialMission,
      phase: readyForQa ? "qa" : phase === "choose-fix" ? "developer" : phase,
      asked: true,
      ticket: { ...ticketDefaults, priority: "High" },
      reproduced: readyForQa,
      patch: readyForQa ? "connected" : "missing",
      previewPassed: readyForQa,
    };
  }
  try {
    const raw = JSON.parse(saved);
    const result = missionSchema.safeParse(raw);
    if (!result.success) return initialMission;
    const mission = result.data;
    if (raw.handoff === undefined && mission.previewPassed) {
      return { ...mission, handoff: defaultHandoff(mission.patch) };
    }
    return mission;
  } catch {
    return initialMission;
  }
}

// Both clicks in the repeat test arrive before the first payment finishes.
export function simulateCheckout(patch: MissionState["patch"], test: Exclude<TestCase, "retry">) {
  if (patch === "missing") return 0;
  if (patch === "guarded") return 1;
  return test === "repeat" ? 2 : 1;
}
