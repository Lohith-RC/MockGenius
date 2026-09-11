// ponytail: deprecated — replaced by database.ts (SQLite). Kept for reference.
import fs from 'fs';
import path from 'path';
import { User, ResumeAnalysis, MockInterview, ResumeTemplate, StudentFeedback, DashboardMetrics } from '../types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface Schema {
  users: User[];
  resumes: ResumeAnalysis[];
  interviews: MockInterview[];
  templates: ResumeTemplate[];
  feedback: StudentFeedback[];
}

const DEFAULT_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'template-1',
    name: 'Standard ATS Minimalist',
    description: 'A clean, highly parseable single-column format recommended for software engineering and technical roles.',
    downloadCount: 142,
    fileContent: `# [Your Name]
[City, State] | [Phone Number] | [Email] | [LinkedIn URL] | [GitHub URL]

## EDUCATION
**[University Name]** | [Degree, e.g., B.S. in Computer Science]
*Graduation Date: [Month, Year] | GPA: [X.X/4.0 or percentage]*

## TECHNICAL SKILLS
* **Languages:** Java, Python, C++, SQL, TypeScript, JavaScript
* **Frameworks/Libraries:** Spring Boot, React, Node.js, Express, Tailwind CSS
* **Developer Tools:** Git, Docker, AWS, Google Cloud, PostgreSQL, MongoDB

## WORK EXPERIENCE
**[Company Name]** | [Job Title, e.g., Software Engineering Intern]
*[Month, Year] – [Month, Year] | [City, State]*
* Designed and implemented dynamic web interfaces using React and Tailwind CSS, increasing page load performance by 15%.
* Developed microservices with Spring Boot and integrated PostgreSQL database, reducing API latency by 20%.
* Collaborated in an agile team of 5 engineers to deliver critical core features under strict timelines.

## PROJECTS
**[Project Name (e.g., InterviewAI Platform)]** | *React, Express, Tailwind, Gemini API*
*[Month, Year] – [Month, Year]*
* Engineered an AI-driven interview preparation system with real-time feedback and dynamic mock questionnaires.
* Optimized data persistence utilizing structured file arrays, reducing runtime dependencies by 100%.
`
  },
  {
    id: 'template-2',
    name: 'Professional Modern Two-Column',
    description: 'A stylish layout with a sidebar highlighting technical competencies, suited for frontend and full-stack developers.',
    downloadCount: 98,
    fileContent: `# [Your Name] - Full Stack Developer
[Email] • [Phone] • [Website] • [GitHub]

## SUMMARY
Motivated Computer Science graduate with hands-on experience in full-stack application development. Skilled in building resilient, server-side APIs and engaging, interactive browser interfaces.

## KEY PROJECTS
### [Project 1 Name] - *Spring Boot, Angular, PostgreSQL*
* Designed a relational schema for robust transaction tracking with ACID compliance.
* Built microservice endpoints with custom token-based filter authentication.

### [Project 2 Name] - *React, Tailwind CSS, Firebase*
* Constructed a collaborative canvas dashboard utilizing real-time event-driven updates.
`
  },
  {
    id: 'template-3',
    name: 'Executive Tech Lead Format',
    description: 'A comprehensive layout that emphasizes professional experience, projects, and systems architecture skills.',
    downloadCount: 65,
    fileContent: `# [Your Name]
[Contact Details] • [Portfolio Link] • [GitHub]

## PROFESSIONAL EXPERIENCE
**Junior Software Engineer** | [Tech Corp]
*[Month, Year] - Present*
* Spearheaded transition of legacy monolithic endpoints to scalable RESTful services, servicing 10k+ daily queries.
* Maintained CI/CD pipelines to guarantee seamless deployments with zero-downtime rollback controls.
`
  }
];

function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData: Schema = {
      users: [
        {
          id: 'admin-1',
          email: 'admin@interviewai.com',
          name: 'Super Admin',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
          role: 'admin',
          completedProfile: true
        },
        {
          id: 'demo-student-1',
          email: 'student@interviewai.com',
          name: 'Jane Doe',
          picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
          role: 'student',
          branch: 'Computer Science',
          skills: ['React', 'JavaScript', 'SQL', 'TypeScript'],
          projects: ['Portfolio Website', 'Weather App'],
          targetRole: 'Full Stack Engineer',
          experienceLevel: 'Entry Level',
          completedProfile: true
        }
      ],
      resumes: [
        {
          id: 'res-1',
          userId: 'demo-student-1',
          fileName: 'Jane_Doe_CS_Resume.pdf',
          uploadedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
          atsScore: 78,
          skills: ['React', 'JavaScript', 'SQL', 'TypeScript', 'Node.js', 'HTML/CSS'],
          missingSections: ['Certifications', 'Summary Statement'],
          suggestions: [
            'Add a brief Summary section at the top of your resume highlighting your core accomplishments.',
            'Include relevant academic/industry certifications to strengthen your profile.',
            'Use more impact-driven bullet points starting with action verbs (e.g., "Led", "Optimized", "Engineered").'
          ],
          grammarIssues: ['Found inconsistent capitalization in job titles ("Full-stack" vs "Full Stack").'],
          keywords: [
            { keyword: 'React', match: true },
            { keyword: 'Node.js', match: false },
            { keyword: 'Docker', match: false },
            { keyword: 'RESTful APIs', match: true },
            { keyword: 'PostgreSQL', match: false }
          ],
          improvementsToAdd: ['Node.js', 'PostgreSQL', 'Docker', 'AWS'],
          improvementsToRemove: ['Irrelevant hobbies', 'High school GPA (if college senior)']
        }
      ],
      interviews: [
        {
          id: 'int-1',
          userId: 'demo-student-1',
          jobRole: 'Full Stack Engineer',
          branch: 'Computer Science',
          skills: ['React', 'TypeScript', 'SQL'],
          experienceLevel: 'Entry Level',
          status: 'completed',
          questions: [
            'Explain the virtual DOM and how React renders changes.',
            'What is the difference between SQL and NoSQL databases?',
            'Tell me about a challenging technical project you worked on.'
          ],
          currentQuestionIndex: 3,
          answers: [
            {
              question: 'Explain the virtual DOM and how React renders changes.',
              answer: 'React creates an in-memory lightweight representation of the real DOM. When state updates, React builds a new virtual DOM tree, compares it with the previous one (diffing), and calculates the minimal updates to apply to the real DOM (reconciliation).',
              evaluation: {
                score: 9,
                feedback: 'Excellent answer. You correctly covered both the diffing process and reconciliation.',
                technicalScore: 9,
                communicationScore: 9,
                confidenceScore: 8,
                grammar: 'Perfect.',
                clarity: 'Highly clear.'
              }
            },
            {
              question: 'What is the difference between SQL and NoSQL databases?',
              answer: 'SQL databases are relational, table-based, with fixed schemas and support ACID compliance. NoSQL are non-relational, document or key-value based, with dynamic schemas, designed for horizontal scalability.',
              evaluation: {
                score: 8,
                feedback: 'Solid explanation of SQL vs NoSQL, clearly stating schemas and scalability models.',
                technicalScore: 8,
                communicationScore: 8,
                confidenceScore: 8,
                grammar: 'Excellent.',
                clarity: 'Clear.'
              }
            },
            {
              question: 'Tell me about a challenging technical project you worked on.',
              answer: 'I worked on a portfolio project where I had to sync state across views. It was challenging because I had prop drilling, so I implemented React Context to solve the complex prop propagation.',
              evaluation: {
                score: 7,
                feedback: 'Good description of React Context. Try using the STAR method (Situation, Task, Action, Result) to format your story more impactfully next time.',
                technicalScore: 7,
                communicationScore: 8,
                confidenceScore: 7,
                grammar: 'Minor phrasing issues.',
                clarity: 'Understandable.'
              }
            }
          ],
          overallScore: 80,
          technicalScore: 80,
          communicationScore: 83,
          confidenceScore: 77,
          feedbackText: 'Great overall performance Jane! Your React and database theory is very strong. Continue working on structuring your behavioral/project-based answers using action-oriented frameworks like STAR.',
          suggestions: [
            'Use the STAR framework for project-based questions.',
            'Add more concrete metrics when explaining what you built (e.g., "achieved 15% improvement").',
            'Slightly slow down your speaking pace to sound more composed and confident.'
          ],
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        }
      ],
      templates: DEFAULT_TEMPLATES,
      feedback: [
        {
          id: 'feed-1',
          userId: 'demo-student-1',
          userName: 'Jane Doe',
          category: 'interview',
          rating: 5,
          comment: 'The AI feedback after my mock interview was incredibly detailed! It felt like talking to a real technical interviewer.',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

// Make sure it runs
initDb();

function readDb(): Schema {
  try {
    initDb();
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading JSON DB, reinitializing:', err);
    return { users: [], resumes: [], interviews: [], templates: DEFAULT_TEMPLATES, feedback: [] };
  }
}

function writeDb(data: Schema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing JSON DB:', err);
  }
}

export const jsonDb = {
  // --- USERS ---
  getUsers: (): User[] => readDb().users,
  getUserById: (id: string): User | undefined => {
    return readDb().users.find((u) => u.id === id);
  },
  getUserByEmail: (email: string): User | undefined => {
    return readDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  saveUser: (user: User): User => {
    const db = readDb();
    const idx = db.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      db.users[idx] = { ...db.users[idx], ...user };
    } else {
      db.users.push(user);
    }
    writeDb(db);
    return user;
  },
  updateUserProfile: (id: string, updates: Partial<User>): User | undefined => {
    const db = readDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      db.users[idx] = { ...db.users[idx], ...updates, completedProfile: true };
      writeDb(db);
      return db.users[idx];
    }
    return undefined;
  },

  // --- RESUMES ---
  getResumes: (): ResumeAnalysis[] => readDb().resumes,
  getResumeByUserId: (userId: string): ResumeAnalysis | undefined => {
    return readDb().resumes.find((r) => r.userId === userId);
  },
  saveResume: (resume: ResumeAnalysis): ResumeAnalysis => {
    const db = readDb();
    const idx = db.resumes.findIndex((r) => r.userId === resume.userId);
    if (idx >= 0) {
      db.resumes[idx] = resume;
    } else {
      db.resumes.push(resume);
    }
    writeDb(db);
    return resume;
  },

  // --- INTERVIEWS ---
  getInterviews: (): MockInterview[] => readDb().interviews,
  getInterviewsByUserId: (userId: string): MockInterview[] => {
    return readDb().interviews
      .filter((i) => i.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  getInterviewById: (id: string): MockInterview | undefined => {
    return readDb().interviews.find((i) => i.id === id);
  },
  saveInterview: (interview: MockInterview): MockInterview => {
    const db = readDb();
    const idx = db.interviews.findIndex((i) => i.id === interview.id);
    if (idx >= 0) {
      db.interviews[idx] = interview;
    } else {
      db.interviews.push(interview);
    }
    writeDb(db);
    return interview;
  },

  // --- TEMPLATES ---
  getTemplates: (): ResumeTemplate[] => readDb().templates,
  incrementTemplateDownload: (id: string): void => {
    const db = readDb();
    const t = db.templates.find((x) => x.id === id);
    if (t) {
      t.downloadCount += 1;
      writeDb(db);
    }
  },
  addTemplate: (template: ResumeTemplate): ResumeTemplate => {
    const db = readDb();
    db.templates.push(template);
    writeDb(db);
    return template;
  },
  updateTemplate: (id: string, updates: Partial<ResumeTemplate>): ResumeTemplate | undefined => {
    const db = readDb();
    const idx = db.templates.findIndex((t) => t.id === id);
    if (idx >= 0) {
      db.templates[idx] = { ...db.templates[idx], ...updates };
      writeDb(db);
      return db.templates[idx];
    }
    return undefined;
  },
  deleteTemplate: (id: string): boolean => {
    const db = readDb();
    const idx = db.templates.findIndex((t) => t.id === id);
    if (idx >= 0) {
      db.templates.splice(idx, 1);
      writeDb(db);
      return true;
    }
    return false;
  },

  // --- FEEDBACK ---
  getFeedbacks: (): StudentFeedback[] => readDb().feedback,
  addFeedback: (feedback: StudentFeedback): StudentFeedback => {
    const db = readDb();
    db.feedback.push(feedback);
    writeDb(db);
    return feedback;
  },

  // --- METRICS ---
  getDashboardMetrics: (): DashboardMetrics => {
    const db = readDb();
    const students = db.users.filter((u) => u.role === 'student');
    const completedInterviews = db.interviews.filter((i) => i.status === 'completed');

    // Calculate averages
    const totalATS = db.resumes.reduce((sum, r) => sum + r.atsScore, 0);
    const avgATS = db.resumes.length ? Math.round(totalATS / db.resumes.length) : 0;

    const totalInterviewScores = completedInterviews.reduce((sum, i) => sum + (i.overallScore || 0), 0);
    const avgInterview = completedInterviews.length ? Math.round(totalInterviewScores / completedInterviews.length) : 0;

    // Branches distribution
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

    // Dynamic weekly interviews chart based on real data
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

    // Recent Activity
    const activities: any[] = [];
    db.resumes.slice(-5).forEach((r) => {
      const u = db.users.find((user) => user.id === r.userId);
      activities.push({
        id: `act-res-${r.id}`,
        type: 'resume_upload',
        userName: u ? u.name : 'Unknown Student',
        detail: `Uploaded and evaluated resume (${r.fileName}) - ATS Score: ${r.atsScore}%`,
        timestamp: r.uploadedAt
      });
    });

    completedInterviews.slice(-5).forEach((i) => {
      const u = db.users.find((user) => user.id === i.userId);
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
