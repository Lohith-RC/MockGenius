import { describe, it, expect } from 'vitest';
import { db } from '../src/db/database.js';
import { aiService } from '../src/lib/gemini.js';

describe('Phase 4: SQLite Database Layer & Code Review', () => {
  it('should read seeded users from SQLite database', () => {
    const users = db.getUsers();
    expect(users.length).toBeGreaterThan(0);
    const admin = db.getUserById('admin-1');
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('admin');
  });

  it('should save and retrieve a new candidate in SQLite', () => {
    const testUser = {
      id: `test-${Date.now()}`,
      email: `candidate-${Date.now()}@example.com`,
      name: 'Test Candidate',
      picture: 'https://example.com/photo.jpg',
      role: 'student' as const,
      skills: ['React', 'TypeScript', 'Node.js'],
      projects: ['InterviewAI'],
      completedProfile: true
    };

    db.saveUser(testUser);
    const retrieved = db.getUserById(testUser.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Test Candidate');
    expect(retrieved?.skills).toContain('TypeScript');
  });

  it('should calculate algorithmic Big-O complexity in code review simulation', () => {
    const singleLoopCode = `
      function findMax(nums) {
        let max = nums[0];
        for (let i = 1; i < nums.length; i++) {
          if (nums[i] > max) max = nums[i];
        }
        return max;
      }
    `;

    const review = aiService.simulateCodeReview(singleLoopCode, 'javascript');
    expect(review.timeComplexity).toBe('O(N)');
    expect(review.correctness).toBeGreaterThan(60);
    expect(review.suggestions.length).toBeGreaterThan(0);
  });

  it('should detect nested loops as O(N^2) in code review simulation', () => {
    const nestedCode = `
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          console.log(i, j);
        }
      }
    `;

    const review = aiService.simulateCodeReview(nestedCode, 'javascript');
    expect(review.timeComplexity).toBe('O(N^2)');
  });
});
