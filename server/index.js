import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'applications.json');

app.use(cors());
app.use(express.json());

const DEFAULT_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'sql', 'react', 'node', 'express',
  'aws', 'docker', 'git', 'testing', 'rest api', 'postgresql', 'mongodb', 'linux',
  'excel', 'power bi', 'communication', 'problem solving', 'agile', 'jira', 'html', 'css'
];

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, '[]');
  }
}

function readApplications() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  } catch {
    return [];
  }
}

function saveApplications(applications) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(applications, null, 2));
}

function normalizeApplication(body) {
  return {
    company: body.company?.trim() || '',
    role: body.role?.trim() || '',
    status: body.status || 'Applied',
    appliedDate: body.appliedDate || '',
    jobLink: body.jobLink?.trim() || '',
    notes: body.notes?.trim() || '',
    jdText: body.jdText?.trim() || '',
    userSkills: Array.isArray(body.userSkills) ? body.userSkills : []
  };
}

function extractKeywords(text = '') {
  const normalized = text.toLowerCase();
  return [...new Set(DEFAULT_SKILLS.filter((skill) => normalized.includes(skill)))];
}

function scoreMatch(existingSkills = [], extractedKeywords = []) {
  const normalizedSkills = existingSkills.map((skill) => skill.toLowerCase().trim());
  const matched = extractedKeywords.filter((keyword) => normalizedSkills.includes(keyword));
  const missing = extractedKeywords.filter((keyword) => !normalizedSkills.includes(keyword));
  const score = extractedKeywords.length === 0 ? 0 : Math.round((matched.length / extractedKeywords.length) * 100);
  return { matched, missing, score };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/applications', (_req, res) => {
  res.json(readApplications());
});

app.post('/api/applications', (req, res) => {
  const payload = normalizeApplication(req.body);
  if (!payload.company || !payload.role || !payload.appliedDate) {
    return res.status(400).json({ message: 'company, role, and appliedDate are required' });
  }

  const applications = readApplications();
  const newApplication = {
    id: uuidv4(),
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  applications.unshift(newApplication);
  saveApplications(applications);
  res.status(201).json(newApplication);
});

app.put('/api/applications/:id', (req, res) => {
  const applications = readApplications();
  const index = applications.findIndex((app) => app.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Application not found' });
  }

  const payload = normalizeApplication({ ...applications[index], ...req.body });
  applications[index] = {
    ...applications[index],
    ...payload,
    updatedAt: new Date().toISOString()
  };

  saveApplications(applications);
  res.json(applications[index]);
});

app.delete('/api/applications/:id', (req, res) => {
  const applications = readApplications();
  const filtered = applications.filter((app) => app.id !== req.params.id);
  saveApplications(filtered);
  res.json({ message: 'Deleted successfully' });
});

app.post('/api/analyze', (req, res) => {
  const { jdText, userSkills = [] } = req.body;
  const extractedKeywords = extractKeywords(jdText);
  const { matched, missing, score } = scoreMatch(userSkills, extractedKeywords);

  const suggestions = missing.map((skill) => `Consider adding a bullet that shows measurable experience with ${skill}.`);

  res.json({ extractedKeywords, matched, missing, score, suggestions });
});

app.listen(PORT, () => {
  console.log(`ApplyIQ server running on http://localhost:${PORT}`);
});
