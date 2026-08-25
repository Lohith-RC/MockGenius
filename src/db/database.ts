/**
 * Database abstraction layer for InterviewAI
 * Supports both JSON and PostgreSQL backends
 */

import { User, ResumeAnalysis, MockInterview, StudentFeedback, ResumeTemplate } from '../types.js';

export interface DatabaseAdapter {
  // User operations
  getUserById(id: string): User | null;
  getUserByEmail(email: string): User | null;
  getUsers(): User[];
  saveUser(user: User): User;
  updateUserProfile(id: string, updates: Partial<User>): User | null;

  // Resume operations
  getResumeByUserId(userId: string): ResumeAnalysis | null;
  saveResume(resume: ResumeAnalysis): ResumeAnalysis;

  // Interview operations
  getInterviewById(id: string): MockInterview | null;
  getInterviewsByUserId(userId: string): MockInterview[];
  saveInterview(interview: MockInterview): MockInterview;

  // Feedback operations
  getFeedbacks(): StudentFeedback[];
  addFeedback(feedback: StudentFeedback): StudentFeedback;

  // Template operations
  getTemplates(): ResumeTemplate[];
  addTemplate(template: ResumeTemplate): ResumeTemplate;
  updateTemplate(id: string, updates: Partial<ResumeTemplate>): ResumeTemplate | null;
  deleteTemplate(id: string): boolean;
  incrementTemplateDownload(id: string): void;

  // Dashboard metrics
  getDashboardMetrics(): any;
}

// Factory function to create the appropriate database adapter
export function createDatabaseAdapter(): DatabaseAdapter {
  const dbType = process.env.DATABASE_TYPE || 'json';

  if (dbType === 'postgresql') {
    // Will be implemented in Phase 2
    throw new Error('PostgreSQL adapter not yet implemented');
  }

  // Default to JSON adapter
  const { jsonDb } = require('./jsonStore.js');
  return jsonDb;
}