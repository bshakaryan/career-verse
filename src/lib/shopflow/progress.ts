import { z } from "zod";
import { runSchema, type Run, type Action } from "./engine";
export const progressKey = "careerverse-shopflow-v1";
const chatSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().max(6000),
  source: z.enum(["user", "ai", "reference"]),
  notice: z.string().optional(),
});
export type ChatMessage = z.infer<typeof chatSchema>;
export const progressSchema = z.object({
  version: z.literal(1),
  revision: z.number().int().nonnegative(),
  active: z.string().nullable(),
  runs: z.array(runSchema).max(12),
  drafts: z.record(z.record(z.string().max(5000))),
  chats: z.record(z.array(chatSchema).max(100)),
  demoPro: z.boolean(),
});
export type Progress = z.infer<typeof progressSchema>;
export const emptyProgress = (): Progress => ({
  version: 1,
  revision: 0,
  active: null,
  runs: [],
  drafts: {},
  chats: {},
  demoPro: false,
});
export async function callEngine(
  run: Run,
  action?: Action,
  mode: "state" | "chat" | "reflection" = "state",
  text?: string,
) {
  const response = await fetch("/api/shopflow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ run, action, mode, text }),
    signal: AbortSignal.timeout(35000),
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(
      "The simulation server is unavailable. Your saved work has not changed.",
    );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Could not save this action. Please retry.");
  return data;
}
export function saveProgress(previous: Progress, next: Progress) {
  const current = localStorage.getItem(progressKey);
  if (
    current &&
    progressSchema.parse(JSON.parse(current)).revision !== previous.revision
  )
    throw new Error(
      "Your practice changed in another tab. Reload before continuing; no saved work was overwritten.",
    );
  const value = { ...next, revision: previous.revision + 1 };
  localStorage.setItem(progressKey, JSON.stringify(value));
  return value;
}
