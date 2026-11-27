import { useEffect, useRef } from "react";
import type { ExplorableRef } from "../types";
import { EXPLORABLES } from "../explorables/registry";

type ExplorableOverlayProps = {
  explorable: ExplorableRef;
  onClose: () => void;
};

export function ExplorableOverlay({ explorable, onClose }: ExplorableOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const Module = EXPLORABLES[explorable.module];

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={`Explorable: ${explorable.label}`}>
      <div className="overlay__panel">
        <header className="overlay__head">
          <div>
            <p className="overlay__kicker">Try it</p>
            <h2>{explorable.label}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="overlay__close"
            onClick={onClose}
            aria-label="Close explorable"
          >
            Close
          </button>
        </header>
        <div className="overlay__body">
          {Module ? (
            <Module />
          ) : (
            <p className="overlay__missing">This explorable is not available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
