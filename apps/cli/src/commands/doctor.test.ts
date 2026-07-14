import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';

describe('Doctor Command', () => {
  it('should have Node.js version >= 18', () => {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    expect(major).toBeGreaterThanOrEqual(18);
  });
});
