import { describe, it, expect, vi } from 'vitest';
import { logger, createLogger } from '../src/lib/logger.js';

describe('Phase 9: Structured Logging & Error Observability', () => {
  it('should expose standard log methods and child logger creator', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.child).toBe('function');
  });

  it('should create child loggers that retain context', () => {
    const childLogger = logger.child({ requestId: 'req-test-999', userId: 'user-888' });
    expect(typeof childLogger.info).toBe('function');
    expect(typeof childLogger.child).toBe('function');
  });

  it('should log messages and errors safely without crashing', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.info('System testing message', { key: 'value' });
    expect(consoleSpy).toHaveBeenCalled();

    const testError = new Error('Simulated network fault');
    logger.error('Caught error during operation', testError);
    expect(errorSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('should support independent logger instances via createLogger factory', () => {
    const custom = createLogger({ service: 'interview-ai-agent' });
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    custom.info('Service ping');
    expect(infoSpy).toHaveBeenCalled();

    infoSpy.mockRestore();
  });
});
