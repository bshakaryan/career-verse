"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { z } from "zod";
import ProTextReview from "./pro-text-review";
import { actOnAttempt, money, newAttempt, replayAttempt, scenarios, submitAttempt, testCases, type ProAttempt } from "@/lib/shopflow/pro-case";
import { savedTextReviewSchema } from "@/lib/shopflow/pro-review-contract";

const storageKey = "careerverse-ai-review-demo-v1";
const draftSchema = z.object({ reviewDraft: z.string().max(4000), textReview: savedTextReviewSchema.optional() });

function sampleAttempt(): ProAttempt {
  let attempt = newAttempt("captured");
  attempt = actOnAttempt(attempt, { type: "inspect" });
  attempt = actOnAttempt(attempt, { type: "confirm" });
  attempt = actOnAttempt(attempt, { type: "fix", fix: "verify" });
  for (const test of ["normal", "captured", "interrupted"] as const) attempt = actOnAttempt(attempt, { type: "test", test });
  return submitAttempt(attempt, {
    decision: "release", cause: "uncertain", evidence: "paid", recommendation: "verify",
    note: "SF-3101: the checkout showed Failed, so the customer was charged $0. I retried the payment twice and refunded $79. We should automatically retry every failed payment. All three tests passed, so I recommend releasing the fix.",
  });
}

export default function AiReviewDemo({ onHome, onPractice }: { onHome: () => void; onPractice: () => void }) {
  const [attempt, setAttempt] = useState(sampleAttempt);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    try {
      const saved = draftSchema.safeParse(JSON.parse(localStorage.getItem(storageKey) ?? "null"));
      if (saved.success) setAttempt(current => ({ ...current, ...saved.data }));
    } catch { /* Keep the editable sample when storage is unavailable. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ reviewDraft: attempt.reviewDraft ?? attempt.report!.note, textReview: attempt.textReview }));
      setSaveError(false);
    } catch { setSaveError(true); }
  }, [attempt, ready]);

  const evidence = replayAttempt(attempt);
  const scenario = scenarios[attempt.scenario];
  return <main className="ai-demo-page">
    <button className="mission-course-back" onClick={onHome}><ArrowLeft size={15} /> Back to Explore</button>
    <header className="ai-demo-heading">
      <span className="sf-ai-eyebrow"><Sparkles size={17} aria-hidden="true" /> TRY AI FEEDBACK</span>
      <h1>Try AI feedback on a report.</h1>
      <p>Spot mistakes, understand the evidence, and improve your report. Edit the sample or write in your own language.</p>
    </header>
    <div className="ai-demo-grid">
      <aside className="ai-demo-evidence" aria-labelledby="ai-sample-title">
        <span className="mission-course-badge">SAMPLE CASE · {scenario.order}</span>
        <h2 id="ai-sample-title">The facts to write about</h2>
        <p>A {money(scenario.cents)} checkout showed <strong>Failed</strong> after the connection dropped. The payment had already been captured.</p>
        <dl>
          <div><dt>Customer charged</dt><dd>{money(evidence.charged)}</dd></div>
          <div><dt>Refunds issued</dt><dd>{money(evidence.refunded)}</dd></div>
          <div><dt>Payment retries</dt><dd>None</dd></div>
          <div><dt>Order</dt><dd>Confirmed</dd></div>
        </dl>
        <h3>What the sample investigator did</h3>
        <p>Checked the payment record, confirmed the order, and selected “Check payment status before retrying”.</p>
        <h3>Tests on that fix</h3>
        <ul>{evidence.tests.map(test => <li key={test.test}><CheckCircle2 size={16} aria-hidden="true" /><span>{testCases[test.test]}<small>One {money(test.result.charged)} payment · {test.result.shown}</small></span></li>)}</ul>
        <p className="pro-muted">This is a prepared practice example. These actions belong to the sample investigator, not your personal attempt.</p>
      </aside>
      <div className="ai-demo-editor">
        {ready ? <ProTextReview demo attempt={attempt}
          onDraft={reviewDraft => setAttempt(current => ({ ...current, reviewDraft }))}
          onReview={textReview => setAttempt(current => ({ ...current, textReview }))} /> : <p role="status">Loading the sample report…</p>}
        {saveError && <p className="pro-error" role="alert">Your browser could not save this sample. Keep this page open to preserve your edits.</p>}
      </div>
    </div>
    <section className="ai-demo-next"><div><h2>Now make the decisions yourself.</h2><p>In the full Pro case, your actions change the outcome. Get feedback on both your decisions and your report.</p></div>
      <button className="mission-secondary" onClick={onPractice}>Explore Pro practice <ArrowRight size={16} /></button>
    </section>
  </main>;
}
