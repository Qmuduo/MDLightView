import { expect, it } from 'vitest';
import { DraftWriter } from '../src/features/documents/draftWriter';

it('persists a revert made while an earlier draft write is in flight before leaving', async () => {
  let release!: () => void;
  let started!: () => void;
  const writing = new Promise<void>(resolve => { started = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  let stored = 'original';
  const writer = new DraftWriter(async (_id, source) => {
    if (source === 'changed') { started(); await gate; }
    stored = source;
  });
  writer.markLoaded('doc', 'original');
  let current = { id: 'doc', source: 'changed' };
  const autosave = writer.flush(() => current);
  await writing;
  current = { id: 'doc', source: 'original' };
  const leaving = writer.flush(() => current);
  release();
  await Promise.all([autosave, leaving]);
  expect(stored).toBe('original');
});
