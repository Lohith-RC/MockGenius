import { describe, it, expect } from 'vitest';
import { generateCsrfToken, getCookie, verifyCsrf } from '../server.js';

describe('Phase 6: Production Security Hardening', () => {
  it('should generate secure cryptographically random CSRF tokens', () => {
    const token1 = generateCsrfToken();
    const token2 = generateCsrfToken();

    expect(token1).toHaveLength(48);
    expect(token2).toHaveLength(48);
    expect(token1).not.toBe(token2);
    expect(/^[0-9a-f]{48}$/.test(token1)).toBe(true);
  });

  it('should extract cookies accurately using getCookie helper', () => {
    const mockReq1 = {
      headers: {
        cookie: 'session=user-123.sig; csrf-token=abc123xyz; other=value'
      }
    } as any;

    expect(getCookie(mockReq1, 'csrf-token')).toBe('abc123xyz');
    expect(getCookie(mockReq1, 'session')).toBe('user-123.sig');
    expect(getCookie(mockReq1, 'nonexistent')).toBeNull();

    const mockReq2 = {
      headers: {}
    } as any;
    expect(getCookie(mockReq2, 'csrf-token')).toBeNull();
  });

  it('should allow safe HTTP methods (GET, HEAD, OPTIONS) without CSRF token', () => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

    for (const method of safeMethods) {
      let nextCalled = false;
      const req = {
        method,
        path: '/api/profile',
        headers: {}
      } as any;
      const res = {
        status: () => res,
        json: () => res
      } as any;

      verifyCsrf(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    }
  });

  it('should block POST/PUT/DELETE requests when CSRF token is missing', () => {
    let statusCode = 0;
    let jsonBody: any = null;

    const req = {
      method: 'POST',
      path: '/api/profile',
      headers: {}
    } as any;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (body: any) => {
        jsonBody = body;
        return res;
      }
    } as any;

    let nextCalled = false;
    verifyCsrf(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(403);
    expect(jsonBody?.code).toBe('CSRF_VALIDATION_FAILED');
  });

  it('should block mutating requests when CSRF header and cookie mismatch', () => {
    let statusCode = 0;

    const req = {
      method: 'PUT',
      path: '/api/profile',
      headers: {
        'x-csrf-token': 'token-a',
        cookie: 'csrf-token=token-b'
      }
    } as any;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: () => res
    } as any;

    let nextCalled = false;
    verifyCsrf(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(403);
  });

  it('should allow mutating requests when CSRF header and cookie match', () => {
    const validToken = generateCsrfToken();
    const req = {
      method: 'POST',
      path: '/api/resume/upload',
      headers: {
        'x-csrf-token': validToken,
        cookie: `csrf-token=${validToken}; session=user-123.sig`
      }
    } as any;

    const res = {} as any;
    let nextCalled = false;

    verifyCsrf(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
  });

  it('should exempt public authentication routes from CSRF verification', () => {
    const exemptPaths = ['/api/auth/demo-login', '/api/auth/demo', '/api/auth/google'];

    for (const path of exemptPaths) {
      let nextCalled = false;
      const req = {
        method: 'POST',
        path,
        headers: {}
      } as any;
      const res = {} as any;

      verifyCsrf(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    }
  });
});
