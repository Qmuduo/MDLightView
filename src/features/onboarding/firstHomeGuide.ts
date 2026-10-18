export type FirstHomeGuideStorage = {
  readSeen: () => Promise<boolean>;
  markSeen: () => Promise<void>;
};

export function shouldPrepareHomeAfterInitialRoute(input: {
  wasInitialRoute: boolean;
  hasActiveDocument: boolean;
  pendingIncomingCount: number;
}) {
  return input.wasInitialRoute && !input.hasActiveDocument && input.pendingIncomingCount === 0;
}

export class FirstHomeGuide {
  private hydration: Promise<void> | null = null;
  private persistedSeen = false;
  private eligibleThisInstall = false;
  private shownThisSession = false;
  private homeDecision: Promise<boolean> | null = null;

  constructor(private readonly storage: FirstHomeGuideStorage) {}

  hydrate(existingRecordCount: number): Promise<void> {
    if (this.hydration) return this.hydration;
    this.hydration = (async () => {
      this.persistedSeen = await this.storage.readSeen();
      if (!this.persistedSeen && existingRecordCount > 0) {
        await this.storage.markSeen();
        this.persistedSeen = true;
      }
      this.eligibleThisInstall = !this.persistedSeen && existingRecordCount === 0;
    })();
    return this.hydration;
  }

  enterHome(): Promise<boolean> {
    if (this.shownThisSession) return Promise.resolve(true);
    if (this.homeDecision) return this.homeDecision;
    if (!this.hydration) return Promise.reject(new Error('首页状态尚未读取。'));

    this.homeDecision = (async () => {
      await this.hydration;
      if (this.persistedSeen || !this.eligibleThisInstall) return false;
      await this.storage.markSeen();
      this.persistedSeen = true;
      this.shownThisSession = true;
      return true;
    })().finally(() => {
      this.homeDecision = null;
    });
    return this.homeDecision;
  }
}
