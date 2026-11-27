import { useEffect, useState } from "react";
import type { CourseIndex } from "../types";
import { loadCourseIndex } from "../lib/loadCourse";

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

const ROUTE = [
  { label: "Watch", note: "the argument, chapter by chapter" },
  { label: "Stop", note: "on any slide, any sentence" },
  { label: "Try", note: "an explorable under your hand" },
  { label: "Ask", note: "a Socratic question in a new tab" },
];

export function CourseMapView({ data }: { data: CourseIndex }) {
  return (
    <main className="page">
      <header className="head">
        <a className="mark" href="#/" aria-label="Interactive Course home">
          <span>IC</span>
        </a>
        <span className="head__note">A shared player for recorded lectures</span>
      </header>

      <section className="hero">
        <p className="eyebrow">Course prototype · Fall 2026</p>
        <h1>
          A lecture is a <em>map</em>,
          <br />
          not a video.
        </h1>
        <p className="lede">
          Follow the argument, jump to the slide you need, and stop to try the
          idea yourself. One player, three ways in: a lecture, an explorable,
          and a question.
        </p>
      </section>

      <ol className="route" aria-label="How a lecture works">
        {ROUTE.map((step, index) => (
          <li className="route__step" key={step.label}>
            <span className="route__num">{String(index + 1).padStart(2, "0")}</span>
            <span className="route__label">{step.label}</span>
            <span className="route__note">{step.note}</span>
          </li>
        ))}
      </ol>

      <section className="courses" aria-labelledby="courses-title">
        <div className="section-head">
          <h2 id="courses-title">Courses</h2>
          <span>Same player, different pack</span>
        </div>

        <div className="course-grid">
          {data.courses.map((course) => (
            <article className={`course course--${course.status}`} key={course.id}>
              <p className="course__inst">{course.institution}</p>
              <h3>{course.title}</h3>
              <p className="course__by">{course.instructor}</p>
              {course.blurb ? <p className="course__blurb">{course.blurb}</p> : null}

              {course.status === "live" ? (
                <ul className="lectures">
                  {course.lectures.map((lecture) => (
                    <li key={lecture.id}>
                      <a className="lecture" href={`#/lecture/${lecture.id}`}>
                        <span className="lecture__title">{lecture.title}</span>
                        <span className="lecture__meta">
                          {formatDuration(lecture.duration)} · {lecture.slides} slides ·{" "}
                          {lecture.chapters} chapters
                        </span>
                        <span className="lecture__arrow" aria-hidden="true">
                          →
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="course__soon">In preparation · same player, new pack</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <footer className="foot">
        <p>{data.site.attribution}</p>
        <p className="foot__note">Drawn from public course material. No license claimed.</p>
      </footer>
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
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load the course map.");
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
        <p className="state">Loading the course map…</p>
      </main>
    );
  }

  return <CourseMapView data={data} />;
}
