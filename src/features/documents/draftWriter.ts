export type DraftSnapshot = { id: string; source: string };
export class DraftWriter {
  constructor(private readonly persist: (id: string, source: string) => Promise<void>) {}
  private baseline: DraftSnapshot | null = null;
  private pending: Promise<unknown> = Promise.resolve();
  markLoaded(id: string, source: string) { this.baseline = { id, source }; }
  flush(readCurrent: () => DraftSnapshot | null): Promise<DraftSnapshot | null> {
    const task = this.pending.then(async () => {
      const snapshot = readCurrent();
      if (!snapshot || (snapshot.id === this.baseline?.id && snapshot.source === this.baseline.source)) return null;
      await this.persist(snapshot.id, snapshot.source);
      this.baseline = snapshot;
      return snapshot;
    });
    this.pending = task.catch(() => {});
    return task;
  }
}
