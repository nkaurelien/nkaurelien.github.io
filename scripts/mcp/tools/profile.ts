import fs from 'fs';
import path from 'path';

const DATASOURCES_DIR = path.resolve(process.cwd(), 'datasources');

export interface ProfileContext {
  basics: Record<string, unknown>;
  skills: Array<Record<string, unknown>>;
  work: Array<Record<string, unknown>>;
  projects?: Array<Record<string, unknown>>;
  education?: Array<Record<string, unknown>>;
  aboutMeText?: string;
  storyText?: string;
}

export function getProfileContext(): ProfileContext {
  let cvData: Record<string, unknown> = {};
  const cvPath = path.join(DATASOURCES_DIR, 'cv.json');
  if (fs.existsSync(cvPath)) {
    try {
      cvData = JSON.parse(fs.readFileSync(cvPath, 'utf8'));
    } catch {
      // ignore
    }
  }

  let aboutMeText = '';
  const aboutMePath = path.join(DATASOURCES_DIR, 'about-me.md');
  if (fs.existsSync(aboutMePath)) {
    aboutMeText = fs.readFileSync(aboutMePath, 'utf8');
  }

  let storyText = '';
  const storyPath = path.join(DATASOURCES_DIR, 'story.md');
  if (fs.existsSync(storyPath)) {
    storyText = fs.readFileSync(storyPath, 'utf8');
  }

  return {
    basics: (cvData.basics as Record<string, unknown>) || {},
    skills: (cvData.skills as Array<Record<string, unknown>>) || [],
    work: (cvData.work as Array<Record<string, unknown>>) || [],
    projects: (cvData.projects as Array<Record<string, unknown>>) || [],
    education: (cvData.education as Array<Record<string, unknown>>) || [],
    aboutMeText: aboutMeText.trim(),
    storyText: storyText.trim(),
  };
}

export function searchProfileAndExperience(query: string): {
  matchedSkills: Array<Record<string, unknown>>;
  matchedWork: Array<Record<string, unknown>>;
  summary: string;
} {
  const profile = getProfileContext();
  const q = query.toLowerCase();

  const matchedSkills = profile.skills.filter((s) => {
    const name = String(s.name || '').toLowerCase();
    const keywords = Array.isArray(s.keywords) ? s.keywords.join(' ').toLowerCase() : '';
    return name.includes(q) || keywords.includes(q);
  });

  const matchedWork = profile.work.filter((w) => {
    const name = String(w.name || '').toLowerCase();
    const position = String(w.position || '').toLowerCase();
    const summary = String(w.summary || '').toLowerCase();
    const highlights = Array.isArray(w.highlights) ? w.highlights.join(' ').toLowerCase() : '';
    return name.includes(q) || position.includes(q) || summary.includes(q) || highlights.includes(q);
  });

  return {
    matchedSkills,
    matchedWork,
    summary: `Résultats pour "${query}" : ${matchedSkills.length} compétence(s), ${matchedWork.length} expérience(s) trouvée(s).`,
  };
}
