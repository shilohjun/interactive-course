import type { CourseIndex } from "../types";

async function loadJson<T>(path: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url} (HTTP ${response.status})`);
  }
  return (await response.json()) as T;
}

export async function loadCourseIndex(): Promise<CourseIndex> {
  const data = await loadJson<CourseIndex>("course/course.json");
  if (!data || !Array.isArray(data.courses)) {
    throw new Error("course.json is missing a courses array");
  }
  return data;
}
