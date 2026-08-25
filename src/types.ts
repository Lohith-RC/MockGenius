export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  role: 'student' | 'admin';
  branch?: string;
  skills?: string[];
  projects?: string[];
  targetRole?: string;
  experienceLevel?: string;
  completedProfile?: boolean;
}

export interface ResumeAnalysis {
  id: string;
  userId: string;
  fileName: string;
  uploadedAt: string;
  atsScore: number;
  skills: string[];
  missingSections: string[];
  suggestions: string[];
  grammarIssues: string[];
  keywords: { keyword: string; match: boolean }[];
  improvementsToAdd: string[];
  improvementsToRemove: string[];
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  grammar: string;
  clarity: string;
}

export interface InterviewAnswer {
  question: string;
  answer: string;
  evaluation?: AnswerEvaluation;
}

export interface MockInterview {
  id: string;
  userId: string;
  jobRole: string;
  branch: string;
  skills: string[];
  experienceLevel: string;
  status: 'started' | 'completed';
  questions: string[];
  currentQuestionIndex: number;
  answers: InterviewAnswer[];
  overallScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  confidenceScore?: number;
  feedbackText?: string;
  suggestions?: string[];
  createdAt: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  downloadCount: number;
  fileContent: string;
}

export interface StudentFeedback {
  id: string;
  userId: string;
  userName: string;
  category: 'interview' | 'resume' | 'general';
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  totalInterviews: number;
  avgATSScore: number;
  avgInterviewScore: number;
  recentActivity: {
    id: string;
    type: 'resume_upload' | 'interview_completed' | 'profile_updated';
    userName: string;
    detail: string;
    timestamp: string;
  }[];
  branchDistribution: { branch: string; count: number }[];
  weeklyInterviews: { name: string; count: number }[];
}
