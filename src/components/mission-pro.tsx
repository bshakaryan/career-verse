"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const plans = [
  { id: "monthly", title: "Monthly", price: "$20", period: "month", detail: "Billed monthly" },
  { id: "yearly", title: "Yearly", price: "$100", period: "year", detail: "Save $140 compared with 12 monthly payments" },
] as const;
type Plan = (typeof plans)[number]["id"];
type View = "library" | "case" | "courses" | "review";

const courses = [
  {
    title: "Release decisions for QA",
    lesson: "Check the most important user journey first. If a customer cannot tell whether a payment went through, record what the customer sees and compare it with the order record. Use that evidence when you recommend holding a release.",
  },
  {
    title: "Writing a bug report from evidence",
    lesson: "Record the scenario, steps, expected behavior and actual result. In a payment timeout, distinguish the message on screen from the payment status in the order record. Include both so another tester can repeat your check.",
  },
];
const cases = [
  { label: "Normal connection", result: "Checkout shows Paid. Order record shows Paid." },
  { label: "Connection drops after payment", result: "Checkout shows Failed. Order record shows Paid." },
];

function readFlag(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function saveFlag(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* This session still works. */ }
}

export default function MissionPro({ onBack }: { onBack: () => void }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [view, setView] = useState<View>("library");
  const [checked, setChecked] = useState<string[]>([]);
  const [decision, setDecision] = useState<"hold" | "release" | null>(null);
  const [caseDone, setCaseDone] = useState(false);
  const [courseDone, setCourseDone] = useState<string[]>([]);
  const [work, setWork] = useState("");
  const [reviewReady, setReviewReady] = useState(false);

  useEffect(() => {
    const savedPlan = readFlag("careerverse-pro-plan");
    if (savedPlan === "monthly" || savedPlan === "yearly") setPlan(savedPlan);
    setCaseDone(readFlag("careerverse-pro-case") === "done");
    setCourseDone(courses.filter(({ title }) => readFlag("careerverse-course-" + title) === "done").map(({ title }) => title));
    const savedWork = readFlag("careerverse-pro-review");
    if (savedWork) {
      setWork(savedWork);
      setReviewReady(true);
    }
  }, []);

  function changeView(next: View) {
    setView(next);
    window.scrollTo({ top: 0 });
  }

  if (!plan) return (
    <>
      <button className="mission-course-back" onClick={onBack}><ArrowLeft size={15} /> Back to Learn</button>
      <span className="mission-kicker">CAREERVERSE PRO</span>
      <h1>Practice beyond your first mission.</h1>
      <p className="mission-course-intro">Both plans include advanced cases, courses and progress tracking, and feedback from a specialist on submitted work.</p>
      <p className="mission-demo-note">MVP demo · Plan selection unlocks a preview. No payment is collected. Specialist feedback is shown as an example.</p>
      <div className="mission-plan-grid">
        {plans.map((item) => (
          <article className="mission-pro-card" key={item.id}>
            <h2>{item.title}</h2>
            <p className="mission-plan-price">{item.price} <small>/ {item.period}</small></p>
            <p>{item.detail}</p>
            <button className="mission-primary" onClick={() => {
              saveFlag("careerverse-pro-plan", item.id);
              setPlan(item.id);
            }}>Try {item.title.toLowerCase()} demo <ArrowRight size={16} /></button>
          </article>
        ))}
      </div>
    </>
  );

  const active = plans.find((item) => item.id === plan)!;
  return (
    <>
      <button className="mission-course-back" onClick={view === "library" ? onBack : () => changeView("library")}>
        <ArrowLeft size={15} /> {view === "library" ? "Back to Learn" : "Back to Pro workspace"}
      </button>
      <span className="mission-kicker">PRO DEMO · {active.title.toUpperCase()} · {active.price}/{active.period}</span>
      {view === "library" && (
        <>
          <h1>Your Pro workspace</h1>
          <p className="mission-course-intro">Your case and course progress is saved on this device.</p>
          <div className="mission-pro-library">
            <article className="mission-pro-card">
              <h2>QA case · Checkout after a timeout</h2>
              <p>{caseDone ? "Case completed" : "Compare checkout and order records. Decide whether to release."}</p>
              <button className="mission-primary" onClick={() => changeView("case")}>{caseDone ? "Review QA case" : "Start QA case"}</button>
            </article>
            <article className="mission-pro-card">
              <h2>Courses</h2>
              <p>{courseDone.length} of {courses.length} courses completed</p>
              <button className="mission-primary" onClick={() => changeView("courses")}>Open courses</button>
            </article>
            <article className="mission-pro-card">
              <h2>Specialist feedback</h2>
              <p>Save a report draft and see what a review could cover.</p>
              <button className="mission-primary" onClick={() => changeView("review")}>Try feedback demo</button>
            </article>
          </div>
          <button className="mission-secondary" onClick={() => {
            saveFlag("careerverse-pro-plan", "");
            setPlan(null);
          }}>View both plans</button>
        </>
      )}
      {view === "case" && (
        <section className="mission-course-detail">
          <h1>Checkout after a timeout</h1>
          <p>The release is in an hour. Check that the customer and the order record agree about whether a payment went through.</p>
          <div className="mission-pro-stack">
            {cases.map((test) => (
              <section className="mission-pro-card" key={test.label}>
                <h2>{test.label}</h2>
                <button className="mission-secondary" onClick={() => {
                  if (!checked.includes(test.label)) setChecked([...checked, test.label]);
                }}>Run {test.label.toLowerCase()} check</button>
                {checked.includes(test.label) && <p role="status">{test.result}</p>}
              </section>
            ))}
            {checked.length === cases.length && (
              <>
                <h2>Would you release this build?</h2>
                <div className="mission-action-row">
                  <button className="mission-primary" onClick={() => {
                    setDecision("hold");
                    setCaseDone(true);
                    saveFlag("careerverse-pro-case", "done");
                  }}>Hold the release</button>
                  <button className="mission-secondary" onClick={() => setDecision("release")}>Approve release</button>
                </div>
                {decision && <p role="status">{decision === "hold"
                  ? "Case complete. The customer sees a failure even though the order is paid. Report the mismatch before release."
                  : "Compare the two records in the timeout test. Could the customer think they still need to pay?"}</p>}
                {decision === "hold" && <button className="mission-primary" onClick={() => changeView("review")}>Draft a report for review</button>}
              </>
            )}
          </div>
        </section>
      )}
      {view === "courses" && (
        <>
          <h1>Pro courses</h1>
          <div className="mission-pro-stack">
            {courses.map(({ title, lesson }) => (
              <article className="mission-pro-card" key={title}>
                <h2>{title}</h2><p>{lesson}</p>
                <button className="mission-primary" disabled={courseDone.includes(title)} onClick={() => {
                  saveFlag("careerverse-course-" + title, "done");
                  setCourseDone([...courseDone, title]);
                }}>{courseDone.includes(title) ? <><Check size={15} /> Completed</> : "Mark lesson complete"}</button>
              </article>
            ))}
          </div>
        </>
      )}
      {view === "review" && (
        <section className="mission-course-detail">
          <h1>Specialist feedback demo</h1>
          <p>Draft a short QA report with the steps, what you expected and what you saw. Your draft stays on this device.</p>
          <form className="mission-pro-stack" onSubmit={(event) => {
            event.preventDefault();
            if (!work.trim()) return;
            saveFlag("careerverse-pro-review", work.trim());
            setReviewReady(true);
          }}>
            <label>QA report draft
              <textarea required rows={5} maxLength={1600} value={work} onChange={(event) => {
                setWork(event.target.value);
                setReviewReady(false);
              }} />
            </label>
            <button className="mission-primary" type="submit" disabled={!work.trim()}>Save draft and see sample feedback</button>
          </form>
          {reviewReady && (
            <div className="mission-demo-note" role="status">
              <strong>Draft saved · Example review</strong>
              <p>State when the connection drops and list both results: the checkout displays Failed while the order record shows Paid. Add the expected message and explain why the mismatch should block release.</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}
