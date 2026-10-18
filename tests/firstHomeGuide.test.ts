import { describe, expect, it } from 'vitest';
import { FirstHomeGuide, shouldPrepareHomeAfterInitialRoute } from '../src/features/onboarding/firstHomeGuide';

function memoryStore(initiallySeen = false) {
  let seen = initiallySeen;
  let writes = 0;
  return {
    storage: {
      async readSeen() { return seen; },
      async markSeen() { seen = true; writes += 1; },
    },
    isSeen: () => seen,
    writeCount: () => writes,
  };
}

describe('first-home sample guide', () => {
  it('defers the first home entry when an initial external file opened successfully', () => {
    expect(shouldPrepareHomeAfterInitialRoute({ wasInitialRoute: true, hasActiveDocument: true, pendingIncomingCount: 0 })).toBe(false);
  });

  it('enters home after an initial route fails or has no remaining file', () => {
    expect(shouldPrepareHomeAfterInitialRoute({ wasInitialRoute: true, hasActiveDocument: false, pendingIncomingCount: 0 })).toBe(true);
  });

  it('waits for all initial file intents before preparing home', () => {
    expect(shouldPrepareHomeAfterInitialRoute({ wasInitialRoute: true, hasActiveDocument: false, pendingIncomingCount: 1 })).toBe(false);
  });

  it('does not treat a later share event as initial startup routing', () => {
    expect(shouldPrepareHomeAfterInitialRoute({ wasInitialRoute: false, hasActiveDocument: false, pendingIncomingCount: 0 })).toBe(false);
  });

  it('shows on the first empty-library visit and persists immediately', async () => {
    const store = memoryStore();
    const guide = new FirstHomeGuide(store.storage);

    await guide.hydrate(0);

    await expect(guide.enterHome()).resolves.toBe(true);
    expect(store.isSeen()).toBe(true);
    expect(store.writeCount()).toBe(1);
  });

  it('stays hidden after a cold restart even when the library is empty', async () => {
    const store = memoryStore();
    const firstRun = new FirstHomeGuide(store.storage);
    await firstRun.hydrate(0);
    await firstRun.enterHome();

    const nextRun = new FirstHomeGuide(store.storage);
    await nextRun.hydrate(0);

    await expect(nextRun.enterHome()).resolves.toBe(false);
  });

  it('keeps the entry visible when returning home during the same app session', async () => {
    const store = memoryStore();
    const guide = new FirstHomeGuide(store.storage);
    await guide.hydrate(0);
    await guide.enterHome();

    await expect(guide.enterHome()).resolves.toBe(true);
    expect(store.writeCount()).toBe(1);
  });

  it('treats records from an older installation as an existing user', async () => {
    const store = memoryStore();
    const guide = new FirstHomeGuide(store.storage);

    await guide.hydrate(2);

    await expect(guide.enterHome()).resolves.toBe(false);
    expect(store.isSeen()).toBe(true);
  });

  it('preserves eligibility when a fresh installation opens a shared file before home', async () => {
    const store = memoryStore();
    const guide = new FirstHomeGuide(store.storage);
    await guide.hydrate(0);
    // The file imported by the initial share must not change the startup record count.
    await expect(guide.enterHome()).resolves.toBe(true);
  });

  it('does not resolve a home decision before asynchronous state hydration finishes', async () => {
    let releaseRead!: (value: boolean) => void;
    const delayedRead = new Promise<boolean>(resolve => { releaseRead = resolve; });
    const store = memoryStore();
    const guide = new FirstHomeGuide({
      readSeen: () => delayedRead,
      markSeen: store.storage.markSeen,
    });
    const hydration = guide.hydrate(0);
    let decided = false;
    const decision = guide.enterHome().then(value => {
      decided = true;
      return value;
    });

    await Promise.resolve();
    expect(decided).toBe(false);

    releaseRead(false);
    await hydration;
    await expect(decision).resolves.toBe(true);
  });
});
