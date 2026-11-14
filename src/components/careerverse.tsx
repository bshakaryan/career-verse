"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  MessageSquare,
  LayoutDashboard,
  Compass,
  Flag,
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Download,
  Sparkles,
  X,
  Target,
  LoaderCircle,
} from "lucide-react";
import {
  colleagues,
  criteria,
  fields,
  scenario,
  twist,
  type Colleague,
} from "@/lib/scenario";
import { emptyPlan, planSchema, type Plan, type Session } from "@/lib/types";
import { transport } from "@/lib/transport";
import CareerCatalog from "./career-catalog";
type Capabilities = { ai: boolean; storage: boolean; persistent: boolean };
type Payload = {
  session: Session | null;
  capabilities: Capabilities;
  error?: string;
};
type Tab = "brief" | "tasks" | "alex" | "morgan";
export default function CareerVerse() {
  const [view, setView] = useState<"catalog" | "practice">("catalog");
  useEffect(() => {
    const syncView = () =>
      setView(window.location.hash === "#practice" ? "practice" : "catalog");
    syncView();
    window.addEventListener("hashchange", syncView);
    return () => window.removeEventListener("hashchange", syncView);
  }, []);
  function navigate(next: "catalog" | "practice") {
    window.location.hash = next === "practice" ? "practice" : "careers";
    setView(next);
    window.scrollTo({ top: 0 });
  }
  const [session, setSession] = useState<Session | null>(null);
  const [caps, setCaps] = useState<Capabilities>({
    ai: false,
    storage: true,
    persistent: false,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("brief");
  const [plan, setPlan] = useState<Plan>({ ...emptyPlan });
  const [chat, setChat] = useState("");
  const [saved, setSaved] = useState("All changes saved");
  const [reset, setReset] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"context" | "plan">("context");
  const sessionRef = useRef<Session | null>(null);
  const planRef = useRef(plan);
  const busyRef = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(false);
  function apply(data: Payload, replacePlan = false) {
    setCaps(data.capabilities);
    sessionRef.current = data.session;
    setSession(data.session);
    if (replacePlan && data.session) {
      planRef.current = data.session.draft;
      setPlan(data.session.draft);
    }
  }
  useEffect(() => {
    mounted.current = true;
    transport()
      .then((data: Payload) => {
        if (data.error) throw new Error(data.error);
        apply(data, true);
        if (data.session && data.session.stage !== "review") {
          try {
            const local = JSON.parse(
              localStorage.getItem("cv-draft-" + data.session.id) || "null",
            );
            if (
              local?.revision >= data.session.revision &&
              planSchema.safeParse(local?.plan).success
            ) {
              planRef.current = local.plan;
              setPlan(local.plan);
              setSaved("Recovered local draft");
            }
          } catch {}
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    return () => {
      mounted.current = false;
    };
  }, []);
  async function request(
    action: string,
    extra: Record<string, unknown> = {},
    replacePlan = false,
  ) {
    const run = async () => {
      const current = sessionRef.current;
      let data: Payload;
      try {
        data = await transport(action, {
          revision: current?.revision,
          ...extra,
        });
      } catch (e) {
        if ((e as Error & { status?: number }).status === 409) {
          apply(await transport());
          setSaved("Local draft kept — save again to sync");
        }
        throw e;
      }
      apply(data, replacePlan);
      return data;
    };
    const operation = queue.current.then(run, run);
    queue.current = operation.catch(() => {});
    return operation;
  }
  async function act(
    action: string,
    extra: Record<string, unknown> = {},
    replacePlan = false,
  ) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await request(action, extra, replacePlan);
      if (action === "reveal") {
        setSaved("All changes saved");
        setShowUpdate(true);
        setMobilePanel("context");
      }
      if (action === "reset") {
        if (sessionRef.current === null && session)
          localStorage.removeItem("cv-draft-" + session.id);
        setReset(false);
        navigate("catalog");
        setTab("brief");
        setPlan({ ...emptyPlan });
        planRef.current = { ...emptyPlan };
      }
      if (action === "chat") setChat("");
      if (action === "submit") {
        setSaved("All changes saved");
      }
      if (action === "submit") window.scrollTo({ top: 0, behavior: "smooth" });
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
      if (action === "submit" || action === "retry") {
        try {
          const data = await transport();
          if (!data.error) apply(data);
        } catch {}
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!reset && !showUpdate) return;
    const dialog = document.querySelector<HTMLElement>("[role=dialog]");
    const previous = document.activeElement as HTMLElement | null;
    function handle(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setReset(false);
        setShowUpdate(false);
      }
      if (event.key === "Tab" && dialog) {
        const nodes = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input, [tabindex="0"]',
          ),
        );
        if (!nodes.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [reset, showUpdate]);
  function edit(key: keyof Plan, value: string) {
    const next = { ...planRef.current, [key]: value };
    planRef.current = next;
    setPlan(next);
    setSaved("Unsaved changes");
    if (sessionRef.current) {
      try {
        localStorage.setItem(
          "cv-draft-" + sessionRef.current.id,
          JSON.stringify({ revision: sessionRef.current.revision, plan: next }),
        );
      } catch {
        setSaved("Browser storage unavailable — keep this tab open");
      }
    }
  }
  useEffect(() => {
    if (loading || !session || session.stage === "review" || busy) return;
    if (JSON.stringify(plan) === JSON.stringify(session.draft)) return;
    const timer = setTimeout(() => {
      setSaved("Saving…");
      request("save", { plan })
        .then(() => {
          setSaved("All changes saved");
          const s = sessionRef.current;
          if (s) {
            try {
              localStorage.setItem(
                "cv-draft-" + s.id,
                JSON.stringify({ revision: s.revision, plan: planRef.current }),
              );
            } catch {}
          }
        })
        .catch((e) => {
          setSaved("Saved in this browser · sync failed");
          setError(e.message);
        });
    }, 900);
    return () => clearTimeout(timer);
  }, [plan, loading, busy, session?.stage, session?.id]);
  function download() {
    if (!session) return;
    const payload = {
      product: "CareerVerse",
      scenario: scenario.id,
      exportedAt: new Date().toISOString(),
      initialPlan: session.initialPlan,
      attempts: session.attempts,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "careerverse-work-record.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  const isReview = session?.stage === "review";
  const who = tab === "alex" || tab === "morgan" ? tab : null;
  const last = session?.attempts.at(-1);
  const previous = session?.attempts.at(-2);
  const done = fields.filter((f) => plan[f.id].trim()).length;
  const logo = (
    <span className="brand">
      <span className="brand-icon">
        <Compass size={23} />
      </span>
      careerverse<span className="brand-dot">.</span>
    </span>
  );
  if (loading)
    return (
      <main className="loading">
        {logo}
        <LoaderCircle className="spin" />
        <p>Preparing your workspace…</p>
      </main>
    );
  return (
    <>
      <div hidden={view !== "catalog" && !!session}>
        <CareerCatalog
          active={view === "catalog" || !session}
          hasSession={!!session}
          busy={busy}
          canStart={caps.storage}
          ai={caps.ai}
          error={error}
          onStart={async () => {
            if (!sessionRef.current) {
              const result = await act("start", {}, true);
              if (!result?.session) return false;
            }
            navigate("practice");
            return true;
          }}
        />
      </div>
      {view === "practice" && session && (
        <header className="topbar">
          <button
            className="brand-button"
            onClick={() => {
              navigate("catalog");
            }}
            aria-label="CareerVerse home"
          >
            {logo}
          </button>
          <nav>
            <span className="breadcrumb">
              My workspace <ChevronRight size={14} /> Project Management
            </span>
          </nav>
          <div className="top-actions">
            <button
              className="workspace-home"
              onClick={() => navigate("catalog")}
            >
              All careers
            </button>
            <span className="mode-pill">
              <span className={caps.ai ? "live-dot" : "preview-dot"} />
              {caps.ai ? "AI connected" : "Practice preview"}
            </span>
            {session && (
              <button
                className="avatar user-avatar"
                aria-label="Your guest workspace"
              >
                You
              </button>
            )}
          </div>
        </header>
      )}
      {error && (
        <div className="error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            className="icon-button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}
      {view === "practice" && session && (
        <main className="workspace">
          <aside className="sidebar">
            <span className="section-kicker">YOUR WORKSPACE</span>
            <div className="company">
              <span className="company-icon">N</span>
              <div>
                <strong>Northstar</strong>
                <small>Project Management</small>
              </div>
            </div>
            <div className="sidebar-divider" />
            <span className="section-kicker">PROJECT RESOURCES</span>
            <button
              className={`side-link ${tab === "brief" && !isReview ? "active" : ""}`}
              onClick={() => {
                setTab("brief");
                setMobilePanel("context");
              }}
              disabled={isReview}
            >
              <FileText size={18} />
              Project brief
            </button>
            <button
              className={`side-link ${tab === "tasks" && !isReview ? "active" : ""}`}
              onClick={() => {
                setTab("tasks");
                setMobilePanel("context");
              }}
              disabled={isReview}
            >
              <LayoutDashboard size={18} />
              Task board<span className="count">5</span>
            </button>
            <span className="section-kicker team-label">YOUR TEAM</span>
            {(Object.keys(colleagues) as Colleague[]).map((key) => (
              <button
                key={key}
                className={`person-link ${tab === key && !isReview ? "active" : ""}`}
                onClick={() => {
                  setTab(key);
                  setMobilePanel("context");
                }}
                disabled={isReview}
              >
                <span className={`avatar ${colleagues[key].color}`}>
                  {colleagues[key].initials}
                </span>
                <span>
                  <strong>{colleagues[key].name}</strong>
                  <small>{colleagues[key].role}</small>
                </span>
                <span className="small-dot" />
              </button>
            ))}
            <div className="sidebar-bottom">
              <div className="practice-note">
                <Sparkles size={16} />
                <strong>
                  {caps.ai ? "A space to practice" : "Practice preview"}
                </strong>
                <p>
                  {caps.ai
                    ? "Ask questions. Try a decision. You can always improve your plan."
                    : "Prepared colleague notes and guided self-review. No live AI responses."}
                </p>
              </div>
              <button
                className="text-button muted"
                onClick={() => setReset(true)}
              >
                <RotateCcw size={14} />
                Start over
              </button>
            </div>
          </aside>
          <div className="workspace-body">
            <div className="workspace-heading">
              <div>
                <span className="eyebrow">
                  SIMULATION 001 <span>/</span> FIRST WEEK ON THE JOB
                </span>
                <h1>
                  {isReview
                    ? "Make your next attempt stronger."
                    : scenario.title}
                </h1>
                <p>
                  {isReview
                    ? "Take a moment to reflect. Good project management is a practice."
                    : scenario.subtitle}
                </p>
              </div>
              <span className="time-badge">
                <Clock3 size={15} />
                20–30 min
              </span>
            </div>
            <div className="progress-track">
              {[
                "Explore the project",
                "Make your plan",
                "Adapt & submit",
                "Reflect & improve",
              ].map((label, i) => {
                const stage = isReview
                  ? 3
                  : session.stage === "adapt"
                    ? 2
                    : done > 0
                      ? 1
                      : 0;
                return (
                  <div
                    key={label}
                    className={
                      i === stage ? "current" : i < stage ? "complete" : ""
                    }
                  >
                    <span>
                      {i < stage ? (
                        <Check size={12} />
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    {label}
                  </div>
                );
              })}
            </div>
            {isReview && last ? (
              <section className="review">
                <div className="review-top">
                  <div className="review-icon">
                    <Flag size={26} />
                  </div>
                  <div>
                    <span className="section-kicker">
                      ATTEMPT {session.attempts.length} ·{" "}
                      {last.mode === "practice"
                        ? "GUIDED SELF-REVIEW"
                        : "AI FEEDBACK"}
                    </span>
                    <h2>
                      {last.mode === "practice"
                        ? "Your plan is in. Now, take a closer look."
                        : last.feedback
                          ? "Here’s what your decisions show."
                          : "Your work is saved."}
                    </h2>
                    <p>
                      {last.feedback?.summary ||
                        (last.mode === "practice"
                          ? "This is a reflection checklist, not an AI assessment. Use your submitted work as evidence for each answer."
                          : "The AI review is not available yet. Retry to generate feedback for this saved attempt.")}
                    </p>
                  </div>
                </div>
                {last.mode === "ai" && !last.feedback && (
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={() => act("retry")}
                  >
                    {busy ? "Reviewing…" : "Retry AI review"}
                  </button>
                )}
                <div className="rubric-grid">
                  {criteria.map((c) => {
                    const feedback = last.feedback?.criteria.find(
                      (f) => f.id === c.id,
                    );
                    const old = previous?.feedback?.criteria.find(
                      (f) => f.id === c.id,
                    );
                    return (
                      <article className="rubric-card" key={c.id}>
                        <div className="rubric-title">
                          <h3>{c.title}</h3>
                          {feedback ? (
                            <span
                              className={`level ${feedback.level === "Strong" ? "strong" : ""}`}
                            >
                              {feedback.level}
                            </span>
                          ) : (
                            <span className="level">Self-check</span>
                          )}
                        </div>
                        <p>{feedback?.explanation || c.question}</p>
                        {feedback?.evidence && (
                          <blockquote>“{feedback.evidence}”</blockquote>
                        )}
                        <div className="rubric-next">
                          <span>
                            {feedback
                              ? "TRY THIS NEXT"
                              : "WHAT GOOD LOOKS LIKE"}
                          </span>
                          <p>{feedback?.nextStep || c.strong}</p>
                        </div>
                        {last.mode === "practice" && (
                          <label className="check-label">
                            <input
                              type="checkbox"
                              disabled={busy}
                              checked={!!last.selfCheck[c.id]}
                              onChange={(e) =>
                                act("selfcheck", {
                                  checks: {
                                    ...last.selfCheck,
                                    [c.id]: e.target.checked,
                                  },
                                })
                              }
                            />
                            I can point to this in my plan
                          </label>
                        )}
                        {old && feedback && (
                          <small className="comparison">
                            Previous attempt: {old.level} → {feedback.level}
                          </small>
                        )}
                      </article>
                    );
                  })}
                </div>
                {last.feedback && (
                  <div className="review-insights">
                    <article>
                      <h3>Keep doing</h3>
                      {last.feedback.strengths.map((s, i) => (
                        <p key={i}>
                          <CheckCircle2 size={16} />
                          {s}
                        </p>
                      ))}
                    </article>
                    <article>
                      <h3>Focus on next</h3>
                      {last.feedback.nextSteps.map((s, i) => (
                        <p key={i}>
                          <ArrowRight size={16} />
                          {s}
                        </p>
                      ))}
                    </article>
                  </div>
                )}
                <details className="submitted-work">
                  <summary>
                    <FileText size={17} />
                    Read your submitted plan{" "}
                    <span>Attempt {session.attempts.length}</span>
                  </summary>
                  {fields.map((f) => (
                    <div key={f.id}>
                      <h4>{f.label}</h4>
                      <p>{last.plan[f.id]}</p>
                      {previous && (
                        <details className="previous-plan">
                          <summary>Previous version</summary>
                          <p>{previous.plan[f.id]}</p>
                        </details>
                      )}
                    </div>
                  ))}
                </details>
                <div className="review-actions">
                  <button
                    className="button primary"
                    disabled={busy || session.attempts.length >= 5}
                    onClick={() => act("revise", {}, true)}
                  >
                    Improve my plan <ArrowRight size={17} />
                  </button>
                  <button className="button secondary" onClick={download}>
                    <Download size={17} />
                    Export my work
                  </button>
                  <span>
                    {last.mode === "practice"
                      ? "Your work and self-checks are saved."
                      : "Feedback evaluates this task, not career suitability."}
                  </span>
                </div>
              </section>
            ) : (
              <>
                <div className="mobile-switch">
                  <button
                    className={mobilePanel === "context" ? "selected" : ""}
                    onClick={() => setMobilePanel("context")}
                  >
                    Project & team
                  </button>
                  <button
                    className={mobilePanel === "plan" ? "selected" : ""}
                    onClick={() => setMobilePanel("plan")}
                  >
                    Your plan
                  </button>
                </div>
                <div className="work-grid">
                  <section
                    className={`context-panel ${mobilePanel === "context" ? "mobile-visible" : ""}`}
                  >
                    {session.initialPlan && (
                      <div className="update-banner">
                        <AlertCircle size={20} />
                        <div>
                          <strong>
                            New update · Thursday’s QA capacity changed
                          </strong>
                          <p>{twist.body}</p>
                        </div>
                      </div>
                    )}
                    {tab === "brief" ? (
                      <>
                        <div className="panel-header">
                          <div className="panel-title">
                            <span className="resource-icon">
                              <FileText size={20} />
                            </span>
                            <div>
                              <h2>Project brief</h2>
                              <span>Your starting point</span>
                            </div>
                          </div>
                          <span className="document-tag">READ FIRST</span>
                        </div>
                        <div className="brief-body">
                          <div className="brief-cover">
                            <span className="overline">
                              NORTHSTAR / PRODUCT LAUNCH
                            </span>
                            <h2>
                              A smooth start
                              <br />
                              for three busy clinics.
                            </h2>
                            <div>
                              <span>PILOT RELEASE</span>
                              <span>FRIDAY · 10:00 AM</span>
                            </div>
                          </div>
                          <h3>The situation</h3>
                          <p>{scenario.brief}</p>
                          <div className="objective">
                            <Target size={20} />
                            <div>
                              <h4>Your mission</h4>
                              <p>{scenario.objective}</p>
                            </div>
                          </div>
                          <h3>What you’re working with</h3>
                          <ul className="constraints">
                            {scenario.constraints.map((c) => (
                              <li key={c}>
                                <span />
                                <p>{c}</p>
                              </li>
                            ))}
                          </ul>
                          <div className="manager-note">
                            <span className="avatar peach">JL</span>
                            <div>
                              <strong>
                                Jamie Lee <span>· Your manager</span>
                              </strong>
                              <p>
                                “Find out what’s realistic, make the trade-offs
                                clear, and give me a plan I can take to the
                                client. You’ve got this.”
                              </p>
                            </div>
                          </div>
                          <button
                            className="text-button"
                            onClick={() => setTab("tasks")}
                          >
                            Take a look at the task board{" "}
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      </>
                    ) : tab === "tasks" ? (
                      <>
                        <div className="panel-header">
                          <div className="panel-title">
                            <LayoutDashboard size={21} />
                            <div>
                              <h2>Task board</h2>
                              <span>Tuesday · 9:00 AM snapshot</span>
                            </div>
                          </div>
                          <span className="document-tag">5 TASKS</span>
                        </div>
                        <div className="task-list">
                          {scenario.tasks.map((t) => (
                            <article className="task-card" key={t.id}>
                              <div className="task-meta">
                                <span>{t.id}</span>
                                <span
                                  className={`task-status ${t.status === "Blocked" ? "blocked" : ""}`}
                                >
                                  {t.status}
                                </span>
                              </div>
                              <h3>{t.name}</h3>
                              <p>{t.detail}</p>
                              <div className="task-footer">
                                <span>{t.owner}</span>
                                <span>
                                  <Clock3 size={13} />
                                  {t.hours}
                                </span>
                                <span>{t.priority}</span>
                              </div>
                            </article>
                          ))}
                          <p className="small-note">
                            Estimates exclude testing. Ask the team about
                            dependencies before committing to dates.
                          </p>
                        </div>
                      </>
                    ) : who ? (
                      <>
                        <div className="panel-header">
                          <div className="panel-title">
                            <span className={`avatar ${colleagues[who].color}`}>
                              {colleagues[who].initials}
                            </span>
                            <div>
                              <h2>{colleagues[who].name}</h2>
                              <span>
                                {colleagues[who].role} ·{" "}
                                {caps.ai ? "AI character" : "Scenario notes"}
                              </span>
                            </div>
                          </div>
                          <MessageSquare size={18} />
                        </div>
                        <div className="conversation">
                          <div className="conversation-intro">
                            <span
                              className={`avatar large-avatar ${colleagues[who].color}`}
                            >
                              {colleagues[who].initials}
                            </span>
                            <h3>Meet {colleagues[who].name.split(" ")[0]}.</h3>
                            <p>{colleagues[who].intro}</p>
                          </div>
                          {session.messages
                            .filter((m) => m.colleague === who)
                            .map((m) => (
                              <div
                                key={m.id}
                                className={`chat-message ${m.role}`}
                              >
                                <span>
                                  {m.role === "user"
                                    ? "You"
                                    : colleagues[who].name.split(" ")[0]}{" "}
                                  {m.source === "reference" &&
                                  m.role === "assistant"
                                    ? "· Prepared scenario note"
                                    : ""}
                                </span>
                                <p>{m.text}</p>
                              </div>
                            ))}
                          {busy && (
                            <div className="chat-working">
                              <LoaderCircle size={15} className="spin" />
                              Updating workspace…
                            </div>
                          )}
                        </div>
                        <div className="chat-controls">
                          <span className="section-kicker">
                            {caps.ai
                              ? "QUESTIONS TO EXPLORE"
                              : "OPEN A PREPARED SCENARIO NOTE"}
                          </span>
                          <div className="question-chips">
                            {colleagues[who].notes.map((n, i) => (
                              <button
                                disabled={busy}
                                key={n.q}
                                onClick={() =>
                                  caps.ai
                                    ? setChat(n.q)
                                    : act("reference", {
                                        colleague: who,
                                        note: i,
                                      })
                                }
                              >
                                {n.q}
                                <ArrowUpRight size={13} />
                              </button>
                            ))}
                          </div>
                          {caps.ai ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (chat.trim())
                                  act("chat", {
                                    colleague: who,
                                    text: chat.trim(),
                                  });
                              }}
                            >
                              <label className="sr-only" htmlFor="chat">
                                Message your colleague
                              </label>
                              <input
                                id="chat"
                                placeholder={`Ask ${colleagues[who].name.split(" ")[0]} a question…`}
                                value={chat}
                                maxLength={2000}
                                onChange={(e) => setChat(e.target.value)}
                                disabled={busy}
                              />
                              <button
                                aria-label="Send message"
                                disabled={busy || !chat.trim()}
                              >
                                <Send size={18} />
                              </button>
                            </form>
                          ) : (
                            <p className="small-note">
                              These answers are authored reference material.
                              Live AI chat is not connected.
                            </p>
                          )}
                        </div>
                      </>
                    ) : null}
                  </section>
                  <aside
                    className={`plan-panel ${mobilePanel === "plan" ? "mobile-visible" : ""}`}
                  >
                    <div className="panel-header">
                      <div className="panel-title">
                        <span className="resource-icon green">
                          <FileText size={19} />
                        </span>
                        <div>
                          <h2>Your launch plan</h2>
                          <span>A little clarity goes a long way.</span>
                        </div>
                      </div>
                    </div>
                    <div className="plan-tip">
                      <span>{session.initialPlan ? "02" : "01"}</span>
                      <p>
                        {session.initialPlan
                          ? "Adapt your plan to the QA update. Then write your message to the client."
                          : "Explore the brief and talk to the team. Capture your first recommendation below."}
                      </p>
                    </div>
                    <div className="plan-fields">
                      {fields
                        .filter(
                          (f) =>
                            session.initialPlan || f.id !== "clientMessage",
                        )
                        .map((f, i) => (
                          <label key={f.id}>
                            <span>
                              <b>{String(i + 1).padStart(2, "0")}</b>
                              {f.label}
                              <span className="required">*</span>
                            </span>
                            <textarea
                              value={plan[f.id]}
                              placeholder={f.placeholder}
                              maxLength={5000}
                              disabled={busy}
                              onChange={(e) => edit(f.id, e.target.value)}
                              rows={f.id === "clientMessage" ? 5 : 4}
                            />
                          </label>
                        ))}
                    </div>
                    <div className="plan-bottom">
                      <div className="save-status" role="status">
                        <span className="small-dot" />
                        {saved}
                      </div>
                      <button
                        className="button primary full"
                        disabled={busy}
                        onClick={() =>
                          act(session.initialPlan ? "submit" : "reveal", {
                            plan: planRef.current,
                          })
                        }
                      >
                        {busy ? (
                          <>
                            <LoaderCircle size={17} className="spin" />
                            Working…
                          </>
                        ) : (
                          <>
                            {session.initialPlan
                              ? "Submit my plan"
                              : "Continue with this plan"}
                            <ArrowRight size={17} />
                          </>
                        )}
                      </button>
                      <p>
                        {session.initialPlan
                          ? caps.ai
                            ? "Get a review based on your actual decisions."
                            : "Continue to guided self-review. No AI score."
                          : "There’s a new development after your first draft."}
                      </p>
                    </div>
                  </aside>
                </div>
              </>
            )}
            <div className="workspace-footer">
              <span>
                <span className="small-dot" />
                {caps.persistent
                  ? "Progress saved to your guest session"
                  : "Practice progress saved on this device"}
              </span>
              <span>Fictional company. Practical skills.</span>
            </div>
          </div>
        </main>
      )}
      {showUpdate && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-title"
          >
            <span className="modal-icon">
              <AlertCircle size={28} />
            </span>
            <span className="section-kicker">A NEW DEVELOPMENT</span>
            <h2 id="update-title">{twist.title}</h2>
            <p>{twist.body}</p>
            <div className="modal-note">
              Your first plan is saved. This is your chance to show how you
              adapt.
            </div>
            <button
              autoFocus
              className="button primary full"
              onClick={() => setShowUpdate(false)}
            >
              Revisit my plan <ArrowRight size={17} />
            </button>
          </section>
        </div>
      )}
      {reset && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
          >
            <h2 id="reset-title">Start a fresh chapter?</h2>
            <p>
              This will delete this session’s conversations, plans and reviews.
              Export your work first if you want to keep it.
            </p>
            {session?.attempts.length ? (
              <button className="button secondary full" onClick={download}>
                <Download size={16} />
                Export my work
              </button>
            ) : null}
            <div className="modal-actions">
              <button
                autoFocus
                className="button secondary"
                onClick={() => setReset(false)}
              >
                Keep working
              </button>
              <button
                className="button danger"
                disabled={busy}
                onClick={() => act("reset")}
              >
                Delete & start over
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
