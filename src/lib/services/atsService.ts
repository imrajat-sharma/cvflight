import { ResumeData } from "../resume";
import { analyzeJD, resumeText } from "./jdAnalyzer";
export function checkATS(
  data: ResumeData,
  jd = "",
  compileState: "unknown" | "ok" | "error" = "unknown",
  pageCount?: number,
) {
  const p = data.personal,
    text = resumeText(data),
    urls = [
      p.linkedin,
      p.github,
      p.website,
      ...data.projects.map((p) => p.url),
    ].filter(Boolean);
  const checks = [
    {
      name: "Contact information",
      pass: Boolean(
        p.firstName &&
        p.lastName &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) &&
        p.phone,
      ),
      detail: "Include your name, a valid email, and phone number.",
    },
    {
      name: "Standard sections",
      pass: Boolean(
        data.experience.length && data.education.length && data.skills.trim(),
      ),
      detail:
        "Experience, Education, and Skills help parsers find your qualifications.",
    },
    {
      name: "Text-based content",
      pass: text.trim().length > 200,
      detail:
        "Structured exports contain selectable text. This is not a PDF text-extraction test.",
    },
    {
      name: "Formatting consistency",
      pass: data.experience.every((e) =>
        Boolean(e.title && e.subtitle && e.startDate && e.endDate),
      ),
      detail: "Keep role titles, employers, and date ranges consistent.",
    },
    {
      name: "URL format",
      pass: urls.every((u) => {
        try {
          const url = new URL(/^https?:\/\//.test(u) ? u : "https://" + u);
          return (
            /^https?:$/.test(url.protocol) &&
            /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname)
          );
        } catch {
          return false;
        }
      }),
      detail:
        "Checks URL syntax only, not whether external pages are reachable.",
    },
    {
      name: "No empty entries",
      pass: [
        ...data.experience,
        ...data.education,
        ...data.projects,
        ...data.certifications,
        ...data.achievements,
        ...data.custom,
      ].every((e) => Boolean(e.title.trim())),
      detail: "Empty optional sections are omitted automatically.",
    },
    {
      name: "One-page length",
      pass: pageCount ? pageCount === 1 : text.length < 4700,
      detail: pageCount
        ? `The last exported PDF has ${pageCount} page(s).`
        : "Estimated from content length; export a PDF to verify actual pagination.",
    },
    {
      name: "Keyword coverage",
      pass: jd ? analyzeJD(jd, data).score >= 65 : null,
      detail: jd
        ? "Aim for relevant, truthful overlap with the job description."
        : "Add a job description to check keyword coverage.",
    },
    {
      name: "LaTeX compilation",
      pass: compileState === "unknown" ? null : compileState === "ok",
      detail:
        compileState === "unknown"
          ? "Not checked. Requires the isolated LaTeX compiler."
          : compileState === "ok"
            ? "LaTeX compiled successfully."
            : "Resolve the reported compilation error.",
    },
  ];
  const evaluated = checks.filter((c) => c.pass !== null);
  const score =
    evaluated.length === 0
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (evaluated.filter((c) => c.pass).length / evaluated.length) * 100,
            ),
          ),
        );
  return {
    score,
    checks,
    label: "Heuristic readiness score — not a real ATS score",
  };
}
