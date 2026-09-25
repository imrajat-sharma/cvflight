"use client";
import { ResumeData } from "@/lib/resume";
import { providers } from "@/lib/services/aiService";
import { checkATS } from "@/lib/services/atsService";
import { analyzeJD, Suggestion } from "@/lib/services/jdAnalyzer";
import { applySuggestion } from "@/lib/services/optimizationService";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  KeyRound,
  LockKeyhole,
  ScanText,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
export function JDPanel({
  data,
  onChange,
  jd,
  setJD,
}: {
  data: ResumeData;
  onChange: (d: ResumeData) => void;
  jd: string;
  setJD: (s: string) => void;
}) {
  const [result, setResult] = useState<ReturnType<typeof analyzeJD> | null>(
      null,
    ),
    [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const run = () => {
    const r = analyzeJD(jd, data);
    setResult(r);
    setSuggestions(r.suggestions);
  };
  function act(s: Suggestion, accept: boolean) {
    if (accept) onChange(applySuggestion(data, s));
    setSuggestions((list) =>
      list.map((x) =>
        x.id === s.id ? { ...x, status: accept ? "accepted" : "rejected" } : x,
      ),
    );
  }
  const currentScore = result?.score ?? 0;
  const score = Number.isFinite(currentScore)
    ? Math.min(100, Math.max(0, currentScore))
    : 0;
  return (
    <div className="tool-panel">
      <div className="tool-heading">
        <span>
          <ScanText size={23} />
        </span>
        <h2>Find your fit.</h2>
        <p>
          A little clarity goes a long way. See how your experience lines up
          with your next opportunity.
        </p>
      </div>
      <label className="field">
        <span>Job description</span>
        <textarea
          rows={9}
          value={jd}
          onChange={(e) => {
            setJD(e.target.value);
            setResult(null);
          }}
          maxLength={30000}
          placeholder="Paste the full job description here, including responsibilities and qualifications…"
        />
      </label>
      <button
        className="button primary full-width"
        disabled={jd.trim().length < 30}
        onClick={run}
      >
        <ScanText size={16} />
        Analyze job description
        <ArrowRight size={16} />
      </button>
      <p className="small-note">
        Private, local keyword analysis. No API key needed.
      </p>
      {result && (
        <div className="analysis-results">
          <div className="score-row">
            <div
              className="score-circle"
              style={{ ["--score" as string]: String(score) }}
            >
              {score}
              <span>%</span>
            </div>
            <div>
              <h3>Keyword match</h3>
              <p>Dictionary-based overlap, not a hiring prediction.</p>
            </div>
          </div>
          <h4>Already in your resume</h4>
          <div className="tags">
            {result.matched.length ? (
              result.matched.map((k) => (
                <span className="tag green" key={k}>
                  <Check size={12} />
                  {k}
                </span>
              ))
            ) : (
              <p className="muted">No matching terms found.</p>
            )}
          </div>
          <h4>Not found in your resume</h4>
          <div className="tags">
            {result.missing.map((k) => (
              <span className="tag" key={k}>
                {k}
              </span>
            ))}
            {!result.missing.length && (
              <p className="muted">No dictionary keyword gaps.</p>
            )}
          </div>
          {result.experience.length > 0 && (
            <>
              <h4>Experience requested</h4>
              <p>{result.experience.join(", ")}</p>
            </>
          )}
          {result.responsibilities.length > 0 && (
            <>
              <h4>Key responsibilities</h4>
              <ul className="responsibilities">
                {result.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}
          <h4>Thoughtful improvements</h4>
          {suggestions.map((s) => (
            <div className="suggestion" key={s.id}>
              <Sparkles size={16} />
              <div>
                <h4>{s.title}</h4>
                <p>{s.detail}</p>
                {s.status ? (
                  <span className={`decision ${s.status}`}>
                    {s.status === "accepted" ? (
                      <Check size={13} />
                    ) : (
                      <X size={13} />
                    )}{" "}
                    {s.status === "accepted"
                      ? s.field
                        ? "Applied to your resume"
                        : "Marked as reviewed"
                      : "Dismissed"}
                  </span>
                ) : (
                  <div className="suggestion-actions">
                    <button onClick={() => act(s, true)}>
                      <Check size={13} />
                      {s.field ? "Accept & apply" : "Accept review"}
                    </button>
                    <button onClick={() => act(s, false)}>
                      <X size={13} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="form-tip">
            <ShieldCheck size={17} />
            <p>
              Better wording. Never invented experience. We only suggest changes
              grounded in your resume.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
export function ATSPanel({
  data,
  jd,
  compileState,
  pages,
  onJD,
}: {
  data: ResumeData;
  jd: string;
  compileState: "unknown" | "ok" | "error";
  pages?: number;
  onJD: () => void;
}) {
  const result = checkATS(data, jd, compileState, pages);
  const score = Number.isFinite(result.score)
    ? Math.min(100, Math.max(0, result.score))
    : 0;
  return (
    <div className="tool-panel">
      <div className="tool-heading">
        <span>
          <ShieldCheck size={23} />
        </span>
        <h2>Ready for the next step?</h2>
        <p>
          A practical checkup to make your resume clear, readable, and easy to
          understand.
        </p>
      </div>
      <div className="ats-score">
        <div
          className="score-circle large"
          style={{ ["--score" as string]: String(score) }}
        >
          {score}
          <span>/100</span>
        </div>
        <h3>
          {score >= 80
            ? "Looking good. Keep going."
            : "A few small changes can help."}
        </h3>
        <p>{result.label}</p>
      </div>
      <div className="checks">
        {result.checks.map((c) => (
          <div className="check-row" key={c.name}>
            {c.pass === null ? (
              <CircleDashed size={18} />
            ) : c.pass ? (
              <CheckCircle2 className="green-text" size={18} />
            ) : (
              <AlertCircle className="amber-text" size={18} />
            )}
            <div>
              <h4>
                {c.name}
                <span>
                  {c.pass === null
                    ? "Not checked"
                    : c.pass
                      ? "Passed"
                      : "Review"}
                </span>
              </h4>
              <p>{c.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="button full-width" onClick={onJD}>
        <Target size={16} />
        Check against a job description
        <ChevronRight size={15} />
      </button>
      <p className="small-note">
        No hidden text, keyword stuffing, or ATS tricks. Just your real
        experience, presented well.
      </p>
    </div>
  );
}
export function AIPanel({
  data,
  jd,
  onPlans,
}: {
  data: ResumeData;
  jd: string;
  onPlans: () => void;
}) {
  const [managed, setManaged] = useState(false),
    [pro, setPro] = useState(false);
  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((r) => setPro(!!r.active))
      .catch(() => {});
  }, []);
  const [provider, setProvider] = useState<keyof typeof providers>("mistral"),
    [key, setKey] = useState(""),
    [model, setModel] = useState<string>(providers.mistral.model),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [items, setItems] = useState<{ text: string; status?: string }[]>([]),
    [consent, setConsent] = useState(false);
  async function run() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key, model, data, jd, managed }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error);
      setItems(
        json.suggestions
          .split(/\n(?=\d+[.)]\s)/)
          .filter((s: string) => s.trim())
          .map((text: string) => ({ text })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="tool-panel">
      <div className="tool-heading">
        <span>
          <Sparkles size={23} />
        </span>
        <span className="eyebrow">YOUR EXPERIENCE. A LITTLE EXTRA POLISH.</span>
        <h2>Find the right words.</h2>
        <p>
          A thoughtful second pair of eyes, powered by the AI model you trust.
        </p>
      </div>
      {pro && (
        <label className="consent">
          <input
            type="checkbox"
            checked={managed}
            onChange={(e) => setManaged(e.target.checked)}
          />
          <span>Use my Pro plan (100 managed requests per month)</span>
        </label>
      )}
      <div className="ai-method">
        <KeyRound size={17} />
        <div>
          <strong>Bring your own API key</strong>
          <p>You’re in control. Pay your provider directly.</p>
        </div>
        <span className="tag green">Free</span>
      </div>
      <label className="field">
        <span>AI provider</span>
        <select
          value={provider}
          onChange={(e) => {
            const p = e.target.value as keyof typeof providers;
            setProvider(p);
            setModel(providers[p].model);
            setKey("");
          }}
        >
          {Object.entries(providers).map(([id, p]) => (
            <option value={id} key={id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Model</span>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          maxLength={100}
        />
      </label>
      <label className="field">
        <span>API key</span>
        <div className="input-wrap">
          <KeyRound size={15} />
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your provider API key"
            autoComplete="off"
            maxLength={500}
          />
        </div>
      </label>
      <div className="privacy-note">
        <LockKeyhole size={15} />
        <p>
          Your key stays in memory for this visit. It’s sent securely to our
          server to contact your provider, never saved or logged.
        </p>
      </div>
      <label className="consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          I agree to send my resume and job description to{" "}
          {managed
            ? "the configured managed AI provider"
            : providers[provider].label}{" "}
          for suggestions.
        </span>
      </label>
      <button
        className="button primary full-width"
        disabled={!consent || (!managed && key.length < 8) || busy}
        onClick={run}
      >
        <Sparkles size={16} />
        {busy ? "Finding thoughtful improvements…" : "Get AI suggestions"}
        {!busy && <ArrowRight size={16} />}
      </button>
      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}
      {items.map((item, i) => (
        <div className="suggestion ai-suggestion" key={i}>
          <div>
            <p>{item.text}</p>
            {item.status ? (
              <span className="decision accepted">{item.status}</span>
            ) : (
              <div className="suggestion-actions">
                <button
                  onClick={() =>
                    setItems((old) =>
                      old.map((x, n) =>
                        n === i
                          ? { ...x, status: "Accepted for manual editing" }
                          : x,
                      ),
                    )
                  }
                >
                  <Check size={13} />
                  Accept for review
                </button>
                <button
                  onClick={() =>
                    setItems((old) =>
                      old.map((x, n) =>
                        n === i ? { ...x, status: "Rejected" } : x,
                      ),
                    )
                  }
                >
                  <X size={13} />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      {items.length > 0 && (
        <p className="small-note">
          AI can make mistakes. Accepted advice is kept here for manual editing;
          it never changes your experience automatically.
        </p>
      )}
      <div className="ai-plan">
        <Sparkles size={20} />
        <h3>Great resumes. Less setup.</h3>
        <p>
          Prefer not to manage API keys? Explore managed AI access with CVFlight
          Pro.
        </p>
        <button className="button full-width" onClick={onPlans}>
          Explore plans
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
