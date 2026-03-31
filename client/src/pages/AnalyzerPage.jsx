import { useMemo, useState } from 'react';

const SAMPLE_POSTING = `We are hiring a Software Developer with experience in React, Node, SQL, REST API design, testing, Git, and agile collaboration. Familiarity with AWS, Docker, and strong communication skills is a plus.`;
const KEYWORD_BANK = ['react', 'node', 'sql', 'python', 'javascript', 'typescript', 'api', 'rest', 'testing', 'git', 'agile', 'aws', 'docker', 'communication', 'supabase', 'postgresql'];

function analyzePosting(jdText, skillsInput) {
  const normalizedPosting = jdText.toLowerCase();
  const userSkills = skillsInput
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  const extractedKeywords = KEYWORD_BANK.filter((keyword) => normalizedPosting.includes(keyword));
  const matched = userSkills.filter((skill) => normalizedPosting.includes(skill.toLowerCase()));
  const missing = extractedKeywords.filter((keyword) => !userSkills.some((skill) => skill.toLowerCase() === keyword));
  const scoreBase = extractedKeywords.length || userSkills.length || 1;
  const score = Math.max(20, Math.min(100, Math.round((matched.length / scoreBase) * 100)));

  const suggestions = [];
  if (missing.length) suggestions.push(`Highlight or strengthen experience with ${missing.slice(0, 3).join(', ')}.`);
  if (!userSkills.some((skill) => /project|api|dashboard|full[- ]?stack/i.test(skill))) suggestions.push('Add a project-oriented bullet that shows measurable impact.');
  suggestions.push('Mirror the exact wording of the posting where it truthfully matches your experience.');

  return { extractedKeywords, matched, missing, suggestions, score };
}

export default function AnalyzerPage() {
  const [jdText, setJdText] = useState(SAMPLE_POSTING);
  const [skills, setSkills] = useState('React, Node, SQL, Python, Communication');
  const [result, setResult] = useState(() => analyzePosting(SAMPLE_POSTING, 'React, Node, SQL, Python, Communication'));

  const skillsCount = useMemo(() => skills.split(',').map((skill) => skill.trim()).filter(Boolean).length, [skills]);

  const handleAnalyze = () => {
    setResult(analyzePosting(jdText, skills));
  };

  return (
    <div className="feed-stack">
      <section className="hero-card analyzer-hero">
        <div>
          <span className="eyebrow">Resume optimization</span>
          <h1>Analyze a job posting against your skills in seconds.</h1>
          <p>Paste a description, compare it to your skills, and get quick suggestions you can talk through in an interview demo.</p>
        </div>
        <div className="hero-metrics compact">
          <div>
            <span>Posting length</span>
            <strong>{jdText.length}</strong>
          </div>
          <div>
            <span>Skills listed</span>
            <strong>{skillsCount}</strong>
          </div>
        </div>
      </section>

      <div className="analyzer-layout">
        <div className="content-card analyzer-input-card">
          <div className="section-header stacked-start">
            <div>
              <h2>Input</h2>
              <p className="muted-text">Paste the job description and your core skills.</p>
            </div>
          </div>
          <label className="field-label">Job description</label>
          <textarea
            rows="12"
            placeholder="Paste job description"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
          <label className="field-label">Your skills</label>
          <input
            placeholder="Your skills (comma-separated)"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
          <button onClick={handleAnalyze} className="primary-button wide">
            <i className="bx bx-search-alt-2" /> Analyze Posting
          </button>
        </div>

        <div className="content-card analysis-results-card">
          <div className="section-header stacked-start">
            <div>
              <h2>Results</h2>
              <p className="muted-text">Your keyword fit and missing areas at a glance.</p>
            </div>
          </div>
          {result ? (
            <>
              <div className="result-score-card">
                <span>Match Score</span>
                <strong>{result.score}%</strong>
              </div>

              <div className="result-section">
                <h3>Extracted Keywords</h3>
                <div className="chip-row">
                  {result.extractedKeywords.length ? result.extractedKeywords.map((item) => <span className="chip" key={item}>{item}</span>) : <span className="muted-text">None found</span>}
                </div>
              </div>

              <div className="result-section">
                <h3>Matched Skills</h3>
                <div className="chip-row success">
                  {result.matched.length ? result.matched.map((item) => <span className="chip success" key={item}>{item}</span>) : <span className="muted-text">None matched</span>}
                </div>
              </div>

              <div className="result-section">
                <h3>Missing Skills</h3>
                <div className="chip-row warning">
                  {result.missing.length ? result.missing.map((item) => <span className="chip warning" key={item}>{item}</span>) : <span className="muted-text">No major gaps found</span>}
                </div>
              </div>

              <div className="result-section">
                <h3>Suggestions</h3>
                <ul className="suggestion-list">
                  {result.suggestions.length ? result.suggestions.map((suggestion, index) => (
                    <li key={index}><i className="bx bx-check-circle" /> {suggestion}</li>
                  )) : <li><i className="bx bx-check-circle" /> No suggestions needed right now.</li>}
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
