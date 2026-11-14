"use client";
import { ArrowRight, BookOpen, CheckCircle2, LockKeyhole } from "lucide-react";
import {
  courses,
  lessonPassed,
  type Course,
  type PracticeResult,
} from "@/lib/shopflow/learning";
import { type Action, type State } from "@/lib/shopflow/engine";
import { money } from "@/lib/shopflow/data";

type Props = {
  state: State | null;
  busy: boolean;
  pro: boolean;
  draft: Record<string, string>;
  setDraft: (key: string, value: string) => void;
  act: (action: Action) => Promise<boolean>;
  onStart: () => void;
  onUpgrade: () => void;
  onQA: () => void;
  onReport: () => void;
};
function Results({ attempts }: { attempts: PracticeResult[] }) {
  const latest = attempts.at(-1);
  if (!latest) return null;
  return (
    <section className="sf-panel sf-learning-result" aria-live="polite">
      <span className={`sf-badge ${latest.passed ? "green" : "amber"}`}>
        {latest.passed ? "Practice completed" : "Review and revise"}
      </span>
      <h3>
        Attempt {attempts.length} · {latest.score}/100
      </h3>
      <ul>
        {latest.feedback.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
      <div className="sf-run-stats">
        <span>
          Excess refunded <b>{money(latest.excess)}</b>
        </span>
        <span>
          Still owed <b>{money(latest.owed)}</b>
        </span>
      </div>
      {attempts.length > 1 && (
        <p>
          First attempt: {attempts[0].score}/100 → latest: {latest.score}/100.
          These are revisions of the same exercise, not a career aptitude
          measure.
        </p>
      )}
      {!latest.passed && (
        <p>
          Change your decision above and submit again. Earlier attempts remain
          in your record.
        </p>
      )}
    </section>
  );
}

export default function ShopFlowLearning({
  state,
  busy,
  pro,
  draft,
  setDraft,
  act,
  onStart,
  onUpgrade,
  onQA,
  onReport,
}: Props) {
  const available = state?.stage === "complete";
  const recommended: Course =
    (state?.interest?.support || 0) > (state?.interest?.qa || 0)
      ? "support"
      : "qa";
  const course: Course = ["support", "qa", "advanced"].includes(
    draft["learn-course"],
  )
    ? (draft["learn-course"] as Course)
    : recommended;
  const content = courses[course];
  const passed = !!state && lessonPassed(state.learning, course);
  const locked = course === "advanced" && !pro;
  const field = (key: string, label: string, options: [string, string][]) => (
    <label className="sf-field">
      {label}
      <select
        value={draft[key] || ""}
        onChange={(e) => setDraft(key, e.target.value)}
        required
      >
        <option value="" disabled>
          Choose your next action
        </option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <main className="sf-page sf-learning">
      <span className="sf-kicker">CAREERVERSE LEARNING STUDIO</span>
      <h1>Try it. Learn it. Do it again.</h1>
      <p className="sf-page-intro">
        Build on your first shift with a short lesson, a knowledge check and a
        new work assignment. Your lessons and attempts are saved with this run.
      </p>
      {!available ? (
        <section className="sf-panel">
          <BookOpen size={28} />
          <h2>Start with the work itself.</h2>
          <p>
            Try Support and QA in the Checkout Crisis, then record your
            interests. Both foundation lessons and their practice assignments
            are included free.
          </p>
          <button className="sf-button" onClick={onStart}>
            {state ? "Continue the incident" : "Try the professions"}
            <ArrowRight size={16} />
          </button>
        </section>
      ) : (
        <>
          <div
            className="sf-learning-tabs"
            role="group"
            aria-label="Choose a course"
          >
            {(Object.keys(courses) as Course[]).map((id) => (
              <button
                key={id}
                aria-pressed={course === id}
                disabled={busy}
                onClick={() => setDraft("learn-course", id)}
              >
                <span className="sf-kicker">
                  {id === "advanced"
                    ? "PRO PRACTICE"
                    : id === recommended
                      ? "BASED ON YOUR INTEREST"
                      : "FREE FOUNDATION"}
                </span>
                <strong>{courses[id].title}</strong>
                <small>
                  {id === "advanced" && !pro
                    ? "Preview and demo unlock"
                    : lessonPassed(state!.learning, id)
                      ? "Lesson checks passed"
                      : courses[id].duration}
                </small>
              </button>
            ))}
          </div>
          <section className="sf-panel">
            <span className="sf-kicker">YOUR WORK → YOUR NEXT SKILL</span>
            <h2>{content.title}</h2>
            <p>{content.subtitle}</p>
            <p className="sf-muted">
              {course === "support"
                ? "In your first shift, you balanced customer needs, policy and accurate refunds. This module adds an existing refund to the decision."
                : course === "qa"
                  ? "Your QA report was assessed on correctness, investigation, documentation and priority. This module helps you apply that method to a different rule."
                  : "Support and payments now share the same incident. Your decisions determine whether customers receive the right amount without duplicate payouts."}
            </p>
          </section>
          {locked ? (
            <section className="sf-panel sf-learning-lock">
              <LockKeyhole size={30} />
              <h2>Three orders. Two agents. One payment batch.</h2>
              <p>
                A customer has one settled refund and a second payment pending.
                Another customer’s refund failed. Reconcile the ledger and
                choose what to cancel, retry or leave alone.
              </p>
              <ul>
                <li>Short lesson on payment states and ownership</li>
                <li>Two knowledge checks with explanations</li>
                <li>
                  Playable ledger with financial consequences and revisable
                  decisions
                </li>
              </ul>
              <button className="sf-button" onClick={onUpgrade}>
                Unlock demo practice <ArrowRight size={16} />
              </button>
              <p className="sf-muted">
                Simulated Pro access. No card and no payment.
              </p>
            </section>
          ) : (
            <>
              <div className="sf-learning-layout">
                <section className="sf-panel">
                  <span className="sf-kicker">
                    01 / LEARN · ABOUT 3 MINUTES
                  </span>
                  {content.sections.map((section, i) => (
                    <article className="sf-lesson-section" key={section.title}>
                      <span className="sf-lesson-number">0{i + 1}</span>
                      <div>
                        <h3>{section.title}</h3>
                        <p>{section.text}</p>
                      </div>
                    </article>
                  ))}
                </section>
                <section className="sf-panel">
                  <span className="sf-kicker">
                    02 / CHECK YOUR UNDERSTANDING
                  </span>
                  {content.questions.map((question, index) => {
                    const answer = state!.learning.answers
                      .filter(
                        (a) => a.course === course && a.question === index,
                      )
                      .at(-1);
                    return (
                      <fieldset
                        className="sf-knowledge-check"
                        key={`${course}-${index}`}
                        disabled={busy || answer?.correct}
                      >
                        <legend>
                          {index + 1}. {question.prompt}
                        </legend>
                        {question.options.map((option, choice) => (
                          <button
                            className="sf-answer"
                            key={option}
                            onClick={() =>
                              act({
                                type: "LESSON_ANSWERED",
                                course,
                                question: index,
                                choice,
                              })
                            }
                          >
                            {option}
                          </button>
                        ))}
                        {answer && (
                          <div
                            role="status"
                            className={`sf-answer-feedback ${answer.correct ? "correct" : "retry"}`}
                          >
                            <strong>
                              {answer.correct ? "Correct. " : "Try again. "}
                            </strong>
                            {question.explanation}
                          </div>
                        )}
                      </fieldset>
                    );
                  })}
                  <p className="sf-muted">
                    Both checks must pass to submit the assignment. These checks
                    confirm understanding of this lesson.
                  </p>
                </section>
              </div>
              <section className="sf-panel">
                <span className="sf-kicker">03 / APPLY IT TO A NEW CASE</span>
                {!passed && (
                  <p className="sf-notice">
                    Read the lesson and pass both checks to unlock the
                    assignment.
                  </p>
                )}
                {course === "qa" ? (
                  <>
                    <h2>The $75 shipping boundary</h2>
                    <p>
                      Use the checkout sandbox to investigate a different rule.
                      Read the shipping requirements, record a failing case and
                      a passing control, then submit your report.
                    </p>
                    <button
                      className="sf-button"
                      disabled={!passed || busy}
                      onClick={onQA}
                    >
                      {state!.followupReports.length
                        ? "Continue QA assignment"
                        : "Open QA assignment"}
                      <ArrowRight size={16} />
                    </button>
                    {state!.followupReports.length > 0 && (
                      <p className="sf-muted">
                        Latest report:{" "}
                        {state!.followupReports.at(-1)!.score.total}/100 ·{" "}
                        {state!.followupReports.at(-1)!.ready
                          ? "Ready for engineering"
                          : "Needs clarification"}
                        . Full evidence and revisions are in the assignment.
                      </p>
                    )}
                  </>
                ) : course === "support" ? (
                  <>
                    <h2>A refund is already on the account.</h2>
                    <blockquote className="sf-customer-quote">
                      “I was charged $72 instead of $60. I received $5 back
                      yesterday, but I don’t think that covers it.” — Morgan,
                      order SF-1071
                    </blockquote>
                    <div className="sf-impact-grid">
                      <div>
                        <span>Paid</span>
                        <b>$72.00</b>
                      </div>
                      <div>
                        <span>Expected by policy</span>
                        <b>$60.00</b>
                      </div>
                      <div>
                        <span>Settled refund</span>
                        <b>$5.00</b>
                      </div>
                      <div>
                        <span>Pending refunds</span>
                        <b>$0.00</b>
                      </div>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const value = draft["learn-refund"] || "";
                        if (!/^\d+(\.\d{1,2})?$/.test(value)) return;
                        void act({
                          type: "SUPPORT_PRACTICE_SUBMITTED",
                          amount: Math.round(Number(value) * 100),
                          nextStep: draft["learn-next"] as
                            | "confirm"
                            | "promise"
                            | "close",
                          reply: draft["learn-reply"] || "",
                        });
                      }}
                    >
                      <fieldset className="sf-form" disabled={!passed || busy}>
                        <label className="sf-field">
                          Additional refund ($)
                          <input
                            inputMode="decimal"
                            pattern="[0-9]+(\.[0-9]{1,2})?"
                            required
                            value={draft["learn-refund"] || ""}
                            onChange={(e) =>
                              setDraft("learn-refund", e.target.value)
                            }
                            placeholder="0.00"
                          />
                        </label>
                        {field("learn-next", "Next step", [
                          [
                            "confirm",
                            "Confirm payment status and update the customer",
                          ],
                          ["promise", "Promise the money has already arrived"],
                          ["close", "Close the case without a status update"],
                        ])}
                        <label className="sf-field">
                          Customer reply
                          <textarea
                            required
                            minLength={15}
                            maxLength={3000}
                            rows={4}
                            value={draft["learn-reply"] || ""}
                            onChange={(e) =>
                              setDraft("learn-reply", e.target.value)
                            }
                            placeholder="Include the order, additional refund, explanation and next step."
                          />
                        </label>
                        <button className="sf-button" type="submit">
                          Review refund decision <ArrowRight size={16} />
                        </button>
                      </fieldset>
                    </form>
                  </>
                ) : (
                  <>
                    <h2>Reconcile the next payment batch.</h2>
                    <p>
                      You are the payment owner. Pending entries can still be
                      cancelled. Review the ledger, then decide the action for
                      each account. Each submission simulates the same starting
                      batch so you can revise safely.
                    </p>
                    <div className="sf-table-scroll">
                      <table>
                        <caption>Refund ledger · ShopFlow · 10:30</caption>
                        <thead>
                          <tr>
                            <th>Order</th>
                            <th>Paid / expected</th>
                            <th>Refund history</th>
                            <th>Owner</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>SF-2081</td>
                            <td>$100 / $80</td>
                            <td>
                              RF-901: $20 settled
                              <br />
                              RF-902: $20 pending
                            </td>
                            <td>Alex / Jamie</td>
                          </tr>
                          <tr>
                            <td>SF-2082</td>
                            <td>$75 / $60</td>
                            <td>
                              RF-903: $15 failed
                              <br />
                              No pending payment
                            </td>
                            <td>Jamie</td>
                          </tr>
                          <tr>
                            <td>SF-2083</td>
                            <td>$60 / $60</td>
                            <td>No refunds</td>
                            <td>Alex</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void act({
                          type: "ADVANCED_PRACTICE_SUBMITTED",
                          duplicate: draft["learn-duplicate"] as
                            | "cancel"
                            | "keep"
                            | "refund",
                          failed: draft["learn-failed"] as "retry" | "skip",
                          correct: draft["learn-correct"] as "leave" | "refund",
                        });
                      }}
                    >
                      <fieldset className="sf-form" disabled={!passed || busy}>
                        {field(
                          "learn-duplicate",
                          "SF-2081 · duplicate refund",
                          [
                            [
                              "cancel",
                              "Cancel pending RF-902; retain the settled refund",
                            ],
                            ["keep", "Allow pending RF-902 to settle"],
                            [
                              "refund",
                              "Issue another $20 refund and keep RF-902",
                            ],
                          ],
                        )}
                        {field("learn-failed", "SF-2082 · failed payment", [
                          ["retry", "Retry the verified $15 failed refund"],
                          ["skip", "Close the case without retrying"],
                        ])}
                        {field(
                          "learn-correct",
                          "SF-2083 · charge matches policy",
                          [
                            [
                              "leave",
                              "Leave the balance unchanged and explain the policy",
                            ],
                            ["refund", "Refund the full $60 order"],
                          ],
                        )}
                        <button type="submit" className="sf-button">
                          Run reconciliation <ArrowRight size={16} />
                        </button>
                      </fieldset>
                    </form>
                  </>
                )}
              </section>
              {course !== "qa" && (
                <Results attempts={state!.learning[course]} />
              )}
              {((course === "qa" && state!.followupReports.at(-1)?.ready) ||
                (course !== "qa" &&
                  state!.learning[course].at(-1)?.passed)) && (
                <section className="sf-panel">
                  <CheckCircle2 size={26} />
                  <h2>You completed this assignment.</h2>
                  <p>
                    Your lesson checks, decisions and results are saved. Compare
                    your work or explore the other foundation course.
                  </p>
                  <div className="sf-actions">
                    <button className="sf-button" onClick={onReport}>
                      View my work record <ArrowRight size={16} />
                    </button>
                    <button
                      className="sf-button secondary"
                      onClick={() =>
                        setDraft(
                          "learn-course",
                          course === "support" ? "qa" : "support",
                        )
                      }
                    >
                      Explore another role
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
