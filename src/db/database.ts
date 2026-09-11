import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { User, ResumeAnalysis, MockInterview, ResumeTemplate, StudentFeedback, DashboardMetrics } from '../types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const SQLITE_FILE = path.join(DB_DIR, 'sqlite.db');
const JSON_FILE = path.join(DB_DIR, 'db.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// ponytail: deferred — migrate to Postgres if concurrent writes become a bottleneck
const sqlite = new Database(SQLITE_FILE);

// Enable WAL mode for high performance concurrent reads and atomic writes
sqlite.pragma('journal_mode = WAL');

// Initialize tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    picture TEXT,
    role TEXT,
    branch TEXT,
    skills TEXT,
    projects TEXT,
    targetRole TEXT,
    experienceLevel TEXT,
    completedProfile INTEGER
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    userId TEXT,
    fileName TEXT,
    uploadedAt TEXT,
    atsScore INTEGER,
    jdMatchScore INTEGER,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS interviews (
    id TEXT PRIMARY KEY,
    userId TEXT,
    jobRole TEXT,
    status TEXT,
    overallScore INTEGER,
    createdAt TEXT,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    downloadCount INTEGER,
    fileContent TEXT
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    category TEXT,
    rating INTEGER,
    comment TEXT,
    createdAt TEXT
  );
`);

// Seed default or migrate from existing db.json
const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  if (fs.existsSync(JSON_FILE)) {
    try {
      const raw = fs.readFileSync(JSON_FILE, 'utf8');
      const parsed = JSON.parse(raw);

      const insertUser = sqlite.prepare(`
        INSERT OR REPLACE INTO users (id, email, name, picture, role, branch, skills, projects, targetRole, experienceLevel, completedProfile)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      (parsed.users || []).forEach((u: User) => {
        insertUser.run(
          u.id,
          u.email,
          u.name,
          u.picture,
          u.role,
          u.branch || null,
          JSON.stringify(u.skills || []),
          JSON.stringify(u.projects || []),
          u.targetRole || null,
          u.experienceLevel || null,
          u.completedProfile ? 1 : 0
        );
      });

      const insertResume = sqlite.prepare(`
        INSERT OR REPLACE INTO resumes (id, userId, fileName, uploadedAt, atsScore, jdMatchScore, data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      (parsed.resumes || []).forEach((r: ResumeAnalysis) => {
        insertResume.run(r.id, r.userId, r.fileName, r.uploadedAt, r.atsScore, r.jdMatchScore || null, JSON.stringify(r));
      });

      const insertInterview = sqlite.prepare(`
        INSERT OR REPLACE INTO interviews (id, userId, jobRole, status, overallScore, createdAt, data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      (parsed.interviews || []).forEach((i: MockInterview) => {
        insertInterview.run(i.id, i.userId, i.jobRole, i.status, i.overallScore || null, i.createdAt, JSON.stringify(i));
      });

      const insertTemplate = sqlite.prepare(`
        INSERT OR REPLACE INTO templates (id, name, description, downloadCount, fileContent)
        VALUES (?, ?, ?, ?, ?)
      `);
      (parsed.templates || []).forEach((t: ResumeTemplate) => {
        insertTemplate.run(t.id, t.name, t.description, t.downloadCount, t.fileContent);
      });

      const insertFeedback = sqlite.prepare(`
        INSERT OR REPLACE INTO feedback (id, userId, userName, category, rating, comment, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      (parsed.feedback || []).forEach((f: StudentFeedback) => {
        insertFeedback.run(f.id, f.userId, f.userName, f.category, f.rating, f.comment, f.createdAt);
      });

      console.log('✅ Successfully migrated data from db.json into SQLite');
    } catch (err) {
      console.warn('Could not migrate db.json, inserting fresh seed:', err);
    }
  }
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    picture: row.picture,
    role: row.role,
    branch: row.branch || undefined,
    skills: row.skills ? JSON.parse(row.skills) : [],
    projects: row.projects ? JSON.parse(row.projects) : [],
    targetRole: row.targetRole || undefined,
    experienceLevel: row.experienceLevel || undefined,
    completedProfile: Boolean(row.completedProfile)
  };
}

export const db = {
  // --- USERS ---
  getUsers: (): User[] => {
    const rows = sqlite.prepare('SELECT * FROM users').all();
    return rows.map(rowToUser);
  },

  getUserById: (id: string): User | undefined => {
    const row = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return row ? rowToUser(row) : undefined;
  },

  getUserByEmail: (email: string): User | undefined => {
    const row = sqlite.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    return row ? rowToUser(row) : undefined;
  },

  saveUser: (user: User): User => {
    sqlite.prepare(`
      INSERT INTO users (id, email, name, picture, role, branch, skills, projects, targetRole, experienceLevel, completedProfile)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        picture = excluded.picture,
        role = excluded.role,
        branch = excluded.branch,
        skills = excluded.skills,
        projects = excluded.projects,
        targetRole = excluded.targetRole,
        experienceLevel = excluded.experienceLevel,
        completedProfile = excluded.completedProfile
    `).run(
      user.id,
      user.email,
      user.name,
      user.picture,
      user.role,
      user.branch || null,
      JSON.stringify(user.skills || []),
      JSON.stringify(user.projects || []),
      user.targetRole || null,
      user.experienceLevel || null,
      user.completedProfile ? 1 : 0
    );
    return user;
  },

  updateUserProfile: (id: string, updates: Partial<User>): User | undefined => {
    const existing = db.getUserById(id);
    if (!existing) return undefined;

    const merged: User = {
      ...existing,
      ...updates,
      completedProfile: true
    };
    db.saveUser(merged);
    return merged;
  },

  // --- RESUMES ---
  getResumes: (): ResumeAnalysis[] => {
    const rows = sqlite.prepare('SELECT data FROM resumes ORDER BY uploadedAt DESC').all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  },

  getResumeByUserId: (userId: string): ResumeAnalysis | undefined => {
    const row = sqlite.prepare('SELECT data FROM resumes WHERE userId = ? ORDER BY uploadedAt DESC LIMIT 1').get(userId) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : undefined;
  },

  saveResume: (resume: ResumeAnalysis): ResumeAnalysis => {
    sqlite.prepare(`
      INSERT INTO resumes (id, userId, fileName, uploadedAt, atsScore, jdMatchScore, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        userId = excluded.userId,
        fileName = excluded.fileName,
        uploadedAt = excluded.uploadedAt,
        atsScore = excluded.atsScore,
        jdMatchScore = excluded.jdMatchScore,
        data = excluded.data
    `).run(
      resume.id,
      resume.userId,
      resume.fileName,
      resume.uploadedAt,
      resume.atsScore,
      resume.jdMatchScore || null,
      JSON.stringify(resume)
    );
    return resume;
  },

  // --- INTERVIEWS ---
  getInterviews: (): MockInterview[] => {
    const rows = sqlite.prepare('SELECT data FROM interviews ORDER BY createdAt DESC').all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  },

  getInterviewsByUserId: (userId: string): MockInterview[] => {
    const rows = sqlite.prepare('SELECT data FROM interviews WHERE userId = ? ORDER BY createdAt DESC').all(userId) as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  },

  getInterviewById: (id: string): MockInterview | undefined => {
    const row = sqlite.prepare('SELECT data FROM interviews WHERE id = ?').get(id) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : undefined;
  },

  saveInterview: (interview: MockInterview): MockInterview => {
    sqlite.prepare(`
      INSERT INTO interviews (id, userId, jobRole, status, overallScore, createdAt, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        userId = excluded.userId,
        jobRole = excluded.jobRole,
        status = excluded.status,
        overallScore = excluded.overallScore,
        createdAt = excluded.createdAt,
        data = excluded.data
    `).run(
      interview.id,
      interview.userId,
      interview.jobRole,
      interview.status,
      interview.overallScore || null,
      interview.createdAt,
      JSON.stringify(interview)
    );
    return interview;
  },

  // --- TEMPLATES ---
  getTemplates: (): ResumeTemplate[] => {
    return sqlite.prepare('SELECT * FROM templates').all() as ResumeTemplate[];
  },

  incrementTemplateDownload: (id: string): void => {
    sqlite.prepare('UPDATE templates SET downloadCount = downloadCount + 1 WHERE id = ?').run(id);
  },

  addTemplate: (template: ResumeTemplate): ResumeTemplate => {
    sqlite.prepare(`
      INSERT INTO templates (id, name, description, downloadCount, fileContent)
      VALUES (?, ?, ?, ?, ?)
    `).run(template.id, template.name, template.description, template.downloadCount, template.fileContent);
    return template;
  },

  updateTemplate: (id: string, updates: Partial<ResumeTemplate>): ResumeTemplate | undefined => {
    const current = sqlite.prepare('SELECT * FROM templates WHERE id = ?').get(id) as ResumeTemplate | undefined;
    if (!current) return undefined;
    const merged = { ...current, ...updates };
    sqlite.prepare(`
      UPDATE templates SET name = ?, description = ?, downloadCount = ?, fileContent = ? WHERE id = ?
    `).run(merged.name, merged.description, merged.downloadCount, merged.fileContent, id);
    return merged;
  },

  deleteTemplate: (id: string): boolean => {
    const res = sqlite.prepare('DELETE FROM templates WHERE id = ?').run(id);
    return res.changes > 0;
  },

  // --- FEEDBACK ---
  getFeedbacks: (): StudentFeedback[] => {
    return sqlite.prepare('SELECT * FROM feedback ORDER BY createdAt DESC').all() as StudentFeedback[];
  },

  addFeedback: (feedback: StudentFeedback): StudentFeedback => {
    sqlite.prepare(`
      INSERT INTO feedback (id, userId, userName, category, rating, comment, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      feedback.id,
      feedback.userId,
      feedback.userName,
      feedback.category,
      feedback.rating,
      feedback.comment,
      feedback.createdAt
    );
    return feedback;
  },

  // --- METRICS ---
  getDashboardMetrics: (): DashboardMetrics => {
    const students = db.getUsers().filter(u => u.role === 'student');
    const completedInterviews = db.getInterviews().filter(i => i.status === 'completed');
    const resumes = db.getResumes();

    const totalATS = resumes.reduce((sum, r) => sum + r.atsScore, 0);
    const avgATS = resumes.length ? Math.round(totalATS / resumes.length) : 0;

    const totalInterviewScores = completedInterviews.reduce((sum, i) => sum + (i.overallScore || 0), 0);
    const avgInterview = completedInterviews.length ? Math.round(totalInterviewScores / completedInterviews.length) : 0;

    const branchCounts: { [key: string]: number } = {};
    students.forEach((s) => {
      if (s.branch) {
        branchCounts[s.branch] = (branchCounts[s.branch] || 0) + 1;
      }
    });
    const branchDistribution = Object.entries(branchCounts).map(([branch, count]) => ({
      branch,
      count
    }));

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCountMap: { [key: string]: number } = {};
    dayNames.forEach(d => { dayCountMap[d] = 0; });

    const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    completedInterviews.forEach((i) => {
      const d = new Date(i.createdAt);
      if (d.getTime() >= oneWeekAgo) {
        const dayName = dayNames[d.getDay()];
        dayCountMap[dayName] += 1;
      }
    });

    const weeklyInterviews = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(name => ({
      name,
      count: dayCountMap[name] || 0
    }));

    const activities: any[] = [];
    resumes.slice(0, 5).forEach((r) => {
      const u = db.getUserById(r.userId);
      activities.push({
        id: `act-res-${r.id}`,
        type: 'resume_upload',
        userName: u ? u.name : 'Unknown Student',
        detail: `Uploaded and evaluated resume (${r.fileName}) - ATS Score: ${r.atsScore}%`,
        timestamp: r.uploadedAt
      });
    });

    completedInterviews.slice(0, 5).forEach((i) => {
      const u = db.getUserById(i.userId);
      activities.push({
        id: `act-int-${i.id}`,
        type: 'interview_completed',
        userName: u ? u.name : 'Unknown Student',
        detail: `Completed mock interview for ${i.jobRole} - Score: ${i.overallScore}%`,
        timestamp: i.createdAt
      });
    });

    const recentActivity = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    return {
      totalStudents: students.length,
      totalInterviews: completedInterviews.length,
      avgATSScore: avgATS,
      avgInterviewScore: avgInterview,
      recentActivity,
      branchDistribution,
      weeklyInterviews
    };
  }
};