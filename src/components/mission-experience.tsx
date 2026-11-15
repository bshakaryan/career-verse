"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  CreditCard,
  FileCode2,
  FlaskConical,
  Headphones,
  MessageSquare,
  RefreshCcw,
  Send,
  Sparkles,
  TicketCheck,
} from "lucide-react";
import type { CourseId } from "./mission-courses";
import {
  defaultHandoff, initialMission, readMission, simulateCheckout, ticketDefaults,
  type MissionState, type Phase, type TestCase,
} from "@/lib/shopflow/mission";

const storageKey = "careerverse-one-bug-mission";
const starterRoles = [
  { id: "support", label: "Customer Support" },
  { id: "developer", label: "Software Developer" },
  { id: "qa", label: "QA Tester" },
] as const;
const checkoutTests = {
  single: { label: "Single click", expected: "1 payment starts" },
  repeat: { label: "Rapid double-click", expected: "1 payment starts" },
  retry: { label: "Retry after decline", expected: "1 successful retry" },
};
const roleSteps = [
  { label: "Support", icon: Headphones },
  { label: "Developer", icon: Code2 },
  { label: "QA", icon: FlaskConical },
  { label: "Resolution", icon: CheckCircle2 },
];

function stepFor(phase: Phase) {
  if (["support", "ticket", "ticket-sent"].includes(phase)) return 0;
  if (["developer", "choose-fix", "fix-applied"].includes(phase)) return 1;
  if (["qa", "qa-decision", "qa-approved"].includes(phase)) return 2;
  if (["resolution", "complete"].includes(phase)) return 3;
  return -1;
}

function Guidance({ role, children }: { role: string; children: ReactNode }) {
  return (
    <div className="mission-guidance">
      <Sparkles size={17} />
      <div><b>You are {role}.</b><span>{children}</span></div>
    </div>
  );
}

function Progress({ phase }: { phase: Phase }) {
  const active = stepFor(phase);
  return (
    <div className="mission-progress" aria-label="Mission progress">
      {roleSteps.map((step, index) => {
        const Icon = step.icon;
        return (
          <div className={`${index === active ? "active" : ""} ${index < active ? "done" : ""}`} key={step.label}>
            <span>{index < active ? <Check size={14} /> : <Icon size={15} />}</span>
            <b>{step.label}</b>
            {index < roleSteps.length - 1 && <i />}
          </div>
        );
      })}
    </div>
  );
}

export default function MissionExperience({ onHome, onLearn }: { onHome: () => void; onLearn: (course?: CourseId) => void }) {
  const [mission, setMission] = useState<MissionState>(initialMission);
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [file, setFile] = useState<"checkout" | "payment">("checkout");
  const [testCase, setTestCase] = useState<TestCase>("single");
  const [declined, setDeclined] = useState(false);
  const [interest, setInterest] = useState<CourseId>();
  const { phase, asked, ticket, reproduced, patch, previewPassed, qaReported, qaResults, handoff, reply } = mission;
  const activeRole = stepFor(phase);
  const requiredTests: TestCase[] = patch === "guarded" ? ["single", "repeat", "retry"] : ["single", "repeat"];
  const allTestsRun = requiredTests.every((test) => qaResults[test] !== undefined);
  const allTestsPassed = requiredTests.every((test) => qaResults[test] === 1);

  function update(change: Partial<MissionState>) {
    setMission((current) => ({ ...current, ...change }));
  }

  function setPhase(next: Phase) {
    setFeedback("");
    update({ phase: next });
  }

  useEffect(() => {
    try {
      setMission(readMission(window.localStorage.getItem(storageKey)));
    } catch {
      // The mission still works when the browser blocks storage.
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(mission));
    } catch {
      // Keep the current session playable if storage is unavailable.
    }
  }, [loaded, mission]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [activeRole]);

  function reset() {
    setMission(initialMission);
    setFeedback("");
    setInterest(undefined);
    setFile("checkout");
    setTestCase("single");
    setDeclined(false);
  }
  function runTest() {
    if (testCase === "retry" && !declined) {
      setDeclined(true);
      return;
    }
    const result = simulateCheckout(patch, testCase === "retry" ? "single" : testCase);
    const qaResults = { ...mission.qaResults, [testCase]: result };
    setDeclined(false);
    setFeedback("");
    update({
      qaResults,
      phase: requiredTests.every((test) => qaResults[test] !== undefined) ? "qa-decision" : "qa",
    });
  }

  if (!loaded) return <main className="mission-intro" aria-busy="true">Opening your mission…</main>;

  if (phase === "intro") return (
    <main className="mission-intro">
      <div className="mission-intro-card">
        <span className="mission-kicker">ONE BUG · THREE ROLES · ONE MISSION</span>
        <h1>A real problem.<br /><em>A real workflow.</em></h1>
        <p>A customer cannot pay for an order. Try three IT roles and help the team solve the problem.</p>
        <div className="mission-role-chain">
          {roleSteps.slice(0, 3).map((role, index) => {
            const Icon = role.icon;
            const name = role.label === "QA" ? "QA Tester" : role.label === "Support" ? "Customer Support" : "Software Developer";
            return <div key={role.label}><span><Icon size={22} /></span><b>{name}</b>{index < 2 && <ArrowRight className="mission-chain-arrow" size={18} />}</div>;
          })}
        </div>
        <div className="mission-reassurance"><Sparkles size={17} />Don’t worry if you have never worked in IT. We will guide you at every step.</div>
        <button className="mission-primary mission-large" onClick={() => setPhase("support")}>Start Mission <ArrowRight size={18} /></button>
        <small>No technical experience needed</small>
      </div>
    </main>
  );

  return (
    <main className={`mission-shell phase-${stepFor(phase)}`}>
      <header className="mission-header">
        <div><span className="mission-kicker">ONE BUG · THREE ROLES · ONE MISSION</span><h1>BUG-104 · Payment button</h1></div>
        <Progress phase={phase} />
        <button className="mission-reset" onClick={reset} aria-label="Restart mission"><RefreshCcw size={15} /> Restart</button>
      </header>

      {["support", "ticket", "ticket-sent"].includes(phase) && (
        <section className="role-workspace support-workspace">
          <Guidance role="Customer Support">
            {phase === "ticket-sent" ? "The developer has your ticket and the customer’s details."
              : phase === "ticket" ? "Summarize what happened and set the priority."
              : asked ? "Use Maya’s reply to create a ticket."
              : "Ask Maya what she sees when she clicks Pay Now."}
          </Guidance>
          <div className="helpdesk-grid">
            <aside className="helpdesk-inbox">
              <div className="tool-title"><MessageSquare size={17} /> Inbox <span>1</span></div>
              <div className="customer-thread active"><span className="customer-avatar">MB</span><span><b>Maya Brooks</b><small>Pay button does not work</small></span><i /></div>
            </aside>
            <article className="customer-chat">
              <header><span className="customer-avatar">MB</span><div><b>Maya Brooks</b><small>Customer · Online now</small></div><span className="open-status">Open</span></header>
              <div className="chat-date">Today, 10:14</div>
              <div className="customer-bubble">Hi! I’m trying to pay for my order, but the Pay button doesn’t do anything. Can you help?</div>
              {asked && (
                <>
                  <p className="mission-chat-reply">What do you see after you click Pay Now?</p>
                  <p className="customer-bubble mission-chat-detail" role="status">
                    Nothing happens on the Premium Plan checkout. There’s no message, even after I refresh.
                  </p>
                </>
              )}
              {phase === "support" && (
                <div className="focused-action">
                  {asked ? (
                    <button className="mission-primary" onClick={() => {
                      update({ phase: "ticket", ticket: { ...ticketDefaults, priority: "" } });
                    }}><TicketCheck size={17} /> Create Ticket</button>
                  ) : (
                    <button className="mission-primary" onClick={() => update({ asked: true })}>
                      Ask what happened <MessageSquare size={16} />
                    </button>
                  )}
                </div>
              )}
              {phase === "ticket" && (
                <form className="ticket-form" onSubmit={(event) => {
                  event.preventDefault();
                  if (!ticket.summary.trim() || !ticket.evidence.trim() || !ticket.expected.trim()) {
                    setFeedback("Add a title, what happened and what should happen.");
                  } else if (ticket.priority !== "High") {
                    setFeedback("Choose High because the customer cannot complete their purchase.");
                  } else {
                    setPhase("ticket-sent");
                  }
                }}>
                  <div className="ticket-form-title"><TicketCheck size={18} /><b>New ticket · BUG-104</b></div>
                  <label>Issue
                    <input required maxLength={100} value={ticket.summary}
                      onChange={(event) => update({ ticket: { ...ticket, summary: event.target.value } })} />
                  </label>
                  <label>What happened
                    <textarea required rows={2} maxLength={240} value={ticket.evidence}
                      onChange={(event) => update({ ticket: { ...ticket, evidence: event.target.value } })} />
                  </label>
                  <label>What should happen
                    <input required maxLength={160} value={ticket.expected}
                      onChange={(event) => update({ ticket: { ...ticket, expected: event.target.value } })} />
                  </label>
                  <div className="ticket-fields">
                    <label>Priority
                      <select required value={ticket.priority} onChange={(event) => {
                        const priority = event.target.value === "High" ? "High" : "Low";
                        update({ ticket: { ...ticket, priority } });
                        setFeedback("");
                      }}>
                        <option value="" disabled>Choose priority</option>
                        <option value="Low">Low · Can still pay</option>
                        <option value="High">High · Cannot pay</option>
                      </select>
                    </label>
                    <label>Assigned to<input readOnly value="Developer" /></label>
                  </div>
                  {feedback && <p className="mission-feedback" role="status">{feedback}</p>}
                  <button className="mission-primary" type="submit">Send to Developer <Send size={17} /></button>
                </form>
              )}
              {phase === "ticket-sent" && (
                <div className="handoff-success"><span className="success-icon"><Check size={25} /></span><div><b>Ticket sent!</b><p>You registered the problem and sent it to the person who can fix the code.</p></div><button className="mission-primary" onClick={() => setPhase("developer")}>Continue as Developer <ArrowRight size={17} /></button></div>
              )}
            </article>
          </div>
        </section>
      )}

      {["developer", "choose-fix", "fix-applied"].includes(phase) && (
        <section className="role-workspace developer-workspace">
          <Guidance role="a Software Developer">
            {phase === "developer" ? "Try the checkout to see what Maya reported."
              : phase === "fix-applied" ? (previewPassed ? "Tell QA what changed and what to check." : "Try your change in preview before sending it to QA.")
              : qaReported ? "QA found two payment attempts. Stop the second click while the first payment runs."
              : "Compare the checkout button with the payment file. What should happen when you click?"}
          </Guidance>
          <div className="ide-window">
            <aside className="file-tree" aria-label="Project files">
              <div className="ide-label">EXPLORER</div>
              <b>SHOPFLOW / src</b>
              <button aria-pressed={file === "checkout"} onClick={() => setFile("checkout")}>
                <FileCode2 size={14} /> Checkout.tsx
              </button>
              <button aria-pressed={file === "payment"} onClick={() => setFile("payment")}>
                <FileCode2 size={14} /> Payment.ts
              </button>
            </aside>
            <article className="code-editor">
              <div className="editor-tab"><FileCode2 size={14} /> {file === "checkout" ? "Checkout.tsx" : "Payment.ts"}</div>
              {file === "checkout" ? (
                <pre aria-label="Checkout source"><code>
                  {"function Checkout() {\n  const { pay, processing } = usePayment();\n\n  return (\n"}
                  <span className={patch === "missing" ? "code-problem" : "code-problem fixed"}>
                    {patch === "missing" ? "    <button>Pay Now</button>"
                      : patch === "connected" ? "    <button onClick={pay}>Pay Now</button>"
                      : "    <button onClick={pay} disabled={processing}>Pay Now</button>"}
                  </span>
                  {"\n  );\n}"}
                </code></pre>
              ) : (
                <pre aria-label="Payment source"><code>
                  {"function usePayment() {\n  // pay starts a payment.\n  // processing is true while it runs.\n  return { pay, processing };\n}"}
                </code></pre>
              )}
              {phase === "choose-fix" && (
                <div className="fix-options mission-fixes">
                  <span>Choose a change</span>
                  <button onClick={() => setFeedback("The color does not change what the button does. Look for a change that affects clicks.")}>
                    Change the button color
                  </button>
                  <button onClick={() => {
                    if (qaReported) {
                      setFeedback("The button already starts a payment. The second click also needs to be blocked.");
                      return;
                    }
                    setFile("checkout");
                    setFeedback("The button now calls pay. Run a preview to check it.");
                    update({
                      patch: "connected",
                      handoff: defaultHandoff("connected"),
                      phase: "fix-applied",
                    });
                  }}>Connect Pay Now to the payment action</button>
                  <button onClick={() => {
                    if (!qaReported) {
                      setFeedback("Start by connecting the Pay button. Blocking extra clicks alone will not start a payment.");
                      return;
                    }
                    setFile("checkout");
                    setFeedback("The button is now disabled while the payment runs.");
                    update({
                      patch: "guarded",
                      handoff: defaultHandoff("guarded"),
                      phase: "fix-applied",
                    });
                  }}>Disable Pay Now while a payment runs</button>
                </div>
              )}
              {feedback && <p className="mission-editor-feedback" role="status">{feedback}</p>}
            </article>
            <aside className="dev-ticket">
              <span className="mission-kicker">BUG-104</span>
              <h3>{ticket.summary}</h3>
              <dl>
                <div><dt>Status</dt><dd>{phase === "developer" ? "Open" : phase === "fix-applied" && previewPassed ? "Ready for Testing" : "In Progress"}</dd></div>
                <div><dt>Priority</dt><dd>{ticket.priority}</dd></div>
              </dl>
              <small><strong>What happened</strong><br />{ticket.evidence}</small>
              <small><strong>What should happen</strong><br />{ticket.expected}</small>
              {qaReported && <p className="mission-feedback">QA report · Rapid double-click started 2 payments. Expected 1.</p>}
              {phase === "developer" && (
                reproduced ? (
                  <>
                    <p className="mission-feedback">Reproduced · 0 payments started.</p>
                    <button className="mission-primary" onClick={() => setPhase("choose-fix")}>Inspect the code</button>
                  </>
                ) : (
                  <button className="mission-primary" onClick={() => {
                    const attempts = simulateCheckout(patch, "single");
                    update({ reproduced: attempts === 0 });
                  }}>Try Pay Now</button>
                )
              )}
              {phase === "fix-applied" && (
                previewPassed ? (
                  <>
                    <p className="mission-feedback">Preview · 1 payment started.</p>
                    <form className="mission-handoff-form" onSubmit={(event) => {
                      event.preventDefault();
                      if (!handoff.trim()) return;
                      setTestCase("single");
                      setDeclined(false);
                      setPhase("qa");
                    }}>
                      <label>Note for QA
                        <textarea required rows={4} maxLength={240} value={handoff}
                          onChange={(event) => update({ handoff: event.target.value })} />
                      </label>
                      <button className="mission-primary" type="submit" disabled={!handoff.trim()}>
                        Send to QA <Send size={16} />
                      </button>
                    </form>
                  </>
                ) : (
                  <button className="mission-primary" onClick={() => {
                    update({ previewPassed: simulateCheckout(patch, "single") === 1 });
                    setFeedback("");
                  }}>Run checkout preview</button>
                )
              )}
            </aside>
          </div>
        </section>
      )}

      {["qa", "qa-decision", "qa-approved"].includes(phase) && (
        <section className="role-workspace qa-workspace">
          <Guidance role="a QA Tester">
            {phase === "qa-approved" ? "Share the approved test results with Support."
              : allTestsPassed ? "The checkout passed every test. Review the results and approve the fix."
              : allTestsRun ? "Compare expected and actual results. Send the failing case back to the developer."
              : patch === "guarded" ? "Check normal and rapid clicks again. Then try paying after a decline."
              : "Try a normal payment and two fast clicks. Each test should start just one payment."}
          </Guidance>
          <div className="qa-grid">
            <aside className="qa-ticket-card">
              <span className="mission-kicker">BUG-104</span>
              <h3>{ticket.summary}</h3>
              <p>{ticket.evidence}</p>
              <div className="qa-meta"><span>Expected checkout behavior</span><b>{ticket.expected}</b></div>
              {handoff && <div className="qa-meta"><span>Developer note</span><b>{handoff}</b></div>}
              <div className="qa-meta"><span>Build</span><b>{patch === "guarded" ? "2 · Button locks during payment" : "1 · Button starts payment"}</b></div>
              <div className="qa-meta"><span>Status</span><b>{phase === "qa-approved" ? "QA Approved" : "Ready for Testing"}</b></div>
            </aside>
            <article className="browser-preview">
              <div className="browser-bar"><i /><i /><i /><span>shopflow.test/checkout · Test mode</span></div>
              <div className="checkout-card">
                <div className="plan-icon"><CreditCard size={24} /></div>
                <h2>Premium Plan</h2>
                <strong>$19 <small>/ month</small></strong>
                {phase !== "qa-approved" && (testCase !== "retry" || qaResults.retry === undefined) && (
                  <button className="pay-button" onClick={runTest}>
                    {testCase === "single" ? "Pay Now"
                      : testCase === "repeat" ? "Simulate two quick clicks"
                      : declined ? "Retry with approved test card" : "Pay with declined test card"}
                  </button>
                )}
                <p className="mission-test-output" role="status">
                  {testCase === "retry" && declined ? "Payment declined. No charge. You can try again."
                    : qaResults[testCase] === undefined
                    ? "No payment attempted in this test."
                    : testCase === "retry" ? (qaResults.retry === 1 ? "Retry successful · 1 payment" : "Retry failed · No payment")
                    : `Payments started: ${qaResults[testCase]}`}
                </p>
              </div>
            </article>
            <aside className="test-runner">
              <span className="mission-kicker">CHECKOUT TESTS</span>
              <ul className="mission-test-list">
                {requiredTests.map((id) => {
                  const actual = qaResults[id];
                  const test = checkoutTests[id];
                  return (
                    <li key={id}>
                      <button className="mission-secondary" aria-pressed={testCase === id} onClick={() => setTestCase(id)}>
                        {test.label}
                      </button>
                      <p>Expected · {test.expected}</p>
                      <p className={actual === undefined ? "" : actual === 1 ? "test-pass" : "test-fail"}>
                        {actual === undefined ? "Not run" : `Actual · ${actual} · ${actual === 1 ? "Passed" : "Failed"}`}
                      </p>
                    </li>
                  );
                })}
              </ul>
              {phase !== "qa-approved" && allTestsRun && (
                allTestsPassed ? (
                  <button className="mission-primary" onClick={() => setPhase("qa-approved")}>Approve fix <Check size={16} /></button>
                ) : (
                  <button className="mission-primary" onClick={() => {
                    setFile("checkout");
                    setFeedback("");
                    update({ qaReported: true, phase: "choose-fix", previewPassed: false, qaResults: {} });
                  }}>Report issue to Developer <Send size={16} /></button>
                )
              )}
              {phase === "qa-approved" && (
                <button className="mission-primary" onClick={() => setPhase("resolution")}>Send Result to Support <Send size={16} /></button>
              )}
            </aside>
          </div>
        </section>
      )}

      {phase === "resolution" && (
        <section className="role-workspace support-workspace resolution-workspace">
          <Guidance role="Customer Support">The bug is fixed and tested. Let the customer know!</Guidance>
          <div className="resolution-grid">
            <article className="customer-chat">
              <header>
                <span className="customer-avatar">MB</span>
                <div><b>Maya Brooks</b><small>Customer</small></div>
                <span className="open-status">Open</span>
              </header>
              <div className="customer-bubble">
                Hi! I’m trying to pay for my order, but the Pay button doesn’t do anything. Can you help?
              </div>
              <form className="reply-draft mission-reply-form" onSubmit={(event) => {
                event.preventDefault();
                if (reply.trim()) setPhase("complete");
              }}>
                <label>Reply to Maya
                  <textarea required rows={3} maxLength={320} value={reply}
                    onChange={(event) => update({ reply: event.target.value })} />
                </label>
                <button className="mission-primary" type="submit" disabled={!reply.trim()}>
                  Send Reply &amp; Close Ticket <Send size={16} />
                </button>
              </form>
            </article>
            <aside className="resolution-status">
              <span className="success-icon"><Check size={24} /></span>
              <span className="mission-kicker">BUG-104</span>
              <h2>Fixed &amp; Tested</h2>
              <div><Code2 size={17} /><span>Developer<b>Fix completed</b></span><Check size={17} /></div>
              <div><FlaskConical size={17} /><span>QA Tester<b>{qaResults.retry === 1 ? "Normal, double-click and retry tests passed" : "Tests passed"}</b></span><Check size={17} /></div>
            </aside>
          </div>
        </section>
      )}

      {phase === "complete" && (
        <section className="mission-complete">
          <span className="complete-mark"><Check size={30} /></span><span className="mission-kicker">MISSION COMPLETE</span><h1>You just experienced how an IT team works.</h1><p>Reply sent to Maya · BUG-104 resolved</p>
          <div className="complete-roles"><article><Headphones size={22} /><h3>Customer Support</h3><p>You helped the customer and sent a clear issue to the team.</p></article><article><Code2 size={22} /><h3>Software Developer</h3><p>You found the right change and fixed the broken button.</p></article><article><FlaskConical size={22} /><h3>QA Tester</h3><p>You tested the fix before it reached the customer.</p></article></div>
          <div className="interest-choice">
            <b>Which role would you like to explore?</b>
            <div>{starterRoles.map((role) => (
              <button
                className={interest === role.id ? "selected" : ""}
                aria-pressed={interest === role.id}
                onClick={() => setInterest(role.id)}
                key={role.id}
              >{role.label}</button>
            ))}</div>
          </div>
          <div className="complete-actions">
            <button className="mission-primary" onClick={() => onLearn(interest)}>
              {interest ? "Start your first lesson" : "Explore courses"} <ArrowRight size={17} />
            </button>
            <button className="mission-secondary" onClick={reset}>Try again</button>
            <button className="mission-text" onClick={onHome}>Back to Explore</button>
          </div>
        </section>
      )}
    </main>
  );
}
