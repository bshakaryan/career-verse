import { z } from "zod";

export const aiFeedbackSchema = z.object({
  summary: z.string().min(1).max(1200),
  strengths: z.array(z.string().min(1).max(600)).max(4),
  issues: z.array(z.object({
    category: z.enum(["accuracy", "evidence", "clarity", "missing_information"]),
    quote: z.string().max(600),
    explanation: z.string().min(1).max(1000),
    suggestion: z.string().min(1).max(1000),
  }).strict()).max(6),
  suggested_revision: z.string().min(1).max(2400),
  next_step: z.string().min(1).max(800),
}).strict();
export type AIReportFeedback = z.infer<typeof aiFeedbackSchema>;
export const savedTextReviewSchema = z.object({
  note: z.string().max(4000),
  feedback: aiFeedbackSchema,
  model: z.string().max(120),
  reviewedAt: z.string().datetime(),
});
export type SavedTextReview = z.infer<typeof savedTextReviewSchema>;

export const feedbackJsonSchema = {
  type: "object", additionalProperties: false,
  properties: {
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    issues: { type: "array", items: {
      type: "object", additionalProperties: false,
      properties: {
        category: { type: "string", enum: ["accuracy", "evidence", "clarity", "missing_information"] },
        quote: { type: "string" }, explanation: { type: "string" }, suggestion: { type: "string" },
      }, required: ["category", "quote", "explanation", "suggestion"],
    } },
    suggested_revision: { type: "string" }, next_step: { type: "string" },
  }, required: ["summary", "strengths", "issues", "suggested_revision", "next_step"],
};
