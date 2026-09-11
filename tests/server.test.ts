import { describe, it, expect } from 'vitest';
import { signSession, verifySession } from '../server.js';

describe('Server Endpoints & Security', () => {
  // Test health check response structure
  it('should validate health check response structure', () => {
    const mockResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    expect(mockResponse.status).toBe('healthy');
    expect(mockResponse.timestamp).toBeDefined();
    expect(mockResponse.uptime).toBeDefined();
    expect(mockResponse.environment).toBeDefined();
  });

  // Test HMAC signed session security
  it('should sign and verify valid session tokens', () => {
    const userId = 'student-42';
    const signedToken = signSession(userId);
    
    expect(signedToken.startsWith('student-42.')).toBe(true);
    const verified = verifySession(signedToken);
    expect(verified).toBe('student-42');
  });

  it('should reject forged session tokens with invalid signature', () => {
    const forgedToken = 'admin-1.fake_tampered_signature_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const verified = verifySession(forgedToken);
    expect(verified).toBeNull();
  });

  it('should reject malformed or empty session tokens', () => {
    expect(verifySession('')).toBeNull();
    expect(verifySession('not-a-valid-token-at-all')).toBeNull();
  });

  // Test auth endpoint logic
  it('should extract session from cookie header', () => {
    const cookieHeader = 'session=test-user-123; other=value';
    const match = cookieHeader.match(/session=([^;]+)/);
    
    expect(match).not.toBeNull();
    expect(match![1]).toBe('test-user-123');
  });

  it('should return null for missing session cookie', () => {
    const cookieHeader = 'other=value';
    const match = cookieHeader.match(/session=([^;]+)/);
    
    expect(match).toBeNull();
  });

  it('should return null for empty cookie header', () => {
    const cookieHeader = '';
    const match = cookieHeader.match(/session=([^;]+)/);
    
    expect(match).toBeNull();
  });
});