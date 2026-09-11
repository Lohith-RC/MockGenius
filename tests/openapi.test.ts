import { describe, it, expect } from 'vitest';
import { openApiSpec } from '../src/lib/openapi.js';

describe('Phase 8: OpenAPI Specification & Docs', () => {
  it('should have valid OpenAPI 3.0.3 metadata structure', () => {
    expect(openApiSpec.openapi).toBe('3.0.3');
    expect(openApiSpec.info.title).toBe('InterviewAI API');
    expect(openApiSpec.info.version).toBe('1.0.0');
    expect(openApiSpec.paths).toBeDefined();
    expect(openApiSpec.components).toBeDefined();
  });

  it('should define all platform tags', () => {
    const tagNames = openApiSpec.tags.map((t) => t.name);
    expect(tagNames).toContain('Health');
    expect(tagNames).toContain('Auth');
    expect(tagNames).toContain('Profile');
    expect(tagNames).toContain('Resume');
    expect(tagNames).toContain('Interview');
    expect(tagNames).toContain('CodeLab');
    expect(tagNames).toContain('Admin');
  });

  it('should document essential enterprise endpoints', () => {
    const paths = Object.keys(openApiSpec.paths);
    expect(paths).toContain('/health');
    expect(paths).toContain('/api/auth/me');
    expect(paths).toContain('/api/auth/demo');
    expect(paths).toContain('/api/profile');
    expect(paths).toContain('/api/resume/upload');
    expect(paths).toContain('/api/resume/upload-with-jd');
    expect(paths).toContain('/api/interview/generate');
    expect(paths).toContain('/api/interview/{id}/answer');
    expect(paths).toContain('/api/interview/{id}/answer-stream');
    expect(paths).toContain('/api/interview/code-review');
    expect(paths).toContain('/api/admin/metrics');
  });

  it('should document CookieAuth and CsrfToken security schemes', () => {
    const schemes = openApiSpec.components.securitySchemes;
    expect(schemes.CookieAuth).toBeDefined();
    expect(schemes.CookieAuth.type).toBe('apiKey');
    expect(schemes.CookieAuth.name).toBe('session');

    expect(schemes.CsrfToken).toBeDefined();
    expect(schemes.CsrfToken.type).toBe('apiKey');
    expect(schemes.CsrfToken.name).toBe('X-CSRF-Token');
  });
});
