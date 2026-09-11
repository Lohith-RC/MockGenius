import { describe, it, expect } from 'vitest';

const FILLER_WORD_REGEX = /\b(um|uh|like|you know|basically|actually|literally|so yeah|sort of|kind of|i mean)\b/gi;

function countFillerWords(text: string): number {
  if (!text) return 0;
  const matches = text.match(FILLER_WORD_REGEX);
  return matches ? matches.length : 0;
}

function calculateWPM(text: string, durationSeconds: number): number {
  if (!text || durationSeconds < 3) return 0;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = durationSeconds / 60;
  return Math.round(wordCount / minutes);
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

describe('Speech Analytics Engine', () => {
  it('should accurately count filler words in candidate answers', () => {
    const speech = "Um, so basically I built this microservice using Node.js and, like, it handles 10k RPS.";
    expect(countFillerWords(speech)).toBe(3); // um, basically, like
  });

  it('should return 0 filler words for clean, articulate response', () => {
    const cleanSpeech = "I designed a distributed cache using Redis and PostgreSQL with read replicas.";
    expect(countFillerWords(cleanSpeech)).toBe(0);
  });

  it('should calculate words per minute (WPM) accurately', () => {
    // 60 words in 30 seconds -> 120 WPM
    const words = new Array(60).fill('word').join(' ');
    expect(calculateWPM(words, 30)).toBe(120);
  });

  it('should format interview timer correctly into mm:ss', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(600)).toBe('10:00');
  });
});
