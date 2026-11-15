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
  LoaderCircle,
  MessageSquare,
  RefreshCcw,
  Send,
  Sparkles,
  TicketCheck,
  XCircle,
} from "lucide-react";

type Phase =
  | "intro"
  | "support"
  | "ticket"
  | "ticket-sent"
  | "developer"
  | "choose-fix"
  | "fix-applied"
  | "qa"
  | "qa-decision"
  | "qa-approved"
  | "resolution"
  | "complete";

const storageKey = "careerverse-one-bug-mission";
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

export default function MissionExperience({ onHome, onLearn }: { onHome: () => void; onLearn: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [wrongFix, setWrongFix] = useState("");
  const [testStep, setTestStep] = useState(0);
  const [testing, setTesting] = useState(false);
  const [qaNote, setQaNote] = useState("");
  const [interest, setInterest] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey) as Phase | null;
    if (saved) setPhase(saved);
  }, []);
  useEffect(() => { window.localStorage.setItem(storageKey, phase); }, [phase]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [phase]);

  function reset() {
    setPhase("intro"); setWrongFix(""); setTestStep(0); setQaNote(""); setInterest("");
    window.localStorage.removeItem(storageKey);
  }
  async function runTest() {
    if (testing) return;
    setTesting(true); setQaNote("");
    for (let step = 1; step <= 3; step += 1) {
      await new Promise((resolve) => setTimeout(resolve, 520));
      setTestStep(step);
    }
    setTesting(false); setPhase("qa-decision");
  }

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
        <small>3–5 minutes · No technical experience needed</small>
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
          <Guidance role="Customer Support">{phase === "support" ? "A customer needs help. Create a ticket to report the issue." : phase === "ticket" ? "Check the details, then send the issue to the developer." : "You sent the right information to the developer."}</Guidance>
          <div className="helpdesk-grid">
            <aside className="helpdesk-inbox">
              <div className="tool-title"><MessageSquare size={17} /> Inbox <span>1</span></div>
              <button className="customer-thread active"><span className="customer-avatar">MB</span><span><b>Maya Brooks</b><small>Pay button does not work</small></span><i /></button>
            </aside>
            <article className="customer-chat">
              <header><span className="customer-avatar">MB</span><div><b>Maya Brooks</b><small>Customer · Online now</small></div><span className="open-status">Open</span></header>
              <div className="chat-date">Today, 10:14</div>
              <div className="customer-bubble">Hi! I’m trying to pay for my order, but the Pay button doesn’t do anything. Can you help?</div>
              {phase === "support" && <div className="focused-action"><span>Report this problem to the team</span><button className="mission-primary" onClick={() => setPhase("ticket")}><TicketCheck size={17} /> Create Ticket</button></div>}
              {phase === "ticket" && (
                <div className="ticket-form">
                  <div className="ticket-form-title"><TicketCheck size={18} /><b>New bug ticket</b><span>Ready to send</span></div>
                  <label>Issue<input readOnly value="Payment button not working" /></label>
                  <div className="ticket-fields"><label>Priority<input readOnly value="High" /></label><label>Assigned to<input readOnly value="Developer" /></label></div>
                  <button className="mission-primary" onClick={() => setPhase("ticket-sent")}>Send to Developer <Send size={17} /></button>
                </div>
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
          <Guidance role="a Software Developer">{phase === "developer" ? "Support sent you a bug. Accept the ticket to start working." : phase === "choose-fix" ? "Choose the fix that makes the payment button work." : "The code is fixed. Send it to QA for testing."}</Guidance>
          <div className="ide-window">
            <aside className="file-tree"><div className="ide-label">EXPLORER</div><b>SHOPFLOW</b><span>▾ src</span><span className="active"><FileCode2 size={14} /> Checkout.tsx</span><span><FileCode2 size={14} /> Payment.ts</span><span><FileCode2 size={14} /> App.tsx</span></aside>
            <article className="code-editor">
              <div className="editor-tab"><FileCode2 size={14} /> Checkout.tsx</div>
              <pre aria-label="Code editor"><code><span className="ln">12</span><span className="kw">function</span> Checkout() {"{"}{"\n"}<span className="ln">13</span>  <span className="kw">const</span> handlePayment = usePayment();{"\n"}<span className="ln">14</span>{"\n"}<span className={`code-problem ${phase === "fix-applied" ? "fixed" : ""}`}><span className="ln">15</span>  &lt;button {phase === "fix-applied" ? "onClick={handlePayment}" : ""}&gt;</span>{"\n"}<span className={`code-problem ${phase === "fix-applied" ? "fixed" : ""}`}><span className="ln">16</span>    Pay now</span>{"\n"}<span className={`code-problem ${phase === "fix-applied" ? "fixed" : ""}`}><span className="ln">17</span>  &lt;/button&gt;</span>{"\n"}<span className="ln">18</span>{"}"}</code></pre>
              {phase === "choose-fix" && <div className="fix-options"><span>Choose one fix</span><button onClick={() => setWrongFix("Changing the color will not start the payment. Try again.")}>A <b>Change the button color</b></button><button onClick={() => { setWrongFix(""); setPhase("fix-applied"); }}>B <b>Connect the button to the payment handler</b></button><button onClick={() => setWrongFix("Hiding the button removes payment completely. Try again.")}>C <b>Hide the payment button</b></button>{wrongFix && <p className="choice-feedback"><XCircle size={16} /> {wrongFix}</p>}</div>}
              {phase === "fix-applied" && <div className="fix-success"><CheckCircle2 size={19} /><b>Fix applied successfully</b></div>}
            </article>
            <aside className="dev-ticket">
              <span className="mission-kicker">BUG TICKET</span><h3>BUG-104</h3><p>Payment button not working</p>
              <dl><div><dt>Status</dt><dd className={phase === "fix-applied" ? "ready" : "open"}>{phase === "fix-applied" ? "Ready for Testing" : phase === "choose-fix" ? "In Progress" : "Open"}</dd></div><div><dt>Priority</dt><dd>High</dd></div><div><dt>From</dt><dd>Customer Support</dd></div></dl>
              <small>Customer reports that clicking the Pay button does nothing.</small>
              {phase === "developer" && <button className="mission-primary" onClick={() => setPhase("choose-fix")}>Accept Ticket <ArrowRight size={16} /></button>}
              {phase === "fix-applied" && <button className="mission-primary" onClick={() => setPhase("qa")}>Send to QA <Send size={16} /></button>}
            </aside>
          </div>
        </section>
      )}

      {["qa", "qa-decision", "qa-approved"].includes(phase) && (
        <section className="role-workspace qa-workspace">
          <Guidance role="a QA Tester">{phase === "qa" ? "The developer fixed the bug. Test the Pay button before approving it." : phase === "qa-decision" ? "The test is complete. Decide if the fix works." : "The fix works. Send your result back to Support."}</Guidance>
          <div className="qa-grid">
            <aside className="qa-ticket-card"><span className="mission-kicker">READY FOR TESTING</span><h3>BUG-104</h3><p>Payment button not working</p><div className="qa-meta"><span>Developer</span><b>Fix completed</b></div><div className="qa-meta"><span>Status</span><b>{phase === "qa-approved" ? "QA Approved" : "Ready for Testing"}</b></div></aside>
            <article className="browser-preview"><div className="browser-bar"><i /><i /><i /><span>shopflow.test/checkout</span></div><div className="checkout-card"><div className="plan-icon"><CreditCard size={24} /></div><span>YOUR ORDER</span><h2>Premium Plan</h2><strong>$19 <small>/ month</small></strong><button className="pay-button" disabled={testing || phase === "qa-approved"} onClick={runTest}>{testing ? <><LoaderCircle className="mission-spin" size={17} /> Processing…</> : phase === "qa" ? "Pay Now" : "Payment successful"}</button></div></article>
            <aside className="test-runner">
              <span className="mission-kicker">TEST RUN</span>
              {["Click Pay Now", "Payment processing", "Payment successful"].map((item, index) => <div className={testStep > index ? "passed" : testing && testStep === index ? "running" : ""} key={item}><span>{testStep > index ? <Check size={14} /> : index + 1}</span>{item}</div>)}
              {phase === "qa" && <button className="mission-primary" disabled={testing} onClick={runTest}>{testing ? "Running test…" : "Run Test"} <ArrowRight size={16} /></button>}
              {phase === "qa-decision" && <div className="qa-decision"><b>Does the fix work?</b><button className="mission-primary" onClick={() => { setQaNote(""); setPhase("qa-approved"); }}><Check size={16} /> Pass Test</button><button className="mission-secondary" onClick={() => setQaNote("If a problem remains, QA sends the ticket back to the developer. You can try the working result again here.")}><XCircle size={16} /> Report Issue</button>{qaNote && <p>{qaNote}</p>}</div>}
              {phase === "qa-approved" && <div className="qa-approved"><CheckCircle2 size={25} /><b>All tests passed</b><button className="mission-primary" onClick={() => setPhase("resolution")}>Send Result to Support <Send size={16} /></button></div>}
            </aside>
          </div>
        </section>
      )}

      {phase === "resolution" && (
        <section className="role-workspace support-workspace resolution-workspace">
          <Guidance role="Customer Support">The bug is fixed and tested. Let the customer know!</Guidance>
          <div className="resolution-grid">
            <article className="customer-chat"><header><span className="customer-avatar">MB</span><div><b>Maya Brooks</b><small>Customer</small></div><span className="open-status">Open</span></header><div className="customer-bubble">Hi! I’m trying to pay for my order, but the Pay button doesn’t do anything. Can you help?</div><div className="reply-draft"><span>READY TO SEND</span><p>Hi! Our team has fixed the payment issue. You can now complete your purchase. Thanks for your patience!</p></div><button className="mission-primary" onClick={() => setPhase("complete")}>Send Reply &amp; Close Ticket <Send size={16} /></button></article>
            <aside className="resolution-status"><span className="success-icon"><Check size={24} /></span><span className="mission-kicker">BUG-104</span><h2>Fixed &amp; Tested</h2><div><Code2 size={17} /><span>Developer<b>Fix completed</b></span><Check size={17} /></div><div><FlaskConical size={17} /><span>QA Tester<b>Tests passed</b></span><Check size={17} /></div></aside>
          </div>
        </section>
      )}

      {phase === "complete" && (
        <section className="mission-complete">
          <span className="complete-mark"><Check size={30} /></span><span className="mission-kicker">MISSION COMPLETE</span><h1>You just experienced how an IT team works.</h1><p>One problem. Three professions. One solution.</p>
          <div className="complete-roles"><article><Headphones size={22} /><h3>Customer Support</h3><p>You helped the customer and sent a clear issue to the team.</p></article><article><Code2 size={22} /><h3>Software Developer</h3><p>You found the right change and fixed the broken button.</p></article><article><FlaskConical size={22} /><h3>QA Tester</h3><p>You tested the fix before it reached the customer.</p></article></div>
          <div className="interest-choice"><b>Which role felt most interesting to you?</b><div>{["Customer Support", "Software Developer", "QA Tester"].map((role) => <button className={interest === role ? "selected" : ""} onClick={() => setInterest(role)} key={role}>{role}</button>)}</div>{interest && <p><Sparkles size={16} /> Great choice. You can explore a short {interest} course next.</p>}</div>
          <div className="complete-actions"><button className="mission-primary" onClick={onLearn}>Explore courses <ArrowRight size={17} /></button><button className="mission-secondary" onClick={reset}>Try again</button><button className="mission-text" onClick={onHome}>Back to Explore</button></div>
        </section>
      )}
    </main>
  );
}
