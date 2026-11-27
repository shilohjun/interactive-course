export type Cue = {
  start: number;
  end: number;
  slide: number;
  text: string;
  chapter?: string;
};

export type Chapter = {
  id: string;
  title: string;
  start: number;
  slide: number;
};

export type Exercise = {
  after_slide: number;
  label: string;
  problem: string;
  url: string;
};

export type ExplorableRef = {
  id: string;
  at: number;
  slide: number;
  label: string;
  module: string;
};

export type LectureSource = {
  instructor: string;
  course: string;
  institution: string;
  courseUrl: string;
  videoUrl: string;
  licenseNote: string;
};

export type LectureMeta = {
  id: string;
  title: string;
  subtitle: string;
  courseId: string;
  duration: number;
  slides: { count: number; pdf: string };
  media: { file: string };
  chapters: Chapter[];
  source: LectureSource;
};

export type Transcript = {
  cues: Cue[];
  exercises: Exercise[];
  explorables: ExplorableRef[];
};

export type LectureEntry = {
  id: string;
  title: string;
  duration: number;
  slides: number;
  chapters: number;
  status: "live" | "soon";
};

export type CourseEntry = {
  id: string;
  title: string;
  institution: string;
  instructor: string;
  status: "live" | "soon";
  lectures: LectureEntry[];
};

export type CourseIndex = {
  site: {
    title: string;
    tagline: string;
    attribution: string;
  };
  courses: CourseEntry[];
};
