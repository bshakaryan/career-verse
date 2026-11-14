import { shopflowRequest } from "@/lib/shopflow/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 40;
const environment = () => ({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL,
});
export function GET(request: Request) {
  return shopflowRequest(request, environment());
}
export function POST(request: Request) {
  return shopflowRequest(request, environment());
}
