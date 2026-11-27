import type { LectureSource } from "../types";

export function Attribution({ source }: { source: LectureSource }) {
  return (
    <footer className="attribution">
      <p>
        <strong>{source.instructor}</strong> · {source.course} · {source.institution}
      </p>
      <p>
        Unofficial re-cut for a course demo.{" "}
        <a href={source.courseUrl} target="_blank" rel="noopener noreferrer">
          Course page
        </a>{" "}
        ·{" "}
        <a href={source.videoUrl} target="_blank" rel="noopener noreferrer">
          Original video
        </a>
        . {source.licenseNote}
      </p>
    </footer>
  );
}
