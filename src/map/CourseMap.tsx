import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CourseIndex, ShelfCard } from "../types";
import { loadCourseIndex } from "../lib/loadCourse";

function Cover({ card, active = false }: { card: ShelfCard; active?: boolean }) {
  const base = import.meta.env.BASE_URL;

  return (
    <span className={`cover${active ? " cover--active" : ""}`}>
      {card.cover.src ? (
        <img src={`${base}${card.cover.src}`} alt="" />
      ) : (
        <span className="cover-type">
          <span className="cover-type__kicker">{card.cover.kicker}</span>
          <span className="cover-type__big">{card.cover.big}</span>
          <span className="cover-type__small">{card.cover.small}</span>
        </span>
      )}
      {card.status === "soon" && card.cover.src ? (
        <span className="cover-badge">In preparation</span>
      ) : null}
      {active && card.status === "live" ? (
        <span className="cover-play" aria-hidden="true">
          <svg viewBox="0 0 12 12" width="14" height="14">
            <path d="M3 1.5 10 6 3 10.5Z" fill="currentColor" />
          </svg>
        </span>
      ) : null}
    </span>
  );
}

function AboutPanel({
  data,
  card,
  onClose,
}: {
  data: CourseIndex;
  card: ShelfCard;
  onClose: () => void;
}) {
  return (
    <aside className="about-panel" role="dialog" aria-label="About this course">
      <button type="button" className="about-close" onClick={onClose}>
        Close
      </button>
      <h2>About this course</h2>
      <p className="about-source">{card.sourceNote}</p>
      <p>{data.site.playerNote}</p>
      <p>{card.licenseNote ?? data.site.attribution}</p>
      <div className="about-links">
        {card.sourceUrl ? (
          <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer">
            Course page
          </a>
        ) : null}
        {card.videoUrl ? (
          <a href={card.videoUrl} target="_blank" rel="noopener noreferrer">
            Original video
          </a>
        ) : null}
      </div>
    </aside>
  );
}

export function CourseMapView({ data }: { data: CourseIndex }) {
  const [active, setActive] = useState(0);
  const [aboutOpen, setAboutOpen] = useState(false);
  const navigate = useNavigate();
  const total = data.shelf.length;
  const card = data.shelf[active];
  const left = data.shelf[(active + total - 1) % total];
  const right = data.shelf[(active + 1) % total];

  const go = (direction: 1 | -1) => {
    setActive((index) => (index + direction + total) % total);
  };

  const openActive = () => {
    if (card.status === "live" && card.href) navigate(card.href);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAboutOpen(false);
        return;
      }
      if (aboutOpen) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
        return;
      }
      if (event.key === "Enter") {
        const tag = (event.target as HTMLElement | null)?.tagName;
        if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "TEXTAREA") return;
        event.preventDefault();
        openActive();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aboutOpen, active, card, total]);

  return (
    <main className="home">
      <header className="bar">
        <a className="brand" href="#/">
          interactive course
        </a>
        <button
          type="button"
          className="about-button"
          onClick={() => setAboutOpen((open) => !open)}
          aria-expanded={aboutOpen}
        >
          About
        </button>
      </header>

      <div className="home-content">
        <section className="shelf-stage" aria-label="Courses">
        <button
          type="button"
          className="side-cover"
          onClick={() => setActive((active + total - 1) % total)}
          aria-label={`Show ${left.course}`}
        >
          <Cover card={left} />
        </button>

        <button
          type="button"
          className={`center-cover${card.status === "live" ? "" : " center-cover--soon"}`}
          onClick={openActive}
          disabled={card.status !== "live"}
          aria-label={
            card.status === "live"
              ? `Open ${card.title}`
              : `${card.course}, in preparation`
          }
        >
          <Cover card={card} active />
        </button>

        <button
          type="button"
          className="side-cover"
          onClick={() => setActive((active + 1) % total)}
          aria-label={`Show ${right.course}`}
        >
          <Cover card={right} />
        </button>

        <button
          type="button"
          className="arrow arrow--left"
          onClick={() => go(-1)}
          aria-label="Previous course"
        >
          <svg viewBox="0 0 12 12" width="14" height="14">
            <path d="M7.5 1.5 3 6l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <button
          type="button"
          className="arrow arrow--right"
          onClick={() => go(1)}
          aria-label="Next course"
        >
          <svg viewBox="0 0 12 12" width="14" height="14">
            <path d="M4.5 1.5 9 6l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </section>

      <section className="shelf-info">
        <p className="shelf-meta">
          {card.institution} · {card.code}
        </p>
        <h1>{card.course}</h1>
        <p className="shelf-sub">{card.title}</p>
        <p className="shelf-by">{card.instructor}</p>
        {card.status === "live" ? (
          <a className="cta" href={`#${card.href}`}>
            Open lecture
          </a>
        ) : (
          <button type="button" className="cta cta--disabled" disabled>
            In preparation
          </button>
        )}
      </section>

      <div className="dots" aria-label="Course position">
        {data.shelf.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`dot${index === active ? " dot--active" : ""}`}
            onClick={() => setActive(index)}
            aria-label={`Show ${item.course}`}
            aria-current={index === active ? "true" : undefined}
          />
        ))}
      </div>
      <p className="shelf-hint">
        <span className="hint-desktop">← → to switch · Enter to open</span>
        <span className="hint-mobile">Tap a cover or dot to switch</span>
      </p>
      </div>

      {aboutOpen ? (
        <AboutPanel data={data} card={card} onClose={() => setAboutOpen(false)} />
      ) : null}
    </main>
  );
}

export function CourseMap() {
  const [data, setData] = useState<CourseIndex | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadCourseIndex()
      .then((next) => {
        if (active) setData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load the courses.");
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <main className="page">
        <p className="state state--error" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page">
        <p className="state">Loading courses…</p>
      </main>
    );
  }

  return <CourseMapView data={data} />;
}
