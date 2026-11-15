"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Code2, FlaskConical, Headphones } from "lucide-react";

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

type CourseId = keyof typeof courses;

export default function MissionCourses({ onMission }: { onMission: () => void }) {
  const [opened, setOpened] = useState<CourseId | null>(null);
  if (opened) {
    const course = courses[opened];
    const Icon = course.icon;
    return (
      <main className="mission-course-page">
        <button className="mission-course-back" onClick={() => setOpened(null)}><ArrowLeft size={15} /> All courses</button>
        <section className="mission-course-detail">
          <div className="mission-course-icon"><Icon size={28} /></div>
          <span className="mission-kicker">FREE STARTER COURSE · {course.duration}</span>
          <h1>{course.title}</h1>
          <p>{course.subtitle}</p>
          <div className="mission-lessons">
            {course.lessons.map((lesson, index) => <article key={lesson}><span>0{index + 1}</span><div><b>{lesson}</b><p>A short, practical lesson with one simple activity.</p></div></article>)}
          </div>
          <button className="mission-primary" onClick={onMission}>Practice this role again <ArrowRight size={16} /></button>
        </section>
      </main>
    );
  }
  return (
    <main className="mission-course-page">
      <span className="mission-kicker">LEARN</span>
      <h1>Build the skills behind each role.</h1>
      <p className="mission-course-intro">Short beginner courses connected to the work you tried in the BUG-104 mission.</p>
      <div className="mission-course-grid">
        {(Object.keys(courses) as CourseId[]).map((id) => {
          const course = courses[id];
          const Icon = course.icon;
          return <article key={id}><span className="mission-course-badge">FREE · {course.duration}</span><div className="mission-course-icon"><Icon size={24} /></div><h2>{course.title}</h2><p>{course.subtitle}</p><ul>{course.lessons.map((lesson) => <li key={lesson}>{lesson}</li>)}</ul><button className="mission-secondary" onClick={() => setOpened(id)}>Open course <ArrowRight size={15} /></button></article>;
        })}
      </div>
      <div className="mission-course-cta"><BookOpen size={20} /><div><b>Not sure which course to choose?</b><span>Try the 3–5 minute mission and notice which work feels most interesting.</span></div><button className="mission-primary" onClick={onMission}>Start mission</button></div>
    </main>
  );
}
