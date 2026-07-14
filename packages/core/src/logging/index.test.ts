import { describe, it, expect, vi } from 'vitest';
import { Logger, LogLevel } from './index';

describe('Logger', () => {
  it('should create logger with context', () => {
    const logger = new Logger('Test');
    expect(logger).toBeDefined();
  });

  it('should respect log levels', () => {
    const logger = new Logger('Test');
    logger.setLevel(LogLevel.ERROR);

    const debugSpy = vi.spyOn(console, 'debug');
    const infoSpy = vi.spyOn(console, 'info');
    const warnSpy = vi.spyOn(console, 'warn');
    const errorSpy = vi.spyOn(console, 'error');

    logger.debug('debug msg');
    logger.info('info msg');
    logger.warn('warn msg');
    logger.error('error msg');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('should create child loggers', () => {
    const parent = new Logger('Parent');
    const child = parent.child('Child');
    expect(child).toBeInstanceOf(Logger);
  });

  it('should format messages with context', () => {
    const logger = new Logger('Test');
    const spy = vi.spyOn(console, 'info');
    logger.info('hello');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] [Test] hello'),
    );
    vi.restoreAllMocks();
  });

  it('should include arguments in log output', () => {
    const logger = new Logger('Test');
    const spy = vi.spyOn(console, 'warn');
    logger.warn('issue', { id: 1 });
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('{"id":1}'),
    );
    vi.restoreAllMocks();
  });
});
