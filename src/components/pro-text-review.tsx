"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import type { ProAttempt } from "@/lib/shopflow/pro-case";
import { savedTextReviewSchema, type SavedTextReview } from "@/lib/shopflow/pro-review-contract";

const categoryLabels = { accuracy: "Factual accuracy", evidence: "Evidence", clarity: "Clarity", missing_information: "Missing information" };

export default function ProTextReview({ attempt, onDraft, onReview, demo = false }: {
  attempt: ProAttempt;
  demo?: boolean;
  onDraft: (note: string) => void;
  onReview: (review: SavedTextReview) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const active = useRef<AbortController | null>(null);
  const note = attempt.reviewDraft ?? attempt.report?.note ?? "";
  const review = attempt.textReview;
  const matches = review?.note === note.trim();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/pro-review", { signal: controller.signal }).then(r => r.json()).then(data => {
      if (!controller.signal.aborted && typeof data.available === "boolean") setAvailable(data.available);
    }).catch(() => {});
    return () => { controller.abort(); active.current?.abort(); active.current = null; };
  }, []);

  async function analyze() {
    if (active.current || note.trim().length < 20) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setError("");
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch("/api/pro-review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attempt: { scenario: attempt.scenario, actions: attempt.actions, report: attempt.report }, note: note.trim() }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === "not_configured") setAvailable(false);
        throw new Error(typeof data.error === "string" ? data.error : "AI review is unavailable. Your work is saved.");
      }
      const parsed = savedTextReviewSchema.parse(data.review);
      if (data.source !== "ai" || parsed.note !== note.trim()) throw new Error("AI returned a review for a different report. Please try again.");
      if (!controller.signal.aborted) { onReview(parsed); setAvailable(true); }
    } catch (cause) {
      if (active.current === controller) setError(controller.signal.aborted ? "AI review timed out. Your report is saved; you can try again." : cause instanceof Error && cause.name !== "ZodError" ? cause.message : "AI returned an incomplete review. Please try again.");
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) { active.current = null; setBusy(false); }
    }
  }

  return <section className="pro-ai-review mission-pro-card" aria-labelledby="pro-ai-title">
    <div><span className="mission-kicker">AI WRITING COACH</span><h2 id="pro-ai-title"><Sparkles size={22} /> {demo ? "Your first AI review" : "Review the report you wrote"}</h2>
      <p>{demo ? "Start with an example containing mistakes. Edit it or analyze it as written to see what AI finds." : "Get feedback on your wording, factual claims and missing evidence. Revise your text and request another review."}</p></div>
    <label htmlFor="pro-report-text">Your report</label>
    <textarea id="pro-report-text" rows={6} maxLength={4000} value={note} disabled={busy} onChange={e => { onDraft(e.target.value); setError(""); }} placeholder="Describe the original payment, what you investigated, your test evidence and the release recommendation." />
    <div className="pro-ai-controls"><span className="pro-muted">{note.length}/4,000 characters · at least 20</span>
      <button className="mission-primary" disabled={busy || note.trim().length < 20} onClick={analyze}><Sparkles size={16} /> {busy ? "Reviewing your report…" : review ? "Review revised report" : "Analyze my report"}</button></div>
    <p className="pro-muted">When you request a review, your text and simulated case evidence are sent to OpenAI. {demo ? "This sample is separate from your practice attempts. AI feedback is advisory." : "AI feedback is advisory; your practice score and decisions stay unchanged."}</p>
    {available === false && <p className="mission-demo-note" role="status">AI text review is not connected yet. You can write and save your report now.</p>}
    {error && <p className="pro-error" role="alert">{error}</p>}
    {busy && <p role="status">Checking your claims against the payment record and your test history…</p>}
    {review && <div className="pro-ai-feedback">
      <div className="pro-ai-meta"><b>{matches ? "AI review of this report" : "Previous AI review — your text has changed"}</b><span>{review.model}</span></div>
      {!matches && <p className="mission-demo-note">The review below refers to your previous text. Request a new review after editing.</p>}
      <p>{review.feedback.summary}</p>
      {review.feedback.strengths.length > 0 && <div><h3>What works</h3><ul className="pro-ai-strengths">{review.feedback.strengths.map((s, i) => <li key={i}><Check size={16} /> {s}</li>)}</ul></div>}
      {review.feedback.issues.length > 0 ? <div className="pro-findings">{review.feedback.issues.map((issue, i) => <article className="pro-finding needs-work" key={i}>
        <h3>{categoryLabels[issue.category]}</h3>{issue.quote && <blockquote>“{issue.quote}”</blockquote>}<p>{issue.explanation}</p><p className="pro-next"><b>Improve it:</b> {issue.suggestion}</p>
      </article>)}</div> : <p>No material issues identified in this review.</p>}
      <details className="pro-ai-example"><summary>See a suggested revision</summary><p>{review.feedback.suggested_revision}</p></details>
      <p className="pro-ai-next"><b>Your next step:</b> {review.feedback.next_step}</p>
    </div>}
  </section>;
}
