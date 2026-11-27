import type { LectureMeta, Transcript } from "../types";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url} (HTTP ${response.status})`);
  }
  return (await response.json()) as T;
}

export type LectureData = {
  meta: LectureMeta;
  transcript: Transcript;
};

export async function loadLecture(id: string): Promise<LectureData> {
  const base = `${import.meta.env.BASE_URL}course/lectures/${id}/`;
  const [meta, transcript] = await Promise.all([
    fetchJson<LectureMeta>(`${base}meta.json`),
    fetchJson<Transcript>(`${base}transcript.json`),
  ]);

  if (!meta || !Array.isArray(meta.chapters)) {
    throw new Error(`Lecture ${id} is missing its chapter list`);
  }
  if (!transcript || !Array.isArray(transcript.cues)) {
    throw new Error(`Lecture ${id} is missing its transcript`);
  }

  return { meta, transcript };
}
