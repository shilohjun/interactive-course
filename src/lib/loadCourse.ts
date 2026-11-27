import type { CourseIndex } from "../types";

async function loadJson<T>(path: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}${path}?v=6b970e1`;
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Could not load ${url} (HTTP ${response.status})`);
  }
  return (await response.json()) as T;
}

export async function loadCourseIndex(): Promise<CourseIndex> {
  const data = await loadJson<CourseIndex>("course/course.json");
  if (!data || !Array.isArray(data.shelf)) {
    throw new Error("course.json is missing a shelf array");
  }
  return data;
}
