import type { Exercise } from "../types";

type ExerciseCardProps = {
  exercise: Exercise;
  onOpen: (exercise: Exercise) => void;
};

export function ExerciseCard({ exercise, onOpen }: ExerciseCardProps) {
  if (!exercise.problem) {
    return (
      <aside className="ask ask--muted" aria-label="Practice question">
        <div>
          <p className="ask__kicker">Question</p>
          <p className="ask__body">Question coming soon.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="ask" aria-label="Practice question">
      <div>
        <p className="ask__kicker">Question · after slide {exercise.after_slide}</p>
        <p className="ask__body">
          Work through the idea with a Socratic tutor. It gives hints, not answers.
        </p>
      </div>
      <a
        className="ask__link"
        href={exercise.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          event.preventDefault();
          onOpen(exercise);
        }}
      >
        {exercise.label}
      </a>
    </aside>
  );
}
