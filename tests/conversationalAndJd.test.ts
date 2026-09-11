import { describe, it, expect } from 'vitest';
import { aiService } from '../src/lib/gemini.js';

describe('Phase 3: Conversational AI & JD Matcher', () => {
  it('should generate targeted follow-up question for database scaling answers', () => {
    const originalQ = "How do you scale your web backend?";
    const answer = "I scale PostgreSQL by adding read replicas and using connection pooling.";
    const followUp = aiService.simulateFollowUp(originalQ, answer);

    expect(followUp.toLowerCase()).toContain('database');
    expect(followUp.toLowerCase()).toContain('replicas');
  });

  it('should generate targeted follow-up question for React frontend answers', () => {
    const originalQ = "Explain your frontend architecture.";
    const answer = "We built the frontend with React and managed state across views.";
    const followUp = aiService.simulateFollowUp(originalQ, answer);

    expect(followUp.toLowerCase()).toContain('react');
    expect(followUp.toLowerCase()).toContain('re-renders');
  });

  it('should evaluate resume against target job description and compute JD match metrics', () => {
    const resumeText = "Experienced full-stack engineer with React, TypeScript, Node.js, and SQL.";
    const jobDescription = "Looking for a Senior Engineer skilled in React, TypeScript, Docker, Kubernetes, and AWS.";

    const result = aiService.simulateResumeWithJD(resumeText, jobDescription, 'candidate_resume.pdf');

    expect(result.jdMatchScore).toBeDefined();
    expect(result.jdMatchScore).toBeGreaterThan(0);
    expect(result.jdMatchScore).toBeLessThanOrEqual(100);

    // Matched keywords should contain REACT and TYPESCRIPT
    expect(result.matchedJDKeywords).toContain('REACT');
    expect(result.matchedJDKeywords).toContain('TYPESCRIPT');

    // Missing keywords should contain DOCKER or KUBERNETES or AWS
    expect(result.missingJDKeywords.some(kw => ['DOCKER', 'KUBERNETES', 'AWS'].includes(kw))).toBe(true);
  });
});
