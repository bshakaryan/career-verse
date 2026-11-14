import { z } from "zod";
export const planSchema = z.object({
  decision: z.string().max(5000),
  priorities: z.string().max(5000),
  actions: z.string().max(5000),
  risks: z.string().max(5000),
  clientMessage: z.string().max(5000),
});
export type Plan = z.infer<typeof planSchema>;
export const emptyPlan: Plan = {
  decision: "",
  priorities: "",
  actions: "",
  risks: "",
  clientMessage: "",
};
export const feedbackSchema = z.object({
  summary: z.string(),
  criteria: z
    .array(
      z.object({
        id: z.enum(["priorities", "execution", "risk", "communication"]),
        level: z.enum(["Needs work", "Developing", "Strong"]),
        evidence: z.string(),
        explanation: z.string(),
        nextStep: z.string(),
      }),
    )
    .length(4),
  strengths: z.array(z.string()).length(2),
  nextSteps: z.array(z.string()).length(2),
});
export type Feedback = z.infer<typeof feedbackSchema>;
export type Message = {
  id: string;
  colleague: "alex" | "morgan";
  role: "user" | "assistant";
  text: string;
  source: "ai" | "reference";
};
export type Attempt = {
  id: string;
  createdAt: string;
  plan: Plan;
  feedback: Feedback | null;
  selfCheck: Record<string, boolean>;
  mode: "ai" | "practice";
  status: "pending" | "complete" | "failed";
};
export type Session = {
  id: string;
  scenarioId: string;
  revision: number;
  stage: "explore" | "adapt" | "review";
  draft: Plan;
  initialPlan: Plan | null;
  messages: Message[];
  attempts: Attempt[];
  aiCalls: number;
  leaseUntil: number;
  createdAt: string;
};
