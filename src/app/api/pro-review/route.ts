import { proReviewRequest } from "@/lib/shopflow/pro-review-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;
function environment() {
  return { OPENAI_API_KEY: process.env.OPENAI_API_KEY, OPENAI_REPORT_MODEL: process.env.OPENAI_REPORT_MODEL, OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL };
}
export function GET(request: Request) { return proReviewRequest(request, environment()); }
export function POST(request: Request) { return proReviewRequest(request, environment()); }
