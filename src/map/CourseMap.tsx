import { useEffect, useState } from "react";
import type { CourseIndex } from "../types";
import { loadCourseIndex } from "../lib/loadCourse";

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

export function CourseMapView({ data }: { data: CourseIndex }) {
  const base = import.meta.env.BASE_URL;

  return (
    <main className="page">
      <header className="bar home__bar">
        <a className="brand" href="#/">
          interactive course
        </a>
        <nav className="home__nav" aria-label="Site">
          <a href="#/" aria-current="page">
            Courses
          </a>
          <a href="#about">About</a>
        </nav>
      </header>

      <section className="home__intro">
        <h1>Courses</h1>
        <p>
          Two courses, one player. Watch the lecture, follow the transcript, and stop
          to try the idea.
        </p>
      </section>

      <section className="catalog" aria-label="Course catalog">
        {data.courses.map((course) => (
          <article className="course" key={course.id}>
            <div className="course__intro">
              <p className="course__meta">{course.institution}</p>
              <h2>{course.title}</h2>
              <p className="course__by">{course.instructor}</p>
              {course.blurb ? <p className="course__blurb">{course.blurb}</p> : null}
            </div>

            <div className="course__lectures">
              {course.status === "live" ? (
                <ul className="lectures">
                  {course.lectures.map((lecture) => (
                    <li key={lecture.id}>
                      <a className="lecture" href={`#/lecture/${lecture.id}`}>
                        <span className="lecture__media">
                          <img
                            className="lecture__thumb"
                            src={`${base}course/lectures/${lecture.id}/${lecture.thumbnail ?? "slides/01.webp"}`}
                            alt={`Preview of ${lecture.title}`}
                            loading="lazy"
                          />
                          <span className="lecture__play" aria-hidden="true">
                            <svg viewBox="0 0 12 12" width="12" height="12">
                              <path d="M3 1.5 10 6 3 10.5Z" fill="currentColor" />
                            </svg>
                          </span>
                        </span>
                        <span className="lecture__body">
                          <span className="lecture__title">{lecture.title}</span>
                          <span className="lecture__meta">
                            {formatDuration(lecture.duration)} · {lecture.slides} slides ·{" "}
                            {lecture.chapters} chapters
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="course__soon">In preparation</p>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="about" id="about" aria-labelledby="about-title">
        <h2 id="about-title">About this player</h2>
        <div>
          <p>
            Every lecture keeps one clock: the video's current time drives the slide,
            the transcript, and the chapter list. Click any sentence to jump; open an
            explorable and return to the same second.
          </p>
          <p>
            Exercises open in a new tab, and your place here is kept. Attribution and
            source links sit under every lecture.
          </p>
        </div>
      </section>

      <footer className="foot">
        <p>{data.site.attribution}</p>
        <p>Built with the course player. No license claimed.</p>
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
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load the course map.");
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
