"use client";

import { useState } from "react";
import { ArrowRight, Check, ClipboardCheck, FlaskConical, History, Search, RotateCcw } from "lucide-react";
import ProTextReview from "./pro-text-review";
import {
  actOnAttempt, assessAttempt, fixes, money, replayAttempt, scenarios, startNext, submitAttempt, testCases,
  type Fix, type ProAction, type ProPractice, type ProReport, type TestCase,
} from "@/lib/shopflow/pro-case";

export default function ProCasePractice({ practice, onChange }: { practice: ProPractice; onChange: (next: ProPractice) => void }) {
  const [tab, setTab] = useState<"investigate" | "test" | "decide">("investigate");
  const [refund, setRefund] = useState("");
  const [error, setError] = useState("");
  const attempt = practice.current;
  const scenario = scenarios[attempt.scenario];
  const state = replayAttempt(attempt);
  const assessment = assessAttempt(attempt);
  const report = attempt.draft;
  function act(action: ProAction) {
    setError("");
    onChange({ ...practice, current: actOnAttempt(attempt, action) });
  }
  function draft(change: Partial<ProReport>) {
    onChange({ ...practice, current: { ...attempt, draft: { ...report, ...change } } });
  }
  const previous = [...practice.history].reverse().find(a => a.scenario === attempt.scenario);
  const priorScore = previous ? assessAttempt(previous).score : null;

  return (
    <section className="pro-practice" aria-label="Pro payment investigation">
      <header className="pro-case-heading">
        <div><span className="mission-kicker">PRO PRACTICE / QA & CUSTOMER RECOVERY</span>
          <h1>Checkout after a timeout</h1>
          <p>{scenario.order} · {money(scenario.cents)} order · {practice.history.length} saved attempts</p></div>
        <span className="pro-status">{attempt.report ? "Review complete" : "Release review in progress"}</span>
      </header>

      {!attempt.report ? <>
        <div className="pro-brief"><b>“Checkout said Failed. Should I pay again?”</b>
          <p>Investigate the customer's payment, recover the order and test a safer checkout before deciding whether to release. Actions change this simulated order; no real money moves.</p>
        </div>
        <nav className="pro-step-nav" aria-label="Case steps">
          <button aria-current={tab === "investigate" ? "step" : undefined} onClick={() => setTab("investigate")}><Search size={17} /> 1. Recover the order</button>
          <button aria-current={tab === "test" ? "step" : undefined} onClick={() => setTab("test")}><FlaskConical size={17} /> 2. Test a fix</button>
          <button aria-current={tab === "decide" ? "step" : undefined} onClick={() => setTab("decide")}><ClipboardCheck size={17} /> 3. Make the call</button>
        </nav>

        {tab === "investigate" && <div className="pro-case-grid">
          <section className="mission-pro-card">
            <span className="mission-kicker">CUSTOMER ORDER</span>
            <h2>{scenario.order}</h2>
            <dl className="pro-facts"><div><dt>Order value</dt><dd>{money(scenario.cents)}</dd></div>
              <div><dt>Original checkout message</dt><dd>Failed · connection timed out</dd></div>
              <div><dt>Fulfilment</dt><dd>{state.confirmed ? "Confirmed" : "Pending"}</dd></div></dl>
            <p>A failed screen does not tell you whether the payment request reached the provider.</p>
            <div className="pro-actions">
              <button className="mission-secondary" disabled={attempt.actions.length >= 100} onClick={() => act({ type: "inspect" })}><Search size={16} /> Check payment record</button>
              <button className="mission-secondary" disabled={attempt.actions.length >= 100} onClick={() => act({ type: "retry" })}>Retry payment · {money(scenario.cents)}</button>
              <button className="mission-secondary" disabled={state.confirmed || attempt.actions.length >= 100} onClick={() => act({ type: "confirm" })}>Confirm order for fulfilment</button>
            </div>
            {state.log.length > 0 && <p className="pro-action-receipt" role="status">{state.log[state.log.length - 1]}</p>}
            <details className="pro-refund"><summary>Issue a refund</summary><p>Enter only the amount you intend to return. Refunds also change the order balance.</p>
              <form onSubmit={event => {
                event.preventDefault();
                if (!/^\d+(\.\d{1,2})?$/.test(refund) || Number(refund) <= 0 || Number(refund) > 1000) { setError("Enter a refund from $0.01 to $1,000.00, with no more than two decimal places."); return; }
                const cents = Math.round(Number(refund) * 100);
                if (cents > state.net) { setError("That refund exceeds the current payment balance. Check the payment record."); return; }
                act({ type: "refund", cents }); setRefund("");
              }}><label>Refund amount ($)<input inputMode="decimal" value={refund} onChange={e => setRefund(e.target.value)} placeholder="0.00" /></label>
                <button className="mission-secondary" disabled={attempt.actions.length >= 100}>Issue refund</button></form>
            </details>
            {error && <p role="alert" className="pro-error">{error}</p>}
          </section>
          <section className="mission-pro-card">
            <span className="mission-kicker">PAYMENT SERVICE</span><h2>Transaction record</h2>
            {state.inspected ? <>
              <p>Original request: <b>{scenario.captured ? `${money(scenario.cents)} captured before the connection dropped.` : "Connection dropped before capture. No payment was taken."}</b></p>
              <ul className="pro-ledger">{state.ledger.length ? state.ledger.map((line, i) => <li key={i}>{line}</li>) : <li>No captured payments.</li>}</ul>
              <dl className="pro-facts"><div><dt>Total captured</dt><dd>{money(state.charged)}</dd></div><div><dt>Refunded</dt><dd>{money(state.refunded)}</dd></div><div><dt>Net payment</dt><dd>{money(state.net)}</dd></div></dl>
              <p className="pro-muted">Live record. Check the record again after a payment or refund before confirming fulfilment.</p>
            </> : <div className="pro-empty"><Search size={30} /><p>Look up the payment record to see whether a charge exists.</p></div>}
            <button className="mission-primary" onClick={() => setTab("test")}>Continue to regression tests <ArrowRight size={16} /></button>
          </section>
        </div>}

        {tab === "test" && <section className="mission-pro-card pro-test-panel">
          <div><span className="mission-kicker">CHECKOUT SANDBOX</span><h2>Choose a fix. Try to break it.</h2>
            <p>Each check starts with a fresh {money(scenario.cents)} test order. After a timeout, the selected policy handles the customer's retry. Sandbox charges do not change the customer order.</p></div>
          <fieldset className="pro-fix-options"><legend>Timeout recovery policy</legend>
            {(Object.keys(fixes) as Fix[]).map(fix => <label key={fix} className={state.fix === fix ? "selected" : ""}>
              <input type="radio" name="recovery-policy" checked={state.fix === fix} disabled={attempt.actions.length >= 100} onChange={() => act({ type: "fix", fix })} />{fixes[fix]}</label>)}
          </fieldset>
          <p className="pro-muted">Build {state.revision + 1} · Expected: exactly one {money(scenario.cents)} charge and a Paid confirmation.</p>
          <div className="pro-test-grid">{(Object.keys(testCases) as TestCase[]).map(test => {
            const last = [...state.tests].reverse().find(t => t.test === test && t.revision === state.revision);
            return <article key={test} className="pro-test-card"><h3>{testCases[test]}</h3>
              <button className="mission-secondary" disabled={attempt.actions.length >= 100} onClick={() => act({ type: "test", test })}>Run {testCases[test].toLowerCase()} test</button>
              {last ? <div role="status" className={last.result.passed ? "pro-test-pass" : "pro-test-fail"}>
                <b>{last.result.passed ? "Passed" : "Failed"}</b><p>{last.result.payments} payment{last.result.payments !== 1 ? "s" : ""} · {money(last.result.charged)} charged</p><p>Customer sees: {last.result.shown}</p>
              </div> : <p className="pro-muted">Not tested on this build</p>}</article>;
          })}</div>
          <p>{state.verifiedFix ? "All three checks pass on this build." : "Changing the fix requires new checks. You can still submit a release decision with incomplete evidence."}</p>
          <button className="mission-primary" onClick={() => setTab("decide")}>Prepare the handoff <ArrowRight size={16} /></button>
        </section>}

        {tab === "decide" && <form className="mission-pro-card pro-report" onSubmit={event => {
          event.preventDefault(); onChange({ ...practice, current: submitAttempt(attempt, report) });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}>
          <span className="mission-kicker">RELEASE HANDOFF</span><h2>Commit your decision</h2>
          <p>Your decision, payment actions and test evidence determine the result. You can submit an imperfect attempt and learn from it.</p>
          <div className="pro-report-fields">
            <label>What does the timeout tell us?<select value={report.cause} onChange={e => draft({ cause: e.target.value as ProReport["cause"] })}>
              <option value="unknown">I have not established the cause</option><option value="declined">The card was declined, so no payment occurred</option><option value="uncertain">The connection failed; payment status needs verification</option></select></label>
            <label>What happened to the original payment?<select value={report.evidence} onChange={e => draft({ evidence: e.target.value as ProReport["evidence"] })}>
              <option value="none">I have not verified the record</option><option value="paid">It was captured before the connection dropped</option><option value="unpaid">The connection dropped before any capture</option></select></label>
            <label>What should checkout do after a timeout?<select value={report.recommendation} onChange={e => draft({ recommendation: e.target.value as Fix })}>
              {(Object.keys(fixes) as Fix[]).map(fix => <option key={fix} value={fix}>{fixes[fix]}</option>)}</select></label>
            <label>Release decision<select value={report.decision} onChange={e => draft({ decision: e.target.value as ProReport["decision"] })}>
              <option value="hold">Hold release</option><option value="release">Approve release</option></select></label>
          </div>
          <label>Handoff note (optional)<textarea rows={3} maxLength={1600} placeholder="Describe what you found and any remaining blocker." value={report.note} onChange={e => draft({ note: e.target.value })} /></label>
          <p className="pro-muted">Your practice score uses recorded actions and selected claims. After submitting, you can request a separate AI review of your report's wording and evidence.</p>
          <button className="mission-primary" type="submit">Submit decision & see consequences <ArrowRight size={16} /></button>
        </form>}
        {attempt.actions.length >= 100 && <p role="status">This attempt has reached 100 actions. Submit your decision to review it and start a fresh attempt.</p>}
      </> : <>
        <div className="pro-result-hero"><div><span className="mission-kicker">YOUR RESULT</span><h2>{assessment.score}<small> / 100</small></h2>
          <p>{attempt.report.decision === "release" ? assessment.releaseSafe ? "Release approved with verified evidence" : "Release approved with unresolved risk" : "Release held"}</p></div>
          <div><b>Practice next: {assessment.nextSkill}</b><p>{priorScore === null ? "Your next attempt will be compared with this one." : `Previous attempt on this case: ${priorScore}/100. Change: ${assessment.score - priorScore >= 0 ? "+" : ""}${assessment.score - priorScore} points.`}</p></div></div>
        <div className="pro-consequences"><article><span>Excess customer charge</span><b>{money(state.excess)}</b></article><article><span>{state.confirmed ? "Unpaid fulfilment exposure" : "Payment still needed"}</span><b>{money(state.missing)}</b></article><article><span>Customer order</span><b>{state.resolved ? "Resolved" : state.confirmed ? "Balance needs review" : "Still pending"}</b></article></div>
        <div className="pro-findings">{assessment.findings.map(f => <article key={f.title} className={f.good ? "pro-finding good" : "pro-finding needs-work"}>
          <div><h3>{f.good && <Check size={18} />} {f.title}</h3><b>{f.good ? f.points : 0}/{f.points}</b></div><p>{f.detail}</p>{!f.good && <p className="pro-next"><b>Next time:</b> {f.next}</p>}</article>)}</div>
        {attempt.report.note && <blockquote className="pro-saved-note"><b>Your handoff note</b><p>{attempt.report.note}</p></blockquote>}
        <ProTextReview attempt={attempt}
          onDraft={reviewDraft => onChange({ ...practice, current: { ...attempt, reviewDraft } })}
          onReview={textReview => onChange({ ...practice, current: { ...attempt, textReview } })} />
        <div className="pro-next-actions"><button className="mission-primary" onClick={() => { onChange(startNext(practice, attempt.scenario)); setTab("investigate"); setError(""); setRefund(""); }}><RotateCcw size={16} /> Retry this case</button>
          <button className="mission-secondary" onClick={() => { onChange(startNext(practice, attempt.scenario === "captured" ? "interrupted" : "captured")); setTab("investigate"); setError(""); setRefund(""); }}>Try a different failure <ArrowRight size={16} /></button></div>
        <p className="pro-muted">A new attempt starts with a fresh order. Your last eight results stay on this device. Scores describe this practice task, not career aptitude.</p>
      </>}
      <details className="pro-history"><summary><History size={16} /> Action history ({state.log.length})</summary><ol>{state.log.map((line, i) => <li key={i}>{line}</li>)}</ol></details>
      {practice.history.length > 0 && <details className="pro-history"><summary>Previous attempts ({practice.history.length})</summary><ul>{practice.history.map((a, i) => {
        const result = assessAttempt(a); return <li key={i}><b>{scenarios[a.scenario].order} · {result.score}/100</b> · {a.report?.decision === "release" ? "Approved" : "Held"}<br />Next skill: {result.nextSkill}</li>;
      })}</ul></details>}
    </section>
  );
}
