"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Code2, FlaskConical, Headphones } from "lucide-react";
import { ProCourseCards, useProCourseAccess } from "./mission-pro";

const courses = {
  support: {
    icon: Headphones,
    title: "Customer Support Foundations",
    subtitle: "Turn a customer problem into a clear handoff.",
    duration: "12 min",
    lessons: ["Ask simple questions", "Write a useful bug ticket", "Close the loop with the customer"],
  },
  developer: {
    icon: Code2,
    title: "Your First Software Fix",
    subtitle: "Understand how small code changes solve real problems.",
    duration: "15 min",
    lessons: ["Read a bug ticket", "Connect an action to a button", "Send a fix for testing"],
  },
  qa: {
    icon: FlaskConical,
    title: "QA Testing Basics",
    subtitle: "Check a fix before it reaches the customer.",
    duration: "12 min",
    lessons: ["Turn a ticket into a test", "Compare expected and actual results", "Pass a fix or report an issue"],
  },
} as const;

export type CourseId = keyof typeof courses;

const starterLessons = {
  support: {
    text: "A useful ticket records what the customer did, what they saw, and what they expected. Ask about the last action so the developer can repeat it.",
    question: "What should you ask first when a customer says Pay Now does nothing?",
    choices: ["What happens after you click Pay Now?", "Can you confirm which part of the code failed?"],
    correct: 0,
  },
  developer: {
    text: "Repeat the reported problem before choosing a fix. After changing the code, repeat the same steps so you can compare the old and new results.",
    question: "What is the most useful first check after fixing the Pay Now button?",
    choices: ["Open a different product page.", "Repeat the same checkout steps from the ticket."],
    correct: 1,
  },
  qa: {
    text: "A test compares an expected result with what actually happened. For this checkout, one payment should start even if the customer clicks twice quickly.",
    question: "A double-click starts two payments. What should you do?",
    choices: ["Report the mismatch and hold approval.", "Approve because at least one payment started."],
    correct: 0,
  },
};

type Props = {
  onMission: () => void;
  onPro: () => void;
  initialCourse?: CourseId;
};

export default function MissionCourses({ onMission, onPro, initialCourse }: Props) {
  const access = useProCourseAccess();
  const [opened, setOpened] = useState<CourseId | null>(initialCourse ?? null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [lessonOpen, setLessonOpen] = useState(Boolean(initialCourse));

  function openCourse(id: CourseId | null) {
    setOpened(id);
    setAnswer(null);
    setLessonOpen(false);
    window.scrollTo({ top: 0 });
  }

  if (opened) {
    const course = courses[opened];
    const lesson = starterLessons[opened];
    const passed = answer === lesson.correct;
    const Icon = course.icon;
    return (
      <main className="mission-course-page">
        <button className="mission-course-back" onClick={() => openCourse(null)}><ArrowLeft size={15} /> All courses</button>
        <section className="mission-course-detail">
          <div className="mission-course-icon"><Icon size={28} /></div>
          <span className="mission-kicker">FREE STARTER LESSON</span>
          <h1>{course.title}</h1>
          <p>{course.subtitle}</p>
          {lessonOpen ? (
            <div className="mission-pro-stack">
              <p>{lesson.text}</p>
              <h2>{lesson.question}</h2>
              {lesson.choices.map((choice, index) => (
                <button className="mission-secondary" key={choice} onClick={() => setAnswer(index)} disabled={passed}>{choice}</button>
              ))}
              {answer !== null && <p role="status">{passed ? "First lesson complete." : "Try again. Use the steps and evidence from the ticket."}</p>}
              {passed && <button className="mission-primary" onClick={onPro}>Explore CareerVerse Pro <ArrowRight size={16} /></button>}
            </div>
          ) : (
            <div className="mission-pro-stack">
              <h2>{course.lessons[0]}</h2>
              <button className="mission-primary" onClick={() => setLessonOpen(true)}>Start free lesson <ArrowRight size={16} /></button>
            </div>
          )}
        </section>
      </main>
    );
  }
  return (
    <main className="mission-course-page">
      <span className="mission-kicker">LEARN</span>
      <h1>Build the skills behind each role.</h1>
      <p className="mission-course-intro">Start with a free lesson or build your skills with Pro courses.</p>
      <section className="mission-catalog-group" aria-labelledby="free-lessons-heading">
        <h2 id="free-lessons-heading">Free starter lessons</h2>
        <div className="mission-course-grid">
          {(Object.keys(courses) as CourseId[]).map((id) => {
            const course = courses[id];
            const Icon = course.icon;
            return (
              <article key={id}>
                <span className="mission-course-badge">FREE</span>
                <div className="mission-course-icon"><Icon size={24} /></div>
                <h3>{course.title}</h3>
                <p>{course.subtitle}</p>
                <button className="mission-secondary" onClick={() => openCourse(id)}>
                  Open free lesson <ArrowRight size={15} />
                </button>
              </article>
            );
          })}
        </div>
      </section>
      <section className="mission-catalog-group" aria-labelledby="pro-courses-heading">
        <h2 id="pro-courses-heading">Pro courses</h2>
        <p className="mission-course-intro">
          {access.plan ? "Included in your Pro demo access." : "Included with a CareerVerse Pro subscription."}
        </p>
        <ProCourseCards access={access} onPricing={onPro} />
      </section>
      <button className="mission-text" onClick={onMission}>Open the free mission</button>
    </main>
  );
}
