"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import ProCasePractice from "./pro-case-practice";
import { assessAttempt, newPractice, proCaseKey, readPractice, type ProPractice } from "@/lib/shopflow/pro-case";

const plans = [
  { id: "monthly", title: "Monthly", price: 29, period: "month", detail: "Billed monthly" },
  { id: "yearly", title: "Yearly", price: 290, period: "year", detail: "Billed annually" },
] as const;
const annualSavings = plans[0].price * 12 - plans[1].price;
const planBenefits = [
  "Advanced practice cases",
  "Pro courses",
  "Learning progress tracking",
  "Personal feedback on your decisions",
  "AI review of your written reports",
];
type Plan = (typeof plans)[number]["id"];
type View = "plans" | "library" | "case" | "courses" | "review";

const proCourses = [
  {
    title: "Release decisions for QA",
    summary: "Decide whether a build is ready to release based on test results.",
    lesson: "Check the most important user journey first. If a customer cannot tell whether a payment went through, record what the customer sees and compare it with the order record. Use that evidence when you recommend holding a release.",
  },
  {
    title: "Writing a bug report from evidence",
    summary: "Turn a payment mismatch into a report another tester can verify.",
    lesson: "Record the scenario, steps, expected behavior and actual result. In a payment timeout, distinguish the message on screen from the payment status in the order record. Include both so another tester can repeat your check.",
  },
];

function readFlag(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function saveFlag(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* This session still works. */ }
}

export function useProCourseAccess() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const savedPlan = readFlag("careerverse-pro-plan");
    if (savedPlan === "monthly" || savedPlan === "yearly") setPlan(savedPlan);
    setCompleted(proCourses.filter(({ title }) => readFlag("careerverse-course-" + title) === "done").map(({ title }) => title));
  }, []);

  function selectPlan(next: Plan) {
    saveFlag("careerverse-pro-plan", next);
    setPlan(next);
  }

  function completeCourse(title: string) {
    saveFlag("careerverse-course-" + title, "done");
    setCompleted((current) => current.includes(title) ? current : [...current, title]);
  }

  return { plan, selectPlan, completed, completeCourse };
}

export function ProCourseCards({
  access,
  onPricing,
}: {
  access: ReturnType<typeof useProCourseAccess>;
  onPricing: () => void;
}) {
  return (
    <div className="mission-plan-grid">
      {proCourses.map(({ title, summary, lesson }) => (
        <article className="mission-pro-card" key={title}>
          <div><span className="mission-course-badge mission-pro-badge">PRO</span></div>
          <h2>{title}</h2>
          <p>{summary}</p>
          {access.plan ? (
            <details className="mission-course-open">
              <summary>{access.completed.includes(title) ? "Review course · Completed" : "Open course"}</summary>
              <p>{lesson}</p>
              <button className="mission-primary" disabled={access.completed.includes(title)}
                onClick={() => access.completeCourse(title)}>
                {access.completed.includes(title) ? <><Check size={15} /> Completed</> : "Mark lesson complete"}
              </button>
            </details>
          ) : (
            <button className="mission-secondary" onClick={onPricing}>View Pro plans <ArrowRight size={15} /></button>
          )}
        </article>
      ))}
    </div>
  );
}

export default function MissionPro({ onBack }: { onBack: () => void }) {
  const access = useProCourseAccess();
  const { plan } = access;
  const [view, setView] = useState<View>("plans");
  const [practice, setPractice] = useState<ProPractice>(newPractice);
  const [practiceReady, setPracticeReady] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const caseDone = !!practice.current.report;

  useEffect(() => {
    setPractice(readPractice(readFlag(proCaseKey)));
    setPracticeReady(true);
  }, []);

  function updatePractice(next: ProPractice) {
    setPractice(next);
    try {
      localStorage.setItem(proCaseKey, JSON.stringify(next));
      setSaveError(false);
    } catch { setSaveError(true); }
  }

  function changeView(next: View) {
    setView(next);
    window.scrollTo({ top: 0 });
  }

  if (!plan || view === "plans") return (
    <>
      <button className="mission-course-back" onClick={onBack}><ArrowLeft size={15} /> Back to Learn</button>
      <h1>CareerVerse Pro</h1>
      <div className="mission-plan-grid mission-pricing-grid">
        {plans.map((item) => (
          <article className={`mission-pro-card mission-pricing-card ${item.id === "yearly" ? "mission-pricing-yearly" : ""}`} key={item.id}>
            <div className="mission-pricing-card-title">
              <h2>{item.title}</h2>
              {item.id === "yearly" && <span>Save ${annualSavings} a year</span>}
            </div>
            <div>
              <p className="mission-plan-price">${item.price} <small>/ {item.period}</small></p>
              <p className="mission-pricing-billing">{item.detail}</p>
            </div>
            <ul className="mission-pricing-benefits" role="list">
              {planBenefits.map((benefit) => (
                <li key={benefit}><Check size={16} aria-hidden="true" /> {benefit}</li>
              ))}
            </ul>
            <button className={item.id === "yearly" ? "mission-primary" : "mission-secondary"} onClick={() => {
              access.selectPlan(item.id);
              changeView("library");
            }}>{plan === item.id ? "Open Pro workspace" : `Try ${item.title.toLowerCase()} demo`} <ArrowRight size={16} /></button>
          </article>
        ))}
      </div>
    </>
  );

  const active = plans.find((item) => item.id === plan)!;
  return (
    <>
      <button className="mission-course-back" onClick={() => changeView(view === "library" ? "plans" : "library")}>
        <ArrowLeft size={15} /> {view === "library" ? "Back to Pricing" : "Back to Pro workspace"}
      </button>
      {view === "library" && (
        <>
          <h1>Your Pro workspace</h1>
          <p>{active.title} demo · ${active.price}/{active.period}</p>
          <p className="mission-course-intro">Your case and course progress is saved on this device.</p>
          <div className="mission-pro-library">
            <article className="mission-pro-card">
              <h2>QA case · Checkout after a timeout</h2>
              <p>{caseDone ? `Latest result: ${assessAttempt(practice.current).score}/100` : "Investigate a payment, recover the order and test a fix."}</p>
              <button className="mission-primary" onClick={() => changeView("case")}>{caseDone ? "Review QA case" : practice.current.actions.length ? "Continue QA case" : "Start QA case"}</button>
            </article>
            <article className="mission-pro-card">
              <h2>Courses</h2>
              <p>{access.completed.length} of {proCourses.length} courses completed</p>
              <button className="mission-primary" onClick={() => changeView("courses")}>Open courses</button>
            </article>
            <article className="mission-pro-card">
              <h2>Your decision review</h2>
              <p>{caseDone ? "See consequences, missed evidence and your next practice skill." : "Complete the case to get a review based on your actions."}</p>
              <button className="mission-primary" onClick={() => changeView("review")}>{caseDone ? "Review my decisions" : "Open practice case"}</button>
            </article>
          </div>
        </>
      )}
      {(view === "case" || view === "review") && (
        practiceReady ? <>
          {saveError && <p role="alert" className="pro-error">Your browser could not save this attempt. Keep this page open to continue.</p>}
          <ProCasePractice practice={practice} onChange={updatePractice} />
        </> : <p role="status">Loading your practice…</p>
      )}
      {view === "courses" && (
        <>
          <h1>Pro courses</h1>
          <ProCourseCards access={access} onPricing={() => changeView("plans")} />
        </>
      )}
    </>
  );
}
