import { describe, expect, it } from 'vitest';
import { validateImport, validateLocalUri, exportName, validateUtf8Bytes } from '../src/features/documents/validation';
import { DocumentRepository, type StoragePort } from '../src/features/documents/repository';

class MemoryStorage implements StoragePort {
  files = new Map<string, string>();
  index = '[]';
  failWrite = false;
  failIndex = false;
  async readText(uri: string) { if (!this.files.has(uri)) throw new Error('missing'); return this.files.get(uri)!; }
  async writeNew(text: string) { if (this.failWrite) throw new Error('disk full'); const uri = `file:${this.files.size}`; this.files.set(uri, text); return uri; }
  async getIndex() { return this.index; }
  async setIndex(value: string) { if (this.failIndex) throw new Error('index failed'); this.index = value; }
}

describe('document boundaries', () => {
  it('accepts Markdown case insensitively but rejects binary, unsupported and oversized content', () => {
    expect(() => validateImport('说明.MD', '# 中文')).not.toThrow();
    expect(() => validateImport('bad.pdf', 'text')).toThrow();
    expect(() => validateImport('bad.md', 'a\0b')).toThrow();
    expect(() => validateImport('large.md', '中'.repeat(700000))).toThrow();
  });
  it('accepts local provider URIs only', () => {
    expect(() => validateLocalUri('content://provider/1')).not.toThrow();
    expect(() => validateLocalUri('file:///tmp/a.md')).not.toThrow();
    expect(() => validateLocalUri('https://example.com/a.md')).toThrow();
    expect(() => validateLocalUri('javascript:alert(1)')).toThrow();
  });
  it('exports a safe new Markdown filename', () => {
    expect(exportName('../a:b.MD', '20261017-123')).toBe('a_b-20261017-123.md');
  });
  it('accepts valid UTF-8 including a replacement character but rejects malformed byte sequences', () => {
    expect(() => validateImport('a.md', '\uFFFD')).not.toThrow();
    expect(() => validateUtf8Bytes(new Uint8Array([0xef, 0xbb, 0xbf, 0xe4, 0xb8, 0xad]))).not.toThrow();
    for (const bytes of [[0xc0, 0x80], [0xe4, 0xb8], [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80], [0x80]]) {
      expect(() => validateUtf8Bytes(new Uint8Array(bytes))).toThrow();
    }
  });
});

describe('recoverable document storage', () => {
  it('restores drafts and clamps reading progress after restart', async () => {
    const store = new MemoryStorage(); const repo = new DocumentRepository(store);
    const doc = await repo.importDocument('a.md', '# original');
    await repo.saveDraft(doc.id, '# draft');
    await repo.saveProgress(doc.id, 9);
    const restarted = new DocumentRepository(store);
    expect((await restarted.open(doc.id)).source).toBe('# draft');
    expect((await restarted.list())[0].progress).toBe(1);
    expect(await store.readText(doc.contentUri)).toBe('# original');
  });
  it('does not switch the index when a draft write fails', async () => {
    const store = new MemoryStorage(); const repo = new DocumentRepository(store);
    const doc = await repo.importDocument('a.md', 'original');
    store.failWrite = true;
    await expect(repo.saveDraft(doc.id, 'lost?')).rejects.toThrow('disk full');
    expect((await repo.open(doc.id)).source).toBe('original');
  });
  it('retains the last readable revision when index commit fails and recovers its queue', async () => {
    const store = new MemoryStorage(); const repo = new DocumentRepository(store);
    const doc = await repo.importDocument('a.md', 'original');
    store.failIndex = true;
    await expect(repo.saveDraft(doc.id, 'uncommitted')).rejects.toThrow('index failed');
    expect((await repo.open(doc.id)).source).toBe('original');
    store.failIndex = false;
    await repo.saveDraft(doc.id, 'recovered');
    expect((await repo.open(doc.id)).source).toBe('recovered');
  });
  it('serializes concurrent draft and position changes without losing either', async () => {
    const repo = new DocumentRepository(new MemoryStorage());
    const doc = await repo.importDocument('a.md', 'original');
    await Promise.all([repo.saveDraft(doc.id, 'draft'), repo.saveProgress(doc.id, 0.4)]);
    expect((await repo.open(doc.id)).source).toBe('draft');
    expect((await repo.list())[0].progress).toBe(0.4);
  });
});
