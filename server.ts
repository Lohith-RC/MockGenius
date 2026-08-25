import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { jsonDb } from './src/db/jsonStore.js';
import { aiService } from './src/lib/gemini.js';
import { User, ResumeAnalysis, MockInterview, StudentFeedback, ResumeTemplate } from './src/types.js';
import { validateEnvironment } from './src/lib/validateEnv.js';
import { logger } from './src/lib/logger.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health') {
      logger.info(`${req.method} ${req.path}`, {
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    }
  });
  next();
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Detect production mode for cookie configuration
const IS_PROD = process.env.NODE_ENV === 'production';

// Helper to extract session userId from Cookie
function getSessionUserId(req: express.Request): string | null {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/session=([^;]+)/);
  return match ? match[1] : null;
}

// Helper to set cookie headers safely
function setSessionCookie(res: express.Response, userId: string) {
  const cookieOptions = IS_PROD
    ? `session=${userId}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=${30 * 24 * 3600}`
    : `session=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 3600}`;
  res.setHeader('Set-Cookie', cookieOptions);
}

function clearSessionCookie(res: express.Response) {
  const cookieOptions = IS_PROD
    ? `session=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0`
    : `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  res.setHeader('Set-Cookie', cookieOptions);
}

// Helper to get Redirect URI based on request context or APP_URL env
function getRedirectUri(req: express.Request): string {
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    const cleanUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    return `${cleanUrl}/auth/callback`;
  }
  return `${req.protocol}://${req.get('host')}/auth/callback`;
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// GET the Google OAuth URL for the popup flow
app.get('/api/auth/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getRedirectUri(req);

  if (!clientId || clientId === 'MY_GOOGLE_CLIENT_ID') {
    return res.status(400).json({
      error: 'Google OAuth Client ID is not configured in Secrets panel.',
      instructions: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your Secrets settings to test real OAuth login. In the meantime, please use the "Demo Login" feature.'
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    prompt: 'consent',
    access_type: 'offline'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl });
});

// OAuth Callback handler (Popup opens this, exchanges code, close popup)
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fafafa;">
          <div style="text-align: center; max-width: 450px; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #ef4444; margin-bottom: 0.5rem;">Authentication Error</h2>
            <p style="color: #4b5563;">${error}</p>
            <button onclick="window.close()" style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-top: 1rem;">Close Window</button>
          </div>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getRedirectUri(req);

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // Fetch user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to retrieve user profile info from Google API');
    }

    const userInfo = await userInfoResponse.json();
    const { sub, name, email, picture } = userInfo;

    // Save or update user
    let user = jsonDb.getUserByEmail(email);
    if (!user) {
      // Auto-create student profile on first login
      user = {
        id: `usr-${sub}`,
        email,
        name: name || 'New Student',
        picture: picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        role: email.includes('admin') || email.includes('placement_coordinator') ? 'admin' : 'student',
        completedProfile: false
      };
      jsonDb.saveUser(user);
    }

    // Set cookie on response
    setSessionCookie(res, user.id);

    // Send successful message back to React window and close popup
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fafafa; color: #1f2937;">
          <div style="text-align: center;">
            <div style="margin-bottom: 1rem; color: #10b981; font-size: 3rem;">✓</div>
            <h3 style="margin-bottom: 0.25rem; font-weight: 600;">Login Successful!</h3>
            <p style="color: #6b7280; font-size: 0.875rem;">Closing this authenticating popup window...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                setTimeout(() => window.close(), 1000);
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `);

  } catch (err: any) {
    console.error('OAuth Callback Error:', err);
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

// Demo Login endpoint (Bypasses Google OAuth for development/immediate previews)
app.post('/api/auth/demo', (req, res) => {
  const { role } = req.body; // 'student' or 'admin'

  if (role === 'admin') {
    const adminUser = jsonDb.getUserById('admin-1');
    if (adminUser) {
      setSessionCookie(res, adminUser.id);
      return res.json({ success: true, user: adminUser });
    }
  }

  // default to demo student
  const studentUser = jsonDb.getUserById('demo-student-1');
  if (studentUser) {
    setSessionCookie(res, studentUser.id);
    return res.json({ success: true, user: studentUser });
  }

  res.status(400).json({ error: 'Demo user not initialized.' });
});

// Get current session details
app.get('/api/auth/me', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ authenticated: false });
  }

  const user = jsonDb.getUserById(userId);
  if (!user) {
    clearSessionCookie(res);
    return res.status(401).json({ authenticated: false });
  }

  res.json({ authenticated: true, success: true, user });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

// ==========================================
// 2. USER PROFILE ENDPOINTS
// ==========================================

// Get and update user profile
app.put('/api/profile', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { branch, skills, projects, targetRole, experienceLevel } = req.body;

  const parsedSkills = Array.isArray(skills) ? skills : (skills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const parsedProjects = Array.isArray(projects) ? projects : (projects || '').split(',').map((p: string) => p.trim()).filter(Boolean);

  const updatedUser = jsonDb.updateUserProfile(userId, {
    branch,
    skills: parsedSkills,
    projects: parsedProjects,
    targetRole,
    experienceLevel
  });

  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ success: true, user: updatedUser });
});

// ==========================================
// 3. RESUME ENDPOINTS
// ==========================================

// Upload and analyze resume
app.post('/api/resume/upload', async (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { fileName, resumeText } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: 'Resume text content is required' });
  }

  try {
    // Run AI resume scanner
    const analysisResult = await aiService.analyzeResume(resumeText, fileName);
    analysisResult.userId = userId;

    // Save to local JSON store
    const savedResume = jsonDb.saveResume(analysisResult);

    // Update user profile skills if the user profile skills list is empty
    const user = jsonDb.getUserById(userId);
    if (user && (!user.skills || user.skills.length === 0)) {
      jsonDb.updateUserProfile(userId, {
        skills: savedResume.skills.slice(0, 8)
      });
    }

    res.json({ success: true, analysis: savedResume });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to analyze resume', details: error.message });
  }
});

// Get user's active resume analysis
app.get('/api/resume/my-analysis', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const analysis = jsonDb.getResumeByUserId(userId);
  res.json({ success: true, analysis: analysis || null });
});

// Get ATS-friendly resume templates
app.get('/api/resume/templates', (req, res) => {
  const templates = jsonDb.getTemplates();
  res.json({ success: true, templates });
});

// Download/increment counter
app.post('/api/resume/templates/:id/download', (req, res) => {
  const { id } = req.params;
  jsonDb.incrementTemplateDownload(id);
  res.json({ success: true });
});

// ==========================================
// 4. INTERVIEW ENDPOINTS
// ==========================================

// IMPORTANT: /history MUST be defined BEFORE /:id to avoid route shadowing
// Get user's interview history
app.get('/api/interview/history', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const history = jsonDb.getInterviewsByUserId(userId);
  res.json({ success: true, history });
});

// Generate mock interview questions and start session
app.post('/api/interview/generate', async (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = jsonDb.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const branch = user.branch || 'General Engineering';
  const skills = user.skills || ['Coding'];
  const projects = user.projects || ['Main Project'];
  const targetRole = user.targetRole || 'Software Engineer';
  const experienceLevel = user.experienceLevel || 'Entry Level';

  const resume = jsonDb.getResumeByUserId(userId);
  const resumeText = resume ? `Extracted skills: ${resume.skills.join(', ')}. Suggestions: ${resume.suggestions.join('. ')}` : '';

  try {
    const questions = await aiService.generateQuestions(
      resumeText,
      branch,
      skills,
      projects,
      targetRole,
      experienceLevel
    );

    const interview: MockInterview = {
      id: `int-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      jobRole: targetRole,
      branch,
      skills,
      experienceLevel,
      status: 'started',
      questions,
      currentQuestionIndex: 0,
      answers: [],
      createdAt: new Date().toISOString()
    };

    const savedInterview = jsonDb.saveInterview(interview);
    res.json({ success: true, interview: savedInterview });

  } catch (error: any) {
    console.error('Interview generate error:', error);
    res.status(500).json({ error: 'Failed to generate interview questions', details: error.message });
  }
});

// Get specific interview details
app.get('/api/interview/:id', (req, res) => {
  const { id } = req.params;
  const interview = jsonDb.getInterviewById(id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview session not found' });
  }
  res.json({ success: true, interview });
});

// Answer the current interview question and evaluate it
app.post('/api/interview/:id/answer', async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  const interview = jsonDb.getInterviewById(id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview session not found' });
  }

  const currentQuestion = interview.questions[interview.currentQuestionIndex];

  try {
    // Evaluate current answer
    const evaluation = await aiService.evaluateAnswer(currentQuestion, answer);

    interview.answers.push({
      question: currentQuestion,
      answer,
      evaluation
    });

    interview.currentQuestionIndex += 1;

    // Check if that was the last question
    if (interview.currentQuestionIndex >= interview.questions.length) {
      interview.status = 'completed';

      // Generate overall evaluation report
      const report = await aiService.generateOverallReport(interview.jobRole, interview.answers);

      interview.overallScore = report.overallScore;
      interview.technicalScore = report.technicalScore;
      interview.communicationScore = report.communicationScore;
      interview.confidenceScore = report.confidenceScore;
      interview.feedbackText = report.feedbackText;
      interview.suggestions = report.suggestions;
    }

    const saved = jsonDb.saveInterview(interview);
    res.json({ success: true, interview: saved, currentEvaluation: evaluation });

  } catch (error: any) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to evaluate your answer', details: error.message });
  }
});

// ==========================================
// 5. FEEDBACK ENDPOINT
// ==========================================

app.post('/api/feedback', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = jsonDb.getUserById(userId);
  const { category, rating, comment } = req.body;

  if (!rating || !comment) {
    return res.status(400).json({ error: 'Rating and feedback comments are required' });
  }

  const newFeedback: StudentFeedback = {
    id: `fdb-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    userName: user ? user.name : 'Student',
    category,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString()
  };

  const saved = jsonDb.addFeedback(newFeedback);
  res.json({ success: true, feedback: saved });
});

// ==========================================
// 6. ADMIN DASHBOARD ENDPOINTS
// ==========================================

// Middleware to verify Admin role
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = jsonDb.getUserById(userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required' });
  }

  next();
}

// Get admin system analytics dashboard
app.get('/api/admin/metrics', requireAdmin, (req, res) => {
  const metrics = jsonDb.getDashboardMetrics();
  res.json({ success: true, metrics });
});

// Get registered students list with filters
app.get('/api/admin/students', requireAdmin, (req, res) => {
  const { search, branch, minScore } = req.query;

  let studentsList = jsonDb.getUsers()
    .filter((u) => u.role === 'student')
    .map((student) => {
      // Find matching resume
      const resume = jsonDb.getResumeByUserId(student.id);
      // Find matching interviews completed
      const studentInterviews = jsonDb.getInterviewsByUserId(student.id)
        .filter((i) => i.status === 'completed');

      const latestInterview = studentInterviews[0];

      return {
        ...student,
        resumeScore: resume ? resume.atsScore : null,
        resumeFileName: resume ? resume.fileName : null,
        resumeUploadedAt: resume ? resume.uploadedAt : null,
        interviewsCompleted: studentInterviews.length,
        latestInterviewScore: latestInterview ? latestInterview.overallScore : null,
        latestInterviewDate: latestInterview ? latestInterview.createdAt : null,
        latestInterviewRole: latestInterview ? latestInterview.jobRole : null
      };
    });

  // Apply Search
  if (search) {
    const q = (search as string).toLowerCase();
    studentsList = studentsList.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }

  // Apply Branch Filter
  if (branch && branch !== 'all') {
    studentsList = studentsList.filter(
      (s) => s.branch && s.branch.toLowerCase() === (branch as string).toLowerCase()
    );
  }

  // Apply ATS Score Filter
  if (minScore) {
    const scoreVal = Number(minScore);
    studentsList = studentsList.filter(
      (s) => s.resumeScore !== null && s.resumeScore >= scoreVal
    );
  }

  res.json({ success: true, students: studentsList });
});

// Get admin feedback entries
app.get('/api/admin/feedbacks', requireAdmin, (req, res) => {
  const feedbacks = jsonDb.getFeedbacks();
  res.json({ success: true, feedbacks });
});

// Get full interview report for admin drill-down
app.get('/api/admin/interview/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const interview = jsonDb.getInterviewById(id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }
  const user = jsonDb.getUserById(interview.userId);
  res.json({ success: true, interview, studentName: user ? user.name : 'Unknown' });
});

// Get all interviews for a specific student (admin drill-down)
app.get('/api/admin/student/:userId/interviews', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const interviews = jsonDb.getInterviewsByUserId(userId);
  res.json({ success: true, interviews });
});

// Get resume analysis for a specific student (admin drill-down)
app.get('/api/admin/student/:userId/resume', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const resume = jsonDb.getResumeByUserId(userId);
  res.json({ success: true, analysis: resume || null });
});

// ==========================================
// 7. ADMIN TEMPLATE MANAGEMENT
// ==========================================

// Add a new resume template (admin only)
app.post('/api/admin/templates', requireAdmin, (req, res) => {
  const { name, description, fileContent } = req.body;
  if (!name || !description || !fileContent) {
    return res.status(400).json({ error: 'Name, description, and fileContent are required' });
  }

  const template: ResumeTemplate = {
    id: `template-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    downloadCount: 0,
    fileContent
  };

  const saved = jsonDb.addTemplate(template);
  res.json({ success: true, template: saved });
});

// Update an existing template (admin only)
app.put('/api/admin/templates/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, fileContent } = req.body;

  const updated = jsonDb.updateTemplate(id, { name, description, fileContent });
  if (!updated) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json({ success: true, template: updated });
});

// Delete a template (admin only)
app.delete('/api/admin/templates/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = jsonDb.deleteTemplate(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json({ success: true });
});

// ==========================================
// 8. HEALTH CHECK ENDPOINT
// ==========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==========================================
// 9. MONITORING ENDPOINT
// ==========================================

app.get('/monitor', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    },
    cpu: process.cpuUsage(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// ==========================================
// 9. VITE MIDDLEWARE & STATIC ASSETS
// ==========================================

async function startServer() {
  // Validate environment variables
  validateEnvironment();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InterviewAI server running on port ${PORT}`);
  });
}

startServer();
