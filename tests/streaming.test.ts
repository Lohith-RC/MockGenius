import { describe, it, expect } from 'vitest';
import { aiService } from '../src/lib/gemini.js';

describe('Phase 5: Real-Time Streaming & Response UX', () => {
  it('should stream evaluation tokens via evaluateAnswerStream generator', async () => {
    const question = 'Explain the difference between SQL and NoSQL databases.';
    const answer = 'SQL databases are relational and table-based with fixed schema, whereas NoSQL databases are document or key-value based with flexible schema.';

    const stream = aiService.evaluateAnswerStream(question, answer);
    const tokens: string[] = [];

    for await (const chunk of stream) {
      tokens.push(chunk);
    }

    expect(tokens.length).toBeGreaterThan(0);
    const combined = tokens.join('');
    expect(combined.length).toBeGreaterThan(20);
    expect(combined.toLowerCase()).toContain('practical understanding');
  });

  it('should format SSE events correctly and parse them without errors', () => {
    const tokens = ['Great', ' ', 'answer', ' ', 'with', ' ', 'depth.'];
    const sseChunks = tokens.map((token) => `data: ${JSON.stringify({ token, done: false })}\n\n`);

    const finalEval = {
      score: 8,
      feedback: 'Great answer with depth.',
      technicalScore: 8,
      communicationScore: 8,
      confidenceScore: 8,
      grammar: 'Good',
      clarity: 'Good'
    };
    sseChunks.push(`data: ${JSON.stringify({ done: true, evaluation: finalEval })}\n\n`);

    const rawStreamOutput = sseChunks.join('');
    const blocks = rawStreamOutput.split('\n\n').filter(Boolean);

    const parsedTokens: string[] = [];
    let parsedDone = false;
    let receivedEval: any = null;

    for (const block of blocks) {
      const match = block.trim().match(/^data:\s*(.+)$/m);
      expect(match).not.toBeNull();
      const payload = JSON.parse(match![1]);
      if (payload.token) {
        parsedTokens.push(payload.token);
      }
      if (payload.done) {
        parsedDone = true;
        receivedEval = payload.evaluation;
      }
    }

    expect(parsedTokens.join('')).toBe('Great answer with depth.');
    expect(parsedDone).toBe(true);
    expect(receivedEval.score).toBe(8);
  });

  it('should handle brief answers gracefully during evaluation streaming', async () => {
    const question = 'What is recursion?';
    const answer = 'Recursion.'; // length < 15 triggers brevity warning

    const stream = aiService.evaluateAnswerStream(question, answer);
    const tokens: string[] = [];

    for await (const chunk of stream) {
      tokens.push(chunk);
    }

    expect(tokens.length).toBeGreaterThan(0);
    const combined = tokens.join('');
    // Brief answer simulation warns about brevity
    expect(combined.toLowerCase()).toContain('brief');
  });
});
