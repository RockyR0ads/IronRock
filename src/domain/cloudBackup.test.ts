import { afterEach, describe, expect, it } from 'vitest';
import {
  autoBackupDue,
  getCloudConfig,
  isAutoBackupOn,
  setAutoBackup,
  setCloudConfig,
  clearCloudConfig,
  AUTO_BACKUP_DAYS,
} from './cloudBackup';

const CLOUD_KEY = 'ironrock-cloud-v1';
const LAST_BACKUP_KEY = 'ironrock-last-backup';

afterEach(() => {
  localStorage.clear();
});

function connect(auto = true) {
  setCloudConfig({ url: 'https://x.test/api/ironrock/backup', secret: 'abc', auto });
}
function setLastBackup(daysAgo: number) {
  localStorage.setItem(
    LAST_BACKUP_KEY,
    JSON.stringify({ at: Date.now() - daysAgo * 86_400_000, sessions: 1 })
  );
}

describe('cloud config + auto-backup', () => {
  it('defaults auto on when connecting, and persists the flag', () => {
    connect();
    expect(getCloudConfig()?.auto).toBe(true);
    expect(isAutoBackupOn()).toBe(true);
    expect(JSON.parse(localStorage.getItem(CLOUD_KEY)!).auto).toBe(true);
  });

  it('toggles auto without touching url/secret', () => {
    connect();
    setAutoBackup(false);
    const c = getCloudConfig()!;
    expect(c.auto).toBe(false);
    expect(c.url).toContain('x.test');
    expect(c.secret).toBe('abc');
    expect(isAutoBackupOn()).toBe(false);
  });

  it('is not due when cloud is not configured', () => {
    expect(autoBackupDue(10)).toBe(false);
  });

  it('is due when configured, auto on, and never backed up', () => {
    connect();
    expect(autoBackupDue(10)).toBe(true);
  });

  it('is not due within the interval, due after it', () => {
    connect();
    setLastBackup(AUTO_BACKUP_DAYS - 1);
    expect(autoBackupDue(10)).toBe(false);
    setLastBackup(AUTO_BACKUP_DAYS + 1);
    expect(autoBackupDue(10)).toBe(true);
  });

  it('is never due with auto off or no sessions', () => {
    connect(false);
    expect(autoBackupDue(10)).toBe(false);
    connect(true);
    expect(autoBackupDue(0)).toBe(false);
  });

  it('clearing config turns everything off', () => {
    connect();
    clearCloudConfig();
    expect(getCloudConfig()).toBeNull();
    expect(isAutoBackupOn()).toBe(false);
    expect(autoBackupDue(10)).toBe(false);
  });
});
