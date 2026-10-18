export interface StoragePort {
  readText(uri: string): Promise<string>;
  writeNew(text: string): Promise<string>;
  getIndex(): Promise<string | null>;
  setIndex(value: string): Promise<void>;
}
export type DocumentRecord = { id: string; name: string; contentUri: string; draftUri?: string; progress: number; updatedAt: number };
export class DocumentRepository {
  private pending: Promise<unknown> = Promise.resolve();
  constructor(private readonly storage: StoragePort) {}

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const task = this.pending.then(operation);
    this.pending = task.catch(() => {});
    return task;
  }
  async list(): Promise<DocumentRecord[]> {
    const raw = await this.storage.getIndex();
    if (!raw) return [];
    const values: unknown = JSON.parse(raw);
    if (!Array.isArray(values) || values.some(value => !value || typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.contentUri !== 'string' || typeof value.progress !== 'number' || !Number.isFinite(value.progress) || typeof value.updatedAt !== 'number' || (value.draftUri !== undefined && typeof value.draftUri !== 'string'))) {
      throw new Error('阅读记录无法识别，未改写现有数据。');
    }
    return [...values].sort((a, b) => b.updatedAt - a.updatedAt);
  }
  async importDocument(name: string, source: string): Promise<DocumentRecord> {
    validateImport(name, source);
    return this.enqueue(async () => {
      const records = await this.list();
      const contentUri = await this.storage.writeNew(source);
      const record: DocumentRecord = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name, contentUri, progress: 0, updatedAt: Date.now() };
      await this.storage.setIndex(JSON.stringify([record, ...records]));
      return record;
    });
  }
  async open(id: string): Promise<{ record: DocumentRecord; source: string }> {
    const record = (await this.list()).find(value => value.id === id);
    if (!record) throw new Error('找不到这份文档，请重新打开文件。');
    return { record, source: await this.storage.readText(record.draftUri ?? record.contentUri) };
  }
  async saveDraft(id: string, source: string): Promise<void> {
    return this.enqueue(async () => {
      const records = await this.list();
      const index = records.findIndex(value => value.id === id);
      if (index < 0) throw new Error('找不到这份文档。');
      validateImport(records[index].name, source);
      const draftUri = await this.storage.writeNew(source);
      records[index] = { ...records[index], draftUri, updatedAt: Date.now() };
      await this.storage.setIndex(JSON.stringify(records));
    });
  }
  async saveProgress(id: string, progress: number): Promise<void> {
    if (!Number.isFinite(progress)) return;
    return this.enqueue(async () => {
      const records = await this.list();
      const index = records.findIndex(value => value.id === id);
      if (index < 0) return;
      records[index] = { ...records[index], progress: Math.max(0, Math.min(1, progress)) };
      await this.storage.setIndex(JSON.stringify(records));
    });
  }
}
import { validateImport } from './validation';

