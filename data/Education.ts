/**
 * Content for the Education section on the About page. The Education
 * component renders from this file — no copy should ever be hardcoded in
 * the component itself.
 *
 * `period` fields are PLACEHOLDER — swap in the real start/end years.
 */

export type EducationEntry = {
  degree: string;
  institute: string;
  field: string;
  period: string;
};

export type EducationData = {
  entries: EducationEntry[];
};

export const education: EducationData = {
  entries: [
    {
      degree: "SSC",
      institute: "Khararia A.G.M. High School",
      field: "Science",
      period: "School — e.g. 2023",
    },
    {
      degree: "HSC",
      institute: "Joybangla College",
      field: "Science",
      period: "College — e.g. 2025",
    },
    {
      degree: "Bachelor's Degree",
      institute: "Northern University Bangladesh, Khulna",
      field: "Computer Science & Engineering (CSE)",
      period: "University — e.g. 2025 — 2026",
    },
  ],
};
