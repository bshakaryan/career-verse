"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
  Field,
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Switch,
} from "@headlessui/react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Code2,
  Grid2X2,
  Layers,
  List,
  LoaderCircle,
  Megaphone,
  Orbit,
  PenTool,
  Search,
  X,
} from "lucide-react";

const careers = [
  {
    id: "pm",
    name: "Project Manager",
    category: "Business",
    icon: ClipboardList,
    description:
      "Keep a product launch on track when priorities, deadlines and people pull in different directions.",
    skills: ["Prioritization", "Communication"],
    available: true,
  },
  {
    id: "product",
    name: "Product Manager",
    category: "Business",
    icon: Layers,
    description:
      "Turn an uncertain customer problem into a focused product decision and a clear next experiment.",
    skills: ["Product discovery", "Strategy"],
    available: false,
  },
  {
    id: "data",
    name: "Data Analyst",
    category: "Data",
    icon: BarChart3,
    description:
      "Investigate a business question, make sense of the numbers, and explain what the team should do next.",
    skills: ["Analysis", "Data storytelling"],
    available: false,
  },
  {
    id: "design",
    name: "UX Designer",
    category: "Design",
    icon: PenTool,
    description:
      "Understand where users struggle and shape a clearer experience around their needs.",
    skills: ["User research", "Interaction design"],
    available: false,
  },
  {
    id: "engineering",
    name: "Software Engineer",
    category: "Engineering",
    icon: Code2,
    description:
      "Break down a feature, weigh implementation choices, and communicate a reliable delivery plan.",
    skills: ["Problem solving", "Technical trade-offs"],
    available: false,
  },
  {
    id: "marketing",
    name: "Digital Marketer",
    category: "Marketing",
    icon: Megaphone,
    description:
      "Develop a campaign brief, choose an audience, and decide how to measure what works.",
    skills: ["Campaign planning", "Experimentation"],
    available: false,
  },
];
const categories = [
  "All fields",
  "Business",
  "Data",
  "Design",
  "Engineering",
  "Marketing",
];
const sortOptions = ["Available first", "Name: A–Z"];
const pageSize = 6;

function CatalogSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="cv-select-wrap">
        <ListboxButton className="cv-select" aria-label={`${label}: ${value}`}>
          {value}
          <ChevronDown size={16} />
        </ListboxButton>
        <ListboxOptions className="cv-options">
          {options.map((option) => (
            <ListboxOption key={option} value={option} className="cv-option">
              <span>{option}</span>
              {value === option && <Check size={16} />}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

export default function CareerCatalog({
  active,
  hasSession,
  busy,
  canStart,
  ai,
  onStart,
  error,
}: {
  active: boolean;
  hasSession: boolean;
  busy: boolean;
  canStart: boolean;
  ai: boolean;
  onStart: () => Promise<boolean>;
  error: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All fields");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState(sortOptions[0]);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(false);
  useEffect(() => {
    if (!active) setDetail(false);
  }, [active]);
  const normalizedQuery = query.trim().toLowerCase();
  const matches = careers
    .filter(
      (role) =>
        (category === "All fields" || role.category === category) &&
        (!availableOnly || role.available) &&
        `${role.name} ${role.category} ${role.description} ${role.skills.join(" ")}`
          .toLowerCase()
          .includes(normalizedQuery),
    )
    .sort((a, b) =>
      sort === "Name: A–Z"
        ? a.name.localeCompare(b.name)
        : Number(b.available) - Number(a.available),
    );
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, pages);
  const offset = (currentPage - 1) * pageSize;
  const filtered = !!query || category !== "All fields" || availableOnly;
  function resetFilters() {
    setQuery("");
    setCategory("All fields");
    setAvailableOnly(false);
    setPage(1);
  }
  async function start() {
    if (await onStart()) setDetail(false);
  }
  return (
    <div className="cv-catalog">
      <header className="cv-header">
        <a href="#careers" className="cv-logo" aria-label="CareerVerse home">
          <span className="cv-mark">
            <Orbit size={21} />
          </span>
          CareerVerse
        </a>
        <span className="cv-nav">Explore careers</span>
        <div className="cv-header-end">
          {hasSession ? (
            <button className="cv-resume" onClick={start} disabled={busy}>
              Resume practice
              <ArrowRight size={16} />
            </button>
          ) : (
            <span>No account needed</span>
          )}
        </div>
      </header>
      <main className="cv-main">
        <div className="cv-intro">
          <span className="cv-eyebrow">YOUR NEXT ROLE STARTS HERE</span>
          <h1>What do you want to try?</h1>
          <p>
            Explore a career through the work itself.
            <br className="cv-mobile-break" /> Choose a role, step into a
            challenge, and practice your next move.
          </p>
        </div>
        <div className="cv-toolbar">
          <div className="cv-search">
            <Search size={20} aria-hidden="true" />
            <label className="cv-sr" htmlFor="career-search">
              Search careers
            </label>
            <input
              id="career-search"
              type="search"
              placeholder="Search careers or skills…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            {query && (
              <button
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <CatalogSelect
            label="Career field"
            value={category}
            options={categories}
            onChange={(value) => {
              setCategory(value);
              setPage(1);
            }}
          />
          <CatalogSelect
            label="Sort careers"
            value={sort}
            options={sortOptions}
            onChange={(value) => {
              setSort(value);
              setPage(1);
            }}
          />
        </div>
        <div className="cv-filter-row">
          <Field className="cv-availability">
            <Switch
              checked={availableOnly}
              onChange={(value) => {
                setAvailableOnly(value);
                setPage(1);
              }}
              className="cv-switch"
            >
              <span />
            </Switch>
            <Label>Available to try</Label>
          </Field>
          <span className="cv-filter-hint">
            Start with Project Management. More roles are on the way.
          </span>
          {filtered && (
            <button className="cv-clear" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>
        <div className="cv-results-bar">
          <p aria-live="polite" aria-atomic="true">
            <strong>
              {matches.length} {matches.length === 1 ? "career" : "careers"}
            </strong>
            <span>
              {" "}
              · {matches.filter((role) => role.available).length} available to
              try
            </span>
          </p>
          <div className="cv-views" role="group" aria-label="Catalog layout">
            <button
              aria-label="Grid view"
              aria-pressed={layout === "grid"}
              onClick={() => setLayout("grid")}
            >
              <Grid2X2 size={18} />
            </button>
            <button
              aria-label="List view"
              aria-pressed={layout === "list"}
              onClick={() => setLayout("list")}
            >
              <List size={20} />
            </button>
          </div>
        </div>
        {matches.length ? (
          <div className={`cv-grid ${layout === "list" ? "cv-list" : ""}`}>
            {matches.slice(offset, offset + pageSize).map((role) => (
              <article
                key={role.id}
                className={`cv-card ${role.available ? "cv-card-available" : ""}`}
              >
                <div className="cv-card-top">
                  <span className={`cv-role-icon cv-icon-${role.id}`}>
                    <role.icon size={23} strokeWidth={1.7} />
                  </span>
                  <span
                    className={`cv-badge ${role.available ? "cv-live" : ""}`}
                  >
                    {role.available ? "Practice available" : "Coming soon"}
                  </span>
                </div>
                <div className="cv-card-copy">
                  <span className="cv-category">{role.category}</span>
                  <h2>{role.name}</h2>
                  <p>{role.description}</p>
                  <div className="cv-tags">
                    {role.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="cv-card-bottom">
                  <div className="cv-meta">
                    {role.available ? (
                      <>
                        <Clock3 size={15} />
                        20–30 min<span>·</span>Beginner
                      </>
                    ) : (
                      "Simulation in planning"
                    )}
                  </div>
                  <button
                    className={`cv-action ${role.available ? "cv-primary" : ""}`}
                    disabled={!role.available}
                    onClick={() => setDetail(true)}
                  >
                    {role.available ? "Explore this role" : "Coming soon"}
                    {role.available && <ArrowRight size={17} />}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="cv-empty">
            <Search size={28} />
            <h2>No careers found</h2>
            <p>
              Try another skill or clear your filters to explore all careers.
            </p>
            <button className="cv-action" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        )}
        <footer className="cv-footer">
          <span>
            {matches.length
              ? `Showing ${offset + 1}–${Math.min(offset + pageSize, matches.length)} of ${matches.length} careers`
              : "0 careers"}
          </span>
          {pages > 1 && (
            <nav className="cv-pagination" aria-label="Catalog pages">
              <button
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                Page {currentPage} of {pages}
              </span>
              <button
                aria-label="Next page"
                disabled={currentPage === pages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </nav>
          )}
          <span>A small step toward your next chapter.</span>
        </footer>
      </main>
      <Dialog
        open={detail}
        onClose={() => {
          if (!busy) setDetail(false);
        }}
        className="cv-dialog"
      >
        <DialogBackdrop className="cv-dialog-backdrop" />
        <div className="cv-dialog-position">
          <DialogPanel className="cv-dialog-panel">
            <button
              className="cv-close"
              aria-label="Close role details"
              disabled={busy}
              onClick={() => setDetail(false)}
            >
              <X size={21} />
            </button>
            <span className="cv-role-icon cv-icon-pm">
              <ClipboardList size={25} />
            </span>
            <span className="cv-eyebrow">PROJECT MANAGEMENT · PRACTICE 01</span>
            <DialogTitle>The launch is on you.</DialogTitle>
            <Description>
              Your first week. A Friday deadline. A team that needs a plan.
            </Description>
            <div className="cv-detail-meta">
              <span>
                <Clock3 size={16} />
                20–30 minutes
              </span>
              <span>Beginner friendly</span>
            </div>
            <div className="cv-detail-body">
              <h3>Your role at Northstar</h3>
              <p>
                A product pilot is days away. The team has competing priorities
                and limited time. You’re the project manager who needs to make
                the call.
              </p>
              <ol>
                <li>
                  <strong>Understand the situation</strong>
                  <span>
                    Read the brief and explore your colleagues’ perspectives.
                  </span>
                </li>
                <li>
                  <strong>Build a release plan</strong>
                  <span>
                    Prioritize work, assign owners, and respond to a change.
                  </span>
                </li>
                <li>
                  <strong>Reflect and improve</strong>
                  <span>
                    {ai
                      ? "Review feedback on your decisions and revise your approach."
                      : "Use a guided self-review to strengthen your decisions."}
                  </span>
                </li>
              </ol>
            </div>
            {!ai && (
              <p className="cv-practice-note">
                Practice mode uses prepared colleague notes and guided
                self-review. Live AI chat and AI scoring are not connected.
              </p>
            )}
            {error && (
              <p className="cv-dialog-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="cv-action cv-primary"
              disabled={busy || !canStart}
              onClick={start}
            >
              {busy ? (
                <>
                  <LoaderCircle size={18} className="spin" />
                  Opening your workspace…
                </>
              ) : (
                <>
                  {hasSession ? "Resume my practice" : "Start practicing"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <p className="cv-detail-footnote">
              No sign-up needed. Your progress is saved on this device.
            </p>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
