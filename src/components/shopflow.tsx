"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
} from "@headlessui/react";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  CreditCard,
  Download,
  FileText,
  Flag,
  FlaskConical,
  Headphones,
  LayoutDashboard,
  ListTodo,
  LoaderCircle,
  Mail,
  MessageSquare,
  Orbit,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  X,
  AlertTriangle,
} from "lucide-react";
import CareerVerse from "./careerverse";
import {
  orders,
  documents,
  actualTotal,
  money,
  type Category,
} from "@/lib/shopflow/data";
import {
  newRun,
  replay,
  assessSupport,
  recommendation,
  type State,
  type Action,
  type BugReport,
  type Assessment,
} from "@/lib/shopflow/engine";
import {
  emptyProgress,
  progressSchema,
  progressKey,
  saveProgress,
  callEngine,
  type Progress,
  type ChatMessage,
} from "@/lib/shopflow/progress";

type Screen = "home" | "workspace" | "path" | "pricing" | "pm";
type App =
  | "inbox"
  | "tasks"
  | "orders"
  | "chat"
  | "sandbox"
  | "docs"
  | "timeline"
  | "report";
const apps = [
  { id: "inbox", label: "Inbox", icon: Mail },
  { id: "tasks", label: "Task board", icon: ListTodo },
  { id: "chat", label: "Team chat", icon: MessageSquare },
  { id: "orders", label: "Customer orders", icon: ShoppingBag },
  { id: "sandbox", label: "Checkout sandbox", icon: FlaskConical },
  { id: "docs", label: "Documents", icon: FileText },
  { id: "timeline", label: "Workday timeline", icon: Clock3 },
  { id: "report", label: "Career reflection", icon: TrendingUp },
] as const;
const clock = (minutes: number) =>
  `${String(9 + Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
function parseMoney(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim()))
    throw new Error(
      "Enter a dollar amount with up to two decimal places, such as 20.00.",
    );
  return Math.round(Number(value) * 100);
}
function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`sf-badge ${tone}`}>{children}</span>;
}
function Button({
  children,
  onClick,
  disabled,
  secondary = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <button
      className={`sf-button ${secondary ? "secondary" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
function AssessmentCard({ title, data }: { title: string; data: Assessment }) {
  return (
    <section className="sf-assessment">
      <div className="sf-assessment-title">
        <h3>{title}</h3>
        <strong>
          {data.total}
          <small>/100</small>
        </strong>
      </div>
      {data.criteria.map((c) => (
        <div className="sf-criterion" key={c.label}>
          <div>
            <b>{c.label}</b>
            <span>
              {c.score}/100 · {c.weight}% weight
            </span>
          </div>
          <progress value={c.score} max="100" />
          <p>{c.evidence}</p>
        </div>
      ))}
    </section>
  );
}

export default function ShopFlow() {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const progressRef = useRef(progress);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [app, setApp] = useState<App>("inbox");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [dialog, setDialog] = useState<
    "intro" | "shift" | "replay" | "upgrade" | null
  >(null);
  const [selectedMessage, setSelectedMessage] = useState("manager");
  const [selectedOrder, setSelectedOrder] = useState(orders[0].id);
  const [selectedDoc, setSelectedDoc] = useState("promotion");
  const [aiReady, setAiReady] = useState(false);
  const [careerSearch, setCareerSearch] = useState("");
  const [followup, setFollowup] = useState(false);
  const run = progress.runs.find((r) => r.id === progress.active);
  const state = run ? replay(run) : null;
  const draft = progress.drafts[progress.active || ""] || {};
  const chats = progress.chats[progress.active || ""] || [];
  function navigate(next: Screen) {
    setDialog(null);
    setScreen(next);
    window.location.hash = next;
    window.scrollTo({ top: 0 });
  }
  useEffect(() => {
    const syncScreen = () => {
      const hash = window.location.hash.slice(1);
      setScreen(
        ["practice", "careers"].includes(hash)
          ? "pm"
          : ["home", "workspace", "path", "pricing", "pm"].includes(hash)
            ? (hash as Screen)
            : "home",
      );
      setDialog(null);
    };
    syncScreen();
    window.addEventListener("hashchange", syncScreen);
    try {
      const raw = localStorage.getItem(progressKey);
      if (raw) {
        const parsed = progressSchema.parse(JSON.parse(raw));
        parsed.runs.forEach(replay);
        progressRef.current = parsed;
        setProgress(parsed);
      }
    } catch {
      setError(
        "Saved practice could not be loaded. Your original browser data has been kept. Use another browser for a fresh guest session.",
      );
    }
    setReady(true);
    fetch("/api/shopflow")
      .then((r) => r.json())
      .then((r) => setAiReady(r.ai === true))
      .catch(() => {});
    return () => window.removeEventListener("hashchange", syncScreen);
  }, []);
  function commit(update: (p: Progress) => Progress) {
    const next = saveProgress(progressRef.current, update(progressRef.current));
    progressRef.current = next;
    setProgress(next);
    return next;
  }
  function setDraft(key: string, value: string) {
    try {
      commit((p) => ({
        ...p,
        drafts: {
          ...p.drafts,
          [p.active!]: { ...p.drafts[p.active!], [key]: value },
        },
      }));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function act(action: Action) {
    if (busyRef.current || !run) return false;
    busyRef.current = true;
    setBusy(true);
    setError("");
    const revision = progressRef.current.revision;
    try {
      const data = await callEngine(run, action);
      if (progressRef.current.revision !== revision)
        throw new Error(
          "The draft changed while this action was processing. Please retry.",
        );
      commit((p) => ({
        ...p,
        runs: p.runs.map((r) => (r.id === run.id ? data.run : r)),
      }));
      setToast(data.state.history.at(-1)?.text || "Saved.");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function begin() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      if (progress.runs.length >= 12)
        throw new Error(
          "This device already holds 12 runs. Export your history before starting in another browser.",
        );
      const fresh = newRun();
      await callEngine(fresh);
      commit((p) => ({ ...p, runs: [...p.runs, fresh], active: fresh.id }));
      setApp("inbox");
      setSelectedMessage("manager");
      setFollowup(false);
      navigate("workspace");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function goApp(next: App) {
    setApp(next);
    setToast("");
    window.scrollTo({ top: 0 });
  }
  async function chat(mode: "chat" | "reflection" = "chat") {
    if (!run || busyRef.current) return;
    const text =
      mode === "reflection"
        ? "Reflect on my recorded decisions."
        : draft.question?.trim();
    if (!text) {
      setError("Write a question for Avery first.");
      return;
    }
    if (chats.length >= 98) {
      setError("This run has reached its chat limit.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await callEngine(run, undefined, mode, text);
      const messages: ChatMessage[] = [
        { role: "user", text, source: "user" },
        {
          role: "assistant",
          text: data.text,
          source: data.source,
          notice: data.notice,
        },
      ];
      commit((p) => ({
        ...p,
        chats: {
          ...p.chats,
          [run.id]: [...(p.chats[run.id] || []), ...messages],
        },
        drafts: {
          ...p.drafts,
          [run.id]: { ...p.drafts[run.id], question: "" },
        },
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function exportRun() {
    if (!run || !state) return;
    const assessment = assessSupport(state);
    const lines = [
      "CAREERVERSE · SHOPFLOW WORK RECORD",
      `Run ${run.id}`,
      `Started ${run.createdAt}`,
      "Fictional workplace simulation; not employment experience or a career aptitude test.",
      "",
      `SUPPORT: ${assessment.total}/100`,
      ...assessment.criteria.map(
        (c) => `${c.label}: ${c.score}/100 (${c.weight}%). ${c.evidence}`,
      ),
      "",
      "CUSTOMER DECISIONS",
      ...orders.map(
        (o) =>
          `${o.id} · ${o.customer}\nRefund: ${state.refunds[o.id] === undefined ? "Not decided" : money(state.refunds[o.id])}\nReply: ${state.replies[o.id] || "Not sent"}`,
      ),
      "",
      "QA REPORTS",
      ...state.reports.map(
        (a, i) =>
          `Attempt ${i + 1}: ${a.score.total}/100\n${a.report.title}\nPreconditions: ${a.report.preconditions}\n${a.report.steps}\nExpected ${money(a.report.expected)} / Actual ${money(a.report.actual)}\nSeverity: ${a.report.severity}\n${a.score.criteria.map((c) => c.evidence).join("\n")}`,
      ),
      "",
      "CAREER INTEREST (SELF-REPORTED)",
      JSON.stringify(state.interest),
      "",
      recommendation(state),
      "",
      "DECISION HISTORY",
      ...state.history.map((e) => `${clock(e.minute)} — ${e.text}`),
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\n\n")], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `CareerVerse-ShopFlow-${run.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const input = (
    key: string,
    label: string,
    placeholder = "",
    type = "text",
  ) => (
    <label className="sf-field">
      {label}
      <input
        type={type}
        value={draft[key] || ""}
        placeholder={placeholder}
        maxLength={type === "text" ? 200 : undefined}
        onChange={(e) => setDraft(key, e.target.value)}
        disabled={busy}
      />
    </label>
  );
  const textarea = (key: string, label: string, placeholder = "", rows = 4) => (
    <label className="sf-field">
      {label}
      <textarea
        value={draft[key] || ""}
        placeholder={placeholder}
        rows={rows}
        maxLength={3000}
        onChange={(e) => setDraft(key, e.target.value)}
        disabled={busy}
      />
    </label>
  );
  async function sendRefund() {
    try {
      await act({
        type: "REFUND_SUBMITTED",
        id: selectedOrder,
        amount: parseMoney(draft[`refund-${selectedOrder}`] || ""),
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function submitReport(practice: boolean) {
    const p = practice ? "follow-" : "bug-";
    try {
      const report: BugReport = {
        title: draft[p + "title"] || "",
        preconditions: draft[p + "preconditions"] || "",
        steps: draft[p + "steps"] || "",
        expected: parseMoney(draft[p + "expected"] || ""),
        actual: parseMoney(draft[p + "actual"] || ""),
        severity: (draft[p + "severity"] || "Medium") as BugReport["severity"],
        condition: (draft[p + "condition"] ||
          "unknown") as BugReport["condition"],
        testIndex: Number(draft[p + "test"] || 0),
      };
      await act({
        type: practice ? "FOLLOWUP_SUBMITTED" : "BUG_REPORT_SUBMITTED",
        report,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function reportForm(practice: boolean) {
    if (!state) return null;
    const p = practice ? "follow-" : "bug-";
    const tests = practice ? state.followupTests : state.tests;
    const result = (practice ? state.followupReports : state.reports).at(-1);
    return (
      <section className="sf-panel">
        <div className="sf-panel-heading">
          <div>
            <span className="sf-kicker">DELIVERABLE</span>
            <h2>{practice ? "Boundary defect report" : "Your bug report"}</h2>
          </div>
          <FileText size={21} />
        </div>
        <p className="sf-muted">
          Your report is checked against your actual sandbox results. You can
          revise and resubmit.
        </p>
        <fieldset
          disabled={busy || (!practice && state.stage !== "qa")}
          className="sf-form"
        >
          {input(
            p + "title",
            "Title",
            "Describe the failure and affected condition",
          )}
          {textarea(
            p + "preconditions",
            "Preconditions",
            "What must be true before another tester starts?",
            2,
          )}
          {textarea(
            p + "steps",
            "Steps to reproduce · one step per line",
            "1. Set up the cart…\n2. Apply the promotion…\n3. Check the charged amount…",
            4,
          )}
          <div className="sf-form-grid">
            {input(p + "expected", "Expected total ($)", "0.00")}
            {input(p + "actual", "Actual total ($)", "0.00")}
          </div>
          <div className="sf-form-grid">
            <label className="sf-field">
              Severity
              <select
                value={draft[p + "severity"] || "Medium"}
                onChange={(e) => setDraft(p + "severity", e.target.value)}
              >
                {["Low", "Medium", "High", "Critical"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="sf-field">
              Failure condition
              <select
                value={draft[p + "condition"] || "unknown"}
                onChange={(e) => setDraft(p + "condition", e.target.value)}
              >
                <option value="unknown">Not identified yet</option>
                <option value="accessories">Cart contains accessories</option>
                <option value="threshold">Exact shipping threshold</option>
                <option value="all">Every checkout fails</option>
              </select>
            </label>
          </div>
          <label className="sf-field">
            Evidence: link a test
            <select
              value={draft[p + "test"] || "0"}
              onChange={(e) => setDraft(p + "test", e.target.value)}
            >
              {tests.length ? (
                tests.map((t, i) => (
                  <option value={i} key={i}>
                    Test {i + 1} · charged {money(t.actual)}
                  </option>
                ))
              ) : (
                <option>No tests yet — use the sandbox first</option>
              )}
            </select>
          </label>
          <Button
            onClick={() => submitReport(practice)}
            disabled={!tests.length || busy}
          >
            Submit for review <ArrowRight size={16} />
          </Button>
        </fieldset>
        {result && (
          <div className="sf-review-result">
            <Badge tone={result.ready ? "green" : "amber"}>
              {result.ready ? "Ready for handoff" : "Clarification requested"}
            </Badge>
            <AssessmentCard
              title={`Attempt ${(practice ? state.followupReports : state.reports).length}`}
              data={result.score}
            />
            {!practice && <Button onClick={() => goApp("report")}>Compare my roles <ArrowRight size={16} /></Button>}
            {practice && (
              <p className="sf-muted">
                Documentation:{" "}
                {state.reports.at(-1)?.score.criteria[2].score || 0}/100 in the
                main incident → {result.score.criteria[2].score}/100 in this
                exercise. Different tasks; this is a practice comparison, not a
                validated growth measure.
              </p>
            )}
          </div>
        )}
      </section>
    );
  }
  function sandbox(practice: boolean) {
    if (!state) return null;
    const p = practice ? "follow-" : "test-";
    const tests = practice ? state.followupTests : state.tests;
    return (
      <div className="sf-two-column">
        <div>
          <section className="sf-panel">
            <div className="sf-panel-heading">
              <div>
                <span className="sf-kicker">
                  {practice
                    ? "NEXT PRACTICE · 5–10 MIN"
                    : "SAFE TEST ENVIRONMENT"}
                </span>
                <h2>
                  {practice ? "The $75 shipping boundary" : "Checkout sandbox"}
                </h2>
              </div>
              <FlaskConical size={23} />
            </div>
            <p className="sf-muted">
              {practice
                ? "A different defect, the same investigation skills. Free shipping starts at $75. Find where checkout disagrees."
                : "Test different carts and codes. This is the working checkout logic used by the incident. No real orders are placed."}
            </p>
            <fieldset
              className="sf-form"
              disabled={busy || (!practice && state.stage !== "qa")}
            >
              {input(
                p + "subtotal",
                "Merchandise subtotal ($)",
                practice ? "75.00" : "100.00",
              )}
              {!practice && (
                <>
                  <label className="sf-field">
                    Cart category
                    <select
                      value={draft[p + "category"] || "apparel"}
                      onChange={(e) => setDraft(p + "category", e.target.value)}
                    >
                      <option value="apparel">Apparel only</option>
                      <option value="accessories">Accessories only</option>
                      <option value="mixed">
                        Mixed: apparel + accessories
                      </option>
                    </select>
                  </label>
                  {input(p + "promo", "Promotion code", "SAVE20")}
                </>
              )}
              <Button
                disabled={busy}
                onClick={async () => {
                  try {
                    const subtotal = parseMoney(draft[p + "subtotal"] || "");
                    await act(
                      practice
                        ? { type: "FOLLOWUP_TESTED", subtotal }
                        : {
                            type: "CHECKOUT_TESTED",
                            cart: {
                              subtotal,
                              category: (draft[p + "category"] ||
                                "apparel") as Category,
                              promo: draft[p + "promo"] || "",
                            },
                          },
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Run checkout test <Play size={15} />
              </Button>
            </fieldset>
            {tests.length > 0 && (
              <div className="sf-checkout-result">
                <span>CHECKOUT CHARGED</span>
                <strong>{money(tests.at(-1)!.actual)}</strong>
                <small>
                  Test {tests.length} saved as evidence. Compare with
                  requirements.
                </small>
              </div>
            )}
            <button
              className="sf-text-button"
              onClick={async () => {
                setSelectedDoc(practice ? "shipping" : "promotion");
                await act({
                  type: "READ_DOCUMENT",
                  id: practice ? "shipping" : "promotion",
                });
                goApp("docs");
              }}
            >
              Read {practice ? "shipping" : "promotion"} requirements{" "}
              <ArrowUpRight size={14} />
            </button>
          </section>
          <section className="sf-panel">
            <h3>Test history</h3>
            {tests.length ? (
              <div className="sf-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Input</th>
                      <th>Charged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.map((t, i) => (
                      <tr key={i}>
                        <td>#{i + 1}</td>
                        <td>
                          {"cart" in t
                            ? `${money(t.cart.subtotal)} · ${t.cart.category} · ${t.cart.promo || "no promo"}`
                            : `${money(t.subtotal)} + shipping`}
                        </td>
                        <td>{money(t.actual)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="sf-muted">Your test evidence will appear here.</p>
            )}
          </section>
        </div>
        {reportForm(practice)}
      </div>
    );
  }
  function workspaceContent() {
    if (!state || !run) return null;
    const supportLocked = state.stage !== "support";
    if (app === "inbox") {
      const o = orders.find((o) => o.id === selectedMessage);
      return (
        <div className="sf-mail-layout">
          <section className="sf-mail-list">
            <h3>
              Inbox <Badge>{orders.length + 1}</Badge>
            </h3>
            {[
              {
                id: "manager",
                name: "Avery Morgan",
                subject: "Your first shift: checkout complaints",
                initials: "AM",
              },
              ...orders.map((o) => ({
                id: o.id,
                name: o.customer,
                subject: `${o.id} · Question about my charge`,
                initials: o.customer
                  .split(" ")
                  .map((s) => s[0])
                  .join(""),
              })),
            ].map((m) => (
              <button
                disabled={busy}
                className={selectedMessage === m.id ? "selected" : ""}
                key={m.id}
                onClick={async () => {
                  setSelectedMessage(m.id);
                  await act({ type: "READ_MESSAGE", id: m.id });
                }}
              >
                <span className="sf-avatar">{m.initials}</span>
                <span>
                  <b>{m.name}</b>
                  <small>{m.subject}</small>
                </span>
                {!state.read.includes(m.id) && <i />}
              </button>
            ))}
          </section>
          <section className="sf-panel sf-mail-content">
            <span className="sf-kicker">
              {o ? "CUSTOMER MESSAGE" : "YOUR MANAGER"}
            </span>
            <h2>
              {o
                ? `Question about order ${o.id}`
                : "Welcome to the team. Let’s make this right."}
            </h2>
            <div className="sf-sender">
              <span className="sf-avatar">
                {o
                  ? o.customer
                      .split(" ")
                      .map((s) => s[0])
                      .join("")
                  : "AM"}
              </span>
              <div>
                <strong>{o?.customer || "Avery Morgan"}</strong>
                <small>{o?.email || "Support Lead · ShopFlow"}</small>
              </div>
              <time>{o?.received || "09:00"}</time>
            </div>
            <div className="sf-email-body">
              {o ? (
                <p>{o.complaint}</p>
              ) : (
                <>
                  <p>
                    Good morning — you’re on Customer Support today. Three
                    customers have questions about SAVE20 charges. Our promotion
                    release is scheduled for 11:00.
                  </p>
                  <p>
                    Inspect the orders, check the policy, and decide what each
                    customer is owed. Write back with a clear explanation. If
                    you see a pattern, hand it to QA with evidence.
                  </p>
                  <p>
                    You’ll then switch perspectives and investigate the same
                    issue as a QA Tester. The decisions you make here will
                    follow you.
                  </p>
                  <p>— Avery</p>
                </>
              )}
            </div>
            {!state.read.includes(selectedMessage) && (
              <Button
                secondary
                disabled={busy}
                onClick={() =>
                  act({ type: "READ_MESSAGE", id: selectedMessage })
                }
              >
                Mark as read <Check size={16} />
              </Button>
            )}
            {o ? (
              <>
                <button
                  className="sf-text-button"
                  onClick={async () => {
                    setSelectedOrder(o.id);
                    await act({ type: "ORDER_INSPECTED", id: o.id });
                    goApp("orders");
                  }}
                >
                  Inspect order {o.id} <ArrowRight size={16} />
                </button>
                {state.replies[o.id] ? (
                  <div className="sf-sent">
                    <Badge tone="green">Reply sent</Badge>
                    <p>{state.replies[o.id]}</p>
                  </div>
                ) : (
                  <fieldset
                    disabled={busy || supportLocked}
                    className="sf-form"
                  >
                    {textarea(
                      `reply-${o.id}`,
                      "Your response",
                      "Include the order ID, verified refund amount (two decimals), and the next step.",
                    )}
                    <Button
                      disabled={busy || state.refunds[o.id] === undefined}
                      onClick={() =>
                        act({
                          type: "CUSTOMER_REPLIED",
                          id: o.id,
                          text: draft[`reply-${o.id}`] || "",
                        })
                      }
                    >
                      Send response <Send size={16} />
                    </Button>
                    {state.refunds[o.id] === undefined && (
                      <small>
                        Record a refund decision in Customer Orders first.
                      </small>
                    )}
                  </fieldset>
                )}
              </>
            ) : (
              <Button
                onClick={() => {
                  setSelectedMessage(orders[0].id);
                  act({ type: "READ_MESSAGE", id: orders[0].id });
                }}
              >
                Open first customer message <ArrowRight size={16} />
              </Button>
            )}
          </section>
        </div>
      );
    }
    if (app === "orders") {
      const o = orders.find((o) => o.id === selectedOrder)!;
      return (
        <>
          <section className="sf-panel">
            <div className="sf-panel-heading">
              <div>
                <h2>Customer orders</h2>
                <p className="sf-muted">
                  Three fictional orders. Check the details before you act.
                </p>
              </div>
              <Badge>USD · no tax or shipping</Badge>
            </div>
            <div className="sf-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Subtotal</th>
                    <th>Promotion</th>
                    <th>Paid</th>
                    <th>Refund</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className={order.id === selectedOrder ? "selected" : ""}
                    >
                      <td>
                        <b>{order.id}</b>
                      </td>
                      <td>{order.customer}</td>
                      <td>{money(order.cart.subtotal)}</td>
                      <td>{order.cart.promo}</td>
                      <td>{money(actualTotal(order.cart))}</td>
                      <td>
                        {state.refunds[order.id] === undefined
                          ? "Not decided"
                          : money(state.refunds[order.id])}
                      </td>
                      <td>
                        <button
                          className="sf-text-button"
                          disabled={busy}
                          onClick={async () => {
                            setSelectedOrder(order.id);
                            await act({
                              type: "ORDER_INSPECTED",
                              id: order.id,
                            });
                          }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="sf-panel">
            <div className="sf-panel-heading">
              <h2>
                {o.id} · {o.customer}
              </h2>
              <Badge tone={state.inspected.includes(o.id) ? "green" : "muted"}>
                {state.inspected.includes(o.id) ? "Inspected" : "Not inspected"}
              </Badge>
            </div>
            <p>{o.items}</p>
            <p className="sf-muted">
              Category: {o.cart.category} · SAVE20 · paid{" "}
              {money(actualTotal(o.cart))}
            </p>
            {!state.inspected.includes(o.id) && (
              <Button
                secondary
                disabled={busy}
                onClick={() => act({ type: "ORDER_INSPECTED", id: o.id })}
              >
                Inspect this order
              </Button>
            )}
            {state.refunds[o.id] === undefined ? (
              <fieldset
                disabled={busy || supportLocked}
                className="sf-form sf-inline-form"
              >
                {input(
                  `refund-${o.id}`,
                  "Refund amount ($)",
                  "Enter 0.00 if no overcharge",
                )}
                <Button
                  disabled={busy || !state.inspected.includes(o.id)}
                  onClick={sendRefund}
                >
                  Record refund decision
                </Button>
                <p className="sf-muted">
                  Simulation only. This decision is final for this run; fresh
                  replay lets you try another approach.
                </p>
              </fieldset>
            ) : (
              <div className="sf-sent">
                <Badge tone="green">Decision recorded</Badge>
                <h3>{money(state.refunds[o.id])}</h3>
                <Button
                  secondary
                  onClick={() => {
                    setSelectedMessage(o.id);
                    goApp("inbox");
                  }}
                >
                  Reply to customer <ArrowRight size={16} />
                </Button>
              </div>
            )}
          </section>
        </>
      );
    }
    if (app === "docs")
      return (
        <div className="sf-doc-layout">
          <section className="sf-panel sf-doc-list">
            <h3>Company handbook</h3>
            {documents.map((d) => (
              <button
                disabled={busy}
                key={d.id}
                className={selectedDoc === d.id ? "selected" : ""}
                onClick={async () => {
                  setSelectedDoc(d.id);
                  await act({ type: "READ_DOCUMENT", id: d.id });
                }}
              >
                <FileText size={18} />
                <span>{d.title}</span>
                {state.docs.includes(d.id) && <Check size={15} />}
              </button>
            ))}
          </section>
          <article className="sf-panel sf-document">
            <Badge>{documents.find((d) => d.id === selectedDoc)!.tag}</Badge>
            <h2>{documents.find((d) => d.id === selectedDoc)!.title}</h2>
            <p>{documents.find((d) => d.id === selectedDoc)!.body}</p>
            <p className="sf-muted">
              ShopFlow internal reference · scenario v1
            </p>
            {!state.docs.includes(selectedDoc) && (
              <Button
                secondary
                disabled={busy}
                onClick={() => act({ type: "READ_DOCUMENT", id: selectedDoc })}
              >
                Mark as read <Check size={16} />
              </Button>
            )}
            {followup && (
              <Button onClick={() => goApp("sandbox")}>
                Return to follow-up <ArrowRight size={16} />
              </Button>
            )}
          </article>
        </div>
      );
    if (app === "tasks") {
      const supportDone = orders.filter(
        (o) => state.refunds[o.id] !== undefined && state.replies[o.id],
      ).length;
      const tickets = [
        {
          id: "CS-101",
          title: "Investigate customer charges",
          body: `${state.inspected.length}/3 orders inspected`,
          status:
            state.inspected.length === 3
              ? "Done"
              : state.inspected.length
                ? "In Progress"
                : "Todo",
        },
        {
          id: "CS-102",
          title: "Resolve the three complaints",
          body: `${supportDone}/3 refund decisions and replies`,
          status:
            supportDone === 3 ? "Done" : supportDone ? "In Progress" : "Todo",
        },
        {
          id: "CS-103",
          title: "Escalate the recurring issue",
          body: state.escalation
            ? state.escalation.symptom
            : "Link evidence so QA can act.",
          status: state.escalation
            ? "Done"
            : supportLocked
              ? "Blocked"
              : "Todo",
        },
        ...(state.qaTicket ? [{ id: "QA-201", ...state.qaTicket }] : []),
      ];
      return (
        <>
          <div className="sf-kanban">
            {["Todo", "In Progress", "Blocked", "Done"].map((status) => (
              <section key={status}>
                <h3>
                  <i className={status.toLowerCase().replace(" ", "-")} />
                  {status}
                  <span>
                    {tickets.filter((t) => t.status === status).length}
                  </span>
                </h3>
                {tickets
                  .filter((t) => t.status === status)
                  .map((t) => (
                    <article key={t.id}>
                      <small>{t.id}</small>
                      <h4>{t.title}</h4>
                      <p>{t.body}</p>
                      <button
                        className="sf-text-button"
                        onClick={() =>
                          goApp(
                            t.id.startsWith("QA")
                              ? "sandbox"
                              : t.id === "CS-103"
                                ? (state.escalation || supportLocked ? "timeline" : "tasks")
                                : "orders",
                          )
                        }
                      >
                        {t.id === "CS-103"
                          ? (state.escalation || supportLocked ? "Review handoff history" : "Use escalation form below")
                          : "Open work"}
                        <ArrowRight size={14} />
                      </button>
                    </article>
                  ))}
              </section>
            ))}
          </div>
          {!supportLocked && !state.escalation && (
            <section className="sf-panel">
              <div className="sf-panel-heading">
                <div>
                  <span className="sf-kicker">HANDOFF TO QA</span>
                  <h2>Escalate the incident</h2>
                </div>
                <Flag size={22} />
              </div>
              <fieldset className="sf-form" disabled={busy}>
                <div className="sf-field">
                  <span>Link inspected orders</span>
                  <div className="sf-checks">
                    {orders.map((o) => (
                      <label key={o.id}>
                        <input
                          type="checkbox"
                          disabled={!state.inspected.includes(o.id)}
                          checked={draft[`link-${o.id}`] === "yes"}
                          onChange={(e) =>
                            setDraft(
                              `link-${o.id}`,
                              e.target.checked ? "yes" : "no",
                            )
                          }
                        />
                        {o.id}
                      </label>
                    ))}
                  </div>
                </div>
                {textarea(
                  "symptom",
                  "Observed symptom",
                  "Describe what the customer reports and which orders share the pattern.",
                  3,
                )}
                <label className="sf-field">
                  Priority
                  <select
                    value={draft.priority || "Medium"}
                    onChange={(e) => setDraft("priority", e.target.value)}
                  >
                    {["Low", "Medium", "High"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <Button
                  disabled={busy}
                  onClick={() =>
                    act({
                      type: "INCIDENT_ESCALATED",
                      orderIds: orders
                        .filter((o) => draft[`link-${o.id}`] === "yes")
                        .map((o) => o.id),
                      symptom: draft.symptom || "",
                      priority: (draft.priority || "Medium") as
                        | "Low"
                        | "Medium"
                        | "High",
                    })
                  }
                >
                  Create QA ticket <ArrowRight size={16} />
                </Button>
              </fieldset>
            </section>
          )}
          {state.qaTicket && (
            <section className="sf-panel">
              <h3>QA-201 · inherited evidence</h3>
              <p>{state.qaTicket.body}</p>
              <p className="sf-muted">
                Linked orders:{" "}
                {state.qaTicket.orderIds.join(", ") ||
                  "None — investigate the orders yourself"}
              </p>
              {state.impact.qaDelay > 0 && (
                <div className="sf-notice amber">
                  No support escalation. QA started with a{" "}
                  {state.impact.qaDelay}-minute delay.
                </div>
              )}
              <Button onClick={() => goApp("sandbox")}>
                Open checkout sandbox <FlaskConical size={16} />
              </Button>
            </section>
          )}
        </>
      );
    }
    if (app === "sandbox")
      return state.stage === "support" ? (
        <section className="sf-panel sf-locked">
          <FlaskConical size={36} />
          <h2>See this incident through QA’s eyes</h2>
          <p>
            Finish your customer decisions, then use Perspective Shift. Your
            evidence and consequences will carry over.
          </p>
          <Button onClick={() => setDialog("shift")}>
            Perspective Shift <ArrowRight size={16} />
          </Button>
        </section>
      ) : (
        sandbox(followup && state.stage === "complete")
      );
    if (app === "chat")
      return (
        <section className="sf-panel sf-chat">
          <div className="sf-panel-heading">
            <div className="sf-sender">
              <span className="sf-avatar">AM</span>
              <div>
                <strong>Avery Morgan</strong>
                <small>
                  Workplace coach ·{" "}
                  {aiReady ? "AI connected" : "authored guidance available"}
                </small>
              </div>
            </div>
            <Badge tone={aiReady ? "green" : "muted"}>
              {aiReady ? "Live AI" : "Reference mode"}
            </Badge>
          </div>
          <div className="sf-chat-messages">
            <div className="sf-chat-bubble assistant">
              <b>Avery · scenario briefing</b>
              <p>
                Let’s make the handoff useful. The Support team sees customer
                impact; QA needs repeatable evidence. Ask me about a policy or
                investigation technique.
              </p>
            </div>
            {chats.map((m, i) => (
              <div key={i} className={`sf-chat-bubble ${m.role}`}>
                <b>
                  {m.role === "user"
                    ? "You"
                    : m.source === "ai"
                      ? "Avery · live AI"
                      : "Avery · authored guide"}
                </b>
                <p>{m.text}</p>
                {m.notice && <small>{m.notice}</small>}
              </div>
            ))}
          </div>
          <fieldset className="sf-form" disabled={busy}>
            {textarea(
              "question",
              "Ask Avery",
              "How should I investigate this pattern?",
              2,
            )}
            <Button onClick={() => chat()} disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Send size={16} />
              )}
              Send question
            </Button>
          </fieldset>
          <div className="sf-hints">
            <span>Recorded hints:</span>
            {["refund", "escalation", "testing", "report"].map((topic) => (
              <button
                disabled={busy}
                key={topic}
                onClick={async () => {
                  if (
                    await act({
                      type: "HINT_USED",
                      topic: topic as
                        | "refund"
                        | "escalation"
                        | "testing"
                        | "report",
                    })
                  ) {
                    setDraft("question", `Help me understand ${topic}.`);
                    setToast(
                      "Hint recorded. Send the suggested question to Avery.",
                    );
                  }
                }}
              >
                {topic}
              </button>
            ))}
          </div>
        </section>
      );
    if (app === "timeline")
      return (
        <section className="sf-panel">
          <h2>Your workday, decision by decision</h2>
          <p className="sf-muted">
            Time advances after meaningful actions. These are simulated minutes,
            not a speed test.
          </p>
          <ol className="sf-timeline">
            {state.history.map((event, i) => (
              <li key={i}>
                <time>{clock(event.minute)}</time>
                <div>
                  <b>{event.type.replaceAll("_", " ").toLowerCase()}</b>
                  <p>{event.text}</p>
                </div>
              </li>
            ))}
          </ol>
          {!state.history.length && (
            <p className="sf-muted">Open the manager’s message to begin.</p>
          )}
        </section>
      );
    return reflection();
  }
  function reflection() {
    if (!state) return null;
    if (state.stage !== "complete")
      return (
        <section className="sf-panel">
          <span className="sf-kicker">TWO PERSPECTIVES, YOUR EXPERIENCE</span>
          <h2>How did the work feel?</h2>
          <p className="sf-muted">
            Your interests are self-reported and kept separate from task
            performance. Submit a QA report before completing this reflection.
          </p>
          <fieldset
            className="sf-form"
            disabled={busy || state.stage !== "qa" || !state.reports.length}
          >
            <div className="sf-form-grid">
              {["support", "qa"].map((role) => (
                <label className="sf-field" key={role}>
                  Interest in {role === "support" ? "Customer Support" : "QA"}
                  <select
                    value={draft[`interest-${role}`] || ""}
                    onChange={(e) =>
                      setDraft(`interest-${role}`, e.target.value)
                    }
                  >
                    <option value="" disabled>
                      Select your interest
                    </option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} —{" "}
                        {n === 1
                          ? "Not for me"
                          : n === 5
                            ? "Would like more"
                            : "Some interest"}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <label className="sf-field">
              Preferred work style
              <select
                value={draft.preference || "unsure"}
                onChange={(e) => setDraft("preference", e.target.value)}
              >
                <option value="unsure">Still exploring</option>
                <option value="people">
                  Helping people and explaining decisions
                </option>
                <option value="investigation">
                  Investigating patterns and testing systems
                </option>
                <option value="both">A mix of both</option>
              </select>
            </label>
            <Button
              onClick={async () => {
                if (
                  await act({
                    type: "SCENARIO_COMPLETED",
                    supportInterest: Number(draft["interest-support"]),
                    qaInterest: Number(draft["interest-qa"]),
                    preference: (draft.preference || "unsure") as
                      | "people"
                      | "investigation"
                      | "both"
                      | "unsure",
                  })
                ) {
                  setToast(
                    "Both perspectives completed. Your comparison is ready.",
                  );
                }
              }}
            >
              Build my career comparison <ArrowRight size={16} />
            </Button>
          </fieldset>
          {!state.reports.length && (
            <Button
              secondary
              onClick={() =>
                goApp(state.stage === "support" ? "orders" : "sandbox")
              }
            >
              Continue the incident
            </Button>
          )}
        </section>
      );
    const support = assessSupport(state),
      qa = state.reports.at(-1)!;
    return (
      <>
        <section className="sf-report-hero">
          <Badge tone="green">
            <CheckCircle2 size={13} /> Two perspectives completed
          </Badge>
          <h2>What you learned by doing.</h2>
          <p>
            One incident, two different kinds of work. Here’s the evidence
            behind your decisions.
          </p>
          <div className="sf-actions">
            <Button secondary onClick={exportRun}>
              <Download size={16} />
              Export work record
            </Button>
            <Button secondary onClick={() => setDialog("replay")}>
              <RotateCcw size={16} />
              Fresh replay
            </Button>
          </div>
        </section>
        <div className="sf-two-column">
          <AssessmentCard title="Customer Support" data={support} />
          <AssessmentCard title="QA Tester" data={qa.score} />
        </div>
        <section className="sf-panel">
          <h3>Your interest, in your own words</h3>
          <div className="sf-interest-grid">
            <div>
              <span>Customer Support</span>
              <strong>{state.interest!.support}/5</strong>
            </div>
            <div>
              <span>QA Tester</span>
              <strong>{state.interest!.qa}/5</strong>
            </div>
            <div>
              <span>Preferred work style</span>
              <strong>{state.interest!.preference}</strong>
            </div>
          </div>
          <p className="sf-muted">
            These ratings came from you. Task scores do not determine whether a
            career is right for you.
          </p>
        </section>
        <section className="sf-panel">
          <h3>Consequences you carried forward</h3>
          <div className="sf-impact-grid">
            <div>
              <span>Customer refunds</span>
              <b>{money(state.impact.refunded)}</b>
            </div>
            <div>
              <span>Excess refunds</span>
              <b>{money(state.impact.excessRefund)}</b>
            </div>
            <div>
              <span>Still owed</span>
              <b>{money(state.impact.unresolvedOvercharge)}</b>
            </div>
            <div>
              <span>QA delay</span>
              <b>{state.impact.qaDelay} min</b>
            </div>
          </div>
          <p>
            {qa.ready
              ? "Your final report is ready for an engineering handoff. The defect still needs to be fixed and retested."
              : "Your final report still needs clarification. You can practice a clearer report in the follow-up exercise."}
          </p>
          <p className="sf-muted">
            Simulated work: Support {state.roleMinutes.support} min · QA{" "}
            {state.roleMinutes.qa} min · {state.hints.length} hints used.
          </p>
        </section>
        <section className="sf-panel">
          <h3>Your next step</h3>
          <p>{recommendation(state)}</p>
          <div className="sf-actions">
            <Button
              onClick={() => {
                setFollowup(true);
                goApp("sandbox");
              }}
            >
              Practice the shipping boundary <ArrowRight size={16} />
            </Button>
            <Button
              secondary
              disabled={busy}
              onClick={async () => {
                await chat("reflection");
                goApp("chat");
              }}
            >
              Ask for {aiReady ? "AI" : "guided"} reflection{" "}
              <Sparkles size={16} />
            </Button>
          </div>
        </section>
        <section className="sf-pro-strip">
          <div>
            <Badge>CAREERVERSE PRO · CONCEPT</Badge>
            <h3>Make your next workday a little less unfamiliar.</h3>
            <p>Explore the subscription proposal after your free practice.</p>
          </div>
          <Button secondary onClick={() => navigate("pricing")}>
            View plans <ArrowRight size={16} />
          </Button>
        </section>
      </>
    );
  }
  if (screen === "pm")
    return (
      <>
        <div className="sf-legacy-banner">
          <button onClick={() => navigate("home")}>
            <ArrowLeft size={15} />
            Back to ShopFlow
          </button>
          <span>Earlier Project Management practice</span>
        </div>
        <CareerVerse />
      </>
    );
  if (!ready)
    return (
      <main className="sf-loading">
        <Orbit size={32} />
        <p>Opening CareerVerse…</p>
      </main>
    );
  return (
    <div
      className={`sf-app ${screen === "workspace" && state ? "sf-at-work" : ""}`}
    >
      <header className="sf-topbar">
        <button className="sf-brand" onClick={() => navigate("home")}>
          <span>
            <Orbit size={23} />
          </span>
          CareerVerse
        </button>
        <nav aria-label="Main navigation">
          <button
            aria-current={screen === "home" ? "page" : undefined}
            onClick={() => navigate("home")}
          >
            Explore
          </button>
          <button
            aria-current={screen === "path" ? "page" : undefined}
            onClick={() => navigate("path")}
          >
            My career path
          </button>
          <button
            aria-current={screen === "pricing" ? "page" : undefined}
            onClick={() => navigate("pricing")}
          >
            Plans
          </button>
        </nav>
        <div className="sf-guest">
          <Badge>Guest workspace</Badge>
          <span className="sf-avatar">You</span>
        </div>
      </header>
      {error && (
        <div role="alert" className="sf-error">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {screen === "home" && (
        <main className="sf-home">
          <section className="sf-home-hero">
            <div>
              <span className="sf-kicker">
                LESS GUESSING. MORE FIRSTHAND EXPERIENCE.
              </span>
              <h1>
                One crisis.
                <br />
                Two careers.
                <br />
                <em>Your next move.</em>
              </h1>
              <p>
                Before you commit to a new career, try the work. Step into a
                company, make real decisions in a simulated incident, and see it
                through someone else’s eyes.
              </p>
              <div className="sf-actions">
                <Button
                  onClick={() =>
                    run ? navigate("workspace") : setDialog("intro")
                  }
                >
                  {run ? "Continue your practice" : "Try CareerVerse"}
                  <ArrowRight size={18} />
                </Button>
                <span className="sf-small">
                  Free · no sign-up
                  <br />
                  About 20–30 minutes
                </span>
              </div>
            </div>
            <div className="sf-incident-preview">
              <div className="sf-preview-top">
                <span>
                  <span className="sf-shop-mark">S</span>ShopFlow Inc.
                </span>
                <Badge tone="amber">Incident in progress</Badge>
              </div>
              <div className="sf-preview-message">
                <span className="sf-avatar">AM</span>
                <div>
                  <b>Avery · Support Lead</b>
                  <p>
                    “Customers are reporting unexpected charges. Can you find
                    out what’s happening?”
                  </p>
                </div>
              </div>
              <div className="sf-preview-order">
                <span>ORDER SF-1042</span>
                <strong>$100.00</strong>
                <small>Charged with SAVE20 applied</small>
                <div>
                  <span>Customer complaint</span>
                  <Badge tone="amber">Needs investigation</Badge>
                </div>
              </div>
              <div className="sf-perspective-visual">
                <span>
                  <Headphones size={19} />
                  Support
                </span>
                <ArrowRight size={22} />
                <span>
                  <FlaskConical size={19} />
                  QA Tester
                </span>
              </div>
              <p className="sf-preview-caption">
                Your decisions in one role become the next role’s reality.
              </p>
            </div>
          </section>
          <section className="sf-careers-section">
            <div className="sf-section-title">
              <div>
                <span className="sf-kicker">CHOOSE A PERSPECTIVE</span>
                <h2>Different work. One connected story.</h2>
              </div>
              <label className="sf-career-search">
                <Search size={17} />
                <input
                  aria-label="Search available careers"
                  placeholder="Find a career…"
                  value={careerSearch}
                  onChange={(e) => setCareerSearch(e.target.value)}
                />
              </label>
            </div>
            <div className="sf-career-grid">
              {[
                {
                  name: "Customer Support Specialist",
                  role: "support",
                  icon: Headphones,
                  tag: "START HERE",
                  text: "Make sense of customer complaints. Investigate charges, decide refunds, and explain what happens next.",
                  skills: ["Empathy", "Communication", "Judgment"],
                },
                {
                  name: "Junior QA Tester",
                  role: "qa",
                  icon: FlaskConical,
                  tag: "PERSPECTIVE TWO",
                  text: "Follow the evidence. Test a working checkout, isolate a defect, and write a report another teammate can reproduce.",
                  skills: ["Investigation", "Precision", "Documentation"],
                },
              ]
                .filter((c) =>
                  `${c.name} ${c.skills.join(" ")}`
                    .toLowerCase()
                    .includes(careerSearch.toLowerCase()),
                )
                .map((c) => (
                  <article className={`sf-career-card ${c.role}`} key={c.role}>
                    <div>
                      <span className="sf-career-icon">
                        <c.icon size={27} />
                      </span>
                      <Badge>{c.tag}</Badge>
                    </div>
                    <h3>{c.name}</h3>
                    <p>{c.text}</p>
                    <div className="sf-skill-tags">
                      {c.skills.map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        if (run) {
                          navigate("workspace");
                          if (c.role === "qa") setApp("tasks");
                        } else setDialog("intro");
                      }}
                    >
                      {c.role === "support"
                        ? "Start with the customer"
                        : "Discover the connected QA role"}
                      <ArrowRight size={17} />
                    </button>
                  </article>
                ))}
            </div>
            {careerSearch &&
              !["customer support specialist empathy communication judgment", "junior qa tester investigation precision documentation"].some((keywords) => keywords.includes(careerSearch.toLowerCase())) && (
                <p className="sf-muted">
                  No careers match this search. Try “Support” or “QA”. More careers are
                  planned.
                </p>
              )}
          </section>
          <section className="sf-how">
            <div>
              <span>01</span>
              <h3>Step into a real kind of problem</h3>
              <p>
                Messages, orders, policies and a deadline. Everything you need
                to get started.
              </p>
            </div>
            <div>
              <span>02</span>
              <h3>Change seats, keep the consequences</h3>
              <p>
                Your QA self inherits the handoff your Support self created.
              </p>
            </div>
            <div>
              <span>03</span>
              <h3>Find your next practice step</h3>
              <p>
                Compare evidence and your own interests. Try again with a
                different approach.
              </p>
            </div>
          </section>
          <footer className="sf-home-footer">
            <span>Fictional company. Practical decisions.</span>
            <button onClick={() => navigate("pm")}>
              Earlier PM practice <ArrowUpRight size={13} />
            </button>
          </footer>
        </main>
      )}
      {screen === "workspace" && state && (
        <div className="sf-workstation">
          <aside className="sf-sidebar">
            <div className="sf-company">
              <span className="sf-shop-mark">S</span>
              <div>
                <b>ShopFlow</b>
                <small>Employee workspace</small>
              </div>
            </div>
            <div className="sf-role">
              <span>YOUR PERSPECTIVE</span>
              <b>
                {state.stage === "support" ? (
                  <Headphones size={17} />
                ) : (
                  <FlaskConical size={17} />
                )}{" "}
                {state.stage === "support" ? "Customer Support" : "QA Tester"}
              </b>
              <small>
                {state.stage === "complete"
                  ? "Incident reviewed"
                  : "The Checkout Crisis"}
              </small>
            </div>
            <nav aria-label="Workplace applications">
              {apps.map((a) => (
                <button
                  key={a.id}
                  aria-current={app === a.id ? "page" : undefined}
                  onClick={() => goApp(a.id)}
                >
                  <a.icon size={18} />
                  <span>{a.label}</span>
                  {a.id === "inbox" && <small>{4 - state.read.length}</small>}
                </button>
              ))}
            </nav>
            <div className="sf-sidebar-bottom">
              <span className="sf-small">Connected run</span>
              <p>
                Same incident.
                <br />
                Different perspective.
              </p>
              <Button
                disabled={busy}
                onClick={() =>
                  state.stage === "support"
                    ? setDialog("shift")
                    : goApp("report")
                }
              >
                {state.stage === "support"
                  ? "Perspective Shift"
                  : "Compare my roles"}
                <ArrowRight size={15} />
              </Button>
            </div>
          </aside>
          <main className="sf-work-main">
            <header className="sf-work-header">
              <div>
                <span className="sf-kicker">
                  SHOPFLOW / THE CHECKOUT CRISIS
                </span>
                <h1>{apps.find((a) => a.id === app)!.label}</h1>
              </div>
              <div className="sf-work-clock">
                <Clock3 size={17} />
                <strong>{clock(state.minutes)}</strong>
                <span>simulated time</span>
              </div>
            </header>
            <div className="sf-incident-status">
              <Badge
                tone={state.qaTicket?.status === "Done" ? "green" : "amber"}
              >
                {state.qaTicket?.status === "Done"
                  ? "Ready for engineering"
                  : "Investigation open"}
              </Badge>
              <span>
                Release at 11:00 ·{" "}
                {state.minutes >= 120
                  ? "release time reached — investigation still matters"
                  : `${120 - state.minutes} simulated minutes left`}
              </span>
              <button
                onClick={() => setDialog("replay")}
                disabled={busy}
                aria-label="Start a fresh replay"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            {busy && (
              <div role="status" className="sf-saving">
                <LoaderCircle className="spin" size={14} />
                Processing your action…
              </div>
            )}
            {toast && (
              <div role="status" className="sf-toast">
                <CheckCircle2 size={16} />
                {toast}
              </div>
            )}
            <div className="sf-work-content">{workspaceContent()}</div>
            <footer className="sf-work-footer">
              <span>
                <i />
                Progress saved on this device
              </span>
              <button onClick={exportRun}>
                Export work <Download size={13} />
              </button>
              <span>Run {run!.id.slice(0, 8)}</span>
            </footer>
          </main>
        </div>
      )}
      {screen === "workspace" && !state && (
        <main className="sf-page">
          <h1>Your first shift is waiting.</h1>
          <Button onClick={() => setDialog("intro")}>Start the incident</Button>
        </main>
      )}
      {screen === "path" && (
        <main className="sf-page">
          <span className="sf-kicker">MY CAREER PATH</span>
          <h1>Every attempt teaches you something.</h1>
          <p className="sf-page-intro">
            Your runs stay separate. Come back to unfinished work, compare your
            decisions, or start again from clean conditions.
          </p>
          {!progress.runs.length ? (
            <section className="sf-panel">
              <h2>Begin with two perspectives.</h2>
              <p>
                Complete the Checkout Crisis to discover what you want to
                practice next.
              </p>
              <Button onClick={() => setDialog("intro")}>
                Try CareerVerse <ArrowRight size={16} />
              </Button>
            </section>
          ) : (
            <>
              <div className="sf-path-grid">
                {progress.runs.map((r, i) => {
                  const s = replay(r);
                  return (
                    <article className="sf-panel" key={r.id}>
                      <div className="sf-panel-heading">
                        <Badge
                          tone={s.stage === "complete" ? "green" : "amber"}
                        >
                          {s.stage === "complete" ? "Completed" : "In progress"}
                        </Badge>
                        <small>Attempt {i + 1}</small>
                      </div>
                      <h2>The Checkout Crisis</h2>
                      <p className="sf-muted">
                        {new Date(r.createdAt).toLocaleDateString("en-US")} ·{" "}
                        {r.events.length} recorded actions
                      </p>
                      <div className="sf-run-stats">
                        <span>
                          Support{" "}
                          <b>
                            {s.stage !== "support"
                              ? `${assessSupport(s).total}/100`
                              : "In progress"}
                          </b>
                        </span>
                        <span>
                          QA{" "}
                          <b>
                            {s.reports.at(-1)?.score.total ?? "Not yet"}
                            {s.reports.length ? "/100" : ""}
                          </b>
                        </span>
                      </div>
                      {s.interest && (
                        <p className="sf-muted">
                          Interest: Support {s.interest.support}/5 · QA{" "}
                          {s.interest.qa}/5
                        </p>
                      )}
                      <Button
                        secondary
                        onClick={() => {
                          try {
                            commit((p) => ({ ...p, active: r.id }));
                            setApp(
                              s.stage === "complete"
                                ? "report"
                                : s.stage === "qa"
                                  ? "tasks"
                                  : "inbox",
                            );
                            setFollowup(false);
                            navigate("workspace");
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      >
                        {s.stage === "complete"
                          ? "View comparison"
                          : "Continue your practice"}
                        <ArrowRight size={16} />
                      </Button>
                    </article>
                  );
                })}
              </div>
              {state?.stage === "complete" && (
                <section className="sf-followup-card">
                  <span className="sf-career-icon">
                    <FlaskConical size={28} />
                  </span>
                  <div>
                    <Badge
                      tone={
                        state.followupReports.at(-1)?.ready ? "green" : "muted"
                      }
                    >
                      {state.followupReports.at(-1)?.ready
                        ? "Completed · replay available"
                        : "FREE FOLLOW-UP"}
                    </Badge>
                    <h2>The $75 shipping boundary</h2>
                    <p>
                      Practice a different test case and sharpen your bug
                      report. 5–10 minutes.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setFollowup(true);
                      setApp("sandbox");
                      navigate("workspace");
                    }}
                  >
                    Continue practice <ArrowRight size={16} />
                  </Button>
                </section>
              )}
              <Button secondary onClick={() => setDialog("replay")}>
                <Plus size={16} />
                Fresh replay
              </Button>
            </>
          )}
          <section className="sf-pro-strip">
            <div>
              <Badge>PRO SCENARIO · DEMO</Badge>
              <h3>The double-refund incident</h3>
              <p>
                A future advanced scenario for ownership, handoffs and customer
                trust.
              </p>
            </div>
            <Button secondary onClick={() => setDialog("upgrade")}>
              {progress.demoPro ? "View demo access" : "Unlock with Pro"}
              <ArrowRight size={16} />
            </Button>
          </section>
        </main>
      )}
      {screen === "pricing" && (
        <main className="sf-page sf-pricing">
          <span className="sf-kicker">KEEP EXPLORING</span>
          <h1>Try the work. Then choose your next step.</h1>
          <p className="sf-page-intro">
            The complete two-role incident and one follow-up are free. Pro is a
            pricing hypothesis for this hackathon — no real payments are
            collected.
          </p>
          <div className="sf-pricing-grid">
            <section className="sf-panel">
              <Badge>CAREER EXPLORER</Badge>
              <h2>
                Free <small>forever for this demo</small>
              </h2>
              <ul>
                {[
                  "The complete Checkout Crisis",
                  "Customer Support + QA perspectives",
                  "Evidence-based career comparison",
                  "One repeatable follow-up exercise",
                  "Saved progress and work record export",
                ].map((t) => (
                  <li key={t}>
                    <Check size={16} />
                    {t}
                  </li>
                ))}
              </ul>
              <Button
                secondary
                onClick={() =>
                  run ? navigate("workspace") : setDialog("intro")
                }
              >
                {run ? "Continue free practice" : "Start free"}
                <ArrowRight size={16} />
              </Button>
            </section>
            <section className="sf-panel sf-pro-plan">
              <Badge tone="purple">CAREERVERSE PRO · PROPOSED</Badge>
              <h2>
                $29 <small>/ month</small>
              </h2>
              <p className="sf-muted">
                Planned benefits — not all available in the MVP.
              </p>
              <ul>
                {[
                  "New workplace incidents",
                  "Advanced role simulations",
                  "Practice based on your skill gaps",
                  "Historical progress comparisons",
                  "Job-description-aligned practice",
                  "Interview preparation from your decisions",
                ].map((t) => (
                  <li key={t}>
                    <Check size={16} />
                    {t}
                  </li>
                ))}
              </ul>
              <Button onClick={() => setDialog("upgrade")}>
                {progress.demoPro
                  ? "Manage demo access"
                  : "Try simulated upgrade"}
                <ArrowRight size={16} />
              </Button>
              <small>No checkout. No card. No charge.</small>
            </section>
          </div>
        </main>
      )}
      <Dialog
        open={!!dialog}
        onClose={() => {
          if (!busy) setDialog(null);
        }}
        className="sf-dialog"
      >
        <DialogBackdrop className="sf-dialog-backdrop" />
        <div className="sf-dialog-position">
          <DialogPanel className="sf-dialog-panel">
            <button
              className="sf-dialog-close"
              aria-label="Close dialog"
              disabled={busy}
              onClick={() => setDialog(null)}
            >
              <X size={21} />
            </button>
            {dialog === "intro" && (
              <>
                <span className="sf-shop-mark">S</span>
                <Badge tone="purple">YOUR FIRST CONNECTED INCIDENT</Badge>
                <DialogTitle>The Checkout Crisis</DialogTitle>
                <Description>
                  ShopFlow’s customers are being charged unexpected amounts. The
                  next promotion release is at 11:00. Your first shift starts
                  now.
                </Description>
                <div className="sf-intro-steps">
                  <div>
                    <Headphones size={23} />
                    <span>
                      <b>1. Customer Support</b>
                      <small>
                        Investigate orders, decide refunds and hand off the
                        issue.
                      </small>
                    </span>
                  </div>
                  <div>
                    <FlaskConical size={23} />
                    <span>
                      <b>2. Junior QA Tester</b>
                      <small>
                        Inherit your decisions, reproduce the bug and report it.
                      </small>
                    </span>
                  </div>
                  <div>
                    <TrendingUp size={23} />
                    <span>
                      <b>3. Your career comparison</b>
                      <small>
                        See your evidence, share your interests and practice
                        again.
                      </small>
                    </span>
                  </div>
                </div>
                <p className="sf-muted">
                  Everything is fictional. Refunds move simulated money only.
                  Your progress stays on this device.
                </p>
                <Button disabled={busy} onClick={begin}>
                  {busy ? "Opening your workspace…" : "Start my shift"}
                  <ArrowRight size={17} />
                </Button>
              </>
            )}
            {dialog === "shift" && (
              <>
                <Badge tone="purple">PERSPECTIVE SHIFT</Badge>
                <DialogTitle>Same incident. A new seat.</DialogTitle>
                <Description>
                  You’re about to become the QA Tester who receives your own
                  Support handoff. Refunds, messages, evidence and elapsed time
                  will stay exactly as you left them.
                </Description>
                <div className="sf-shift-summary">
                  <p>
                    <b>{Object.keys(state?.refunds || {}).length}/3</b> refund
                    decisions
                  </p>
                  <p>
                    <b>{Object.keys(state?.replies || {}).length}/3</b> customer
                    replies
                  </p>
                  <p>
                    <b>{state?.escalation ? "Created" : "Missing"}</b>{" "}
                    escalation
                  </p>
                </div>
                {!state?.escalation && (
                  <p className="sf-notice amber">
                    Without an escalation, QA will receive an untriaged ticket
                    and lose 15 simulated minutes rebuilding the evidence.
                  </p>
                )}
                <Button
                  disabled={
                    busy || Object.keys(state?.replies || {}).length < 3
                  }
                  onClick={async () => {
                    if (
                      await act({
                        type: "ROLE_SWITCHED",
                        skipEscalation: !state?.escalation,
                      })
                    ) {
                      setDialog(null);
                      setFollowup(false);
                      goApp("tasks");
                    }
                  }}
                >
                  {state?.escalation
                    ? "Switch to QA Tester"
                    : "Continue without escalation"}
                  <ArrowRight size={17} />
                </Button>
                <Button
                  secondary
                  onClick={() => {
                    setDialog(null);
                    goApp("tasks");
                  }}
                >
                  Review the handoff first
                </Button>
              </>
            )}
            {dialog === "replay" && (
              <>
                <Badge>FRESH REPLAY</Badge>
                <DialogTitle>A clean start. A separate result.</DialogTitle>
                <Description>
                  Your current run stays in My Career Path. The new run begins
                  with the original orders, no refunds, no escalation and a
                  fresh clock.
                </Description>
                <Button disabled={busy} onClick={begin}>
                  Start independent replay <RotateCcw size={16} />
                </Button>
                <Button secondary onClick={() => setDialog(null)}>
                  Keep this run open
                </Button>
              </>
            )}
            {dialog === "upgrade" && (
              <>
                <Badge tone="purple">SIMULATED UPGRADE · NO PAYMENT</Badge>
                <DialogTitle>
                  {progress.demoPro
                    ? "Demo Pro access is active"
                    : "Go further with CareerVerse Pro"}
                </DialogTitle>
                <Description>
                  {progress.demoPro
                    ? "Your local demo entitlement is enabled. Advanced incidents are planned and are not playable in this MVP. The free follow-up exercise is available now."
                    : "This tests the upgrade flow for a proposed $29/month subscription. No card details are requested and no money is charged."}
                </Description>
                <div className="sf-notice">
                  The double-refund incident is a Pro-only content preview.
                  Enabling demo access reveals its brief, not a finished
                  simulation.
                </div>
                {progress.demoPro ? (
                  <>
                    <div className="sf-pro-brief">
                      <h3>Unlocked brief: The double-refund incident</h3>
                      <p>
                        A customer contacted two agents. Both issued a refund.
                        Investigate ownership, identify the duplicated action
                        and propose a safer handoff. Full scenario: planned.
                      </p>
                    </div>
                    <Button
                      secondary
                      onClick={() => {
                        try {
                          commit((p) => ({ ...p, demoPro: false }));
                          setDialog(null);
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Reset demo upgrade
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      try {
                        commit((p) => ({ ...p, demoPro: true }));
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Enable demo Pro · $0 charged <ArrowRight size={16} />
                  </Button>
                )}
                <button
                  className="sf-text-button"
                  onClick={() => {
                    setDialog(null);
                    navigate("path");
                  }}
                >
                  Back to free practice
                </button>
              </>
            )}
            {error && (
              <p className="sf-dialog-error" role="alert">
                {error}
              </p>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
