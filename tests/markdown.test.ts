import { describe, expect, it } from 'vitest';
import { renderMarkdown, buildReaderPage } from '../src/features/reader/markdown';

describe('offline Markdown reader', () => {
  it('uses one heading sequence for duplicate titles and excludes fenced code', () => {
    const result = renderMarkdown('# 中文\n\n## 重复\n\n## 重复\n\n```md\n# not a title\n```\n\nSetext\n---');
    expect(result.headings).toEqual([
      { id: 'heading-0', level: 1, title: '中文' },
      { id: 'heading-1', level: 2, title: '重复' },
      { id: 'heading-2', level: 2, title: '重复' },
      { id: 'heading-3', level: 2, title: 'Setext' },
    ]);
    expect(result.html).toContain('<h2 id="heading-2">重复</h2>');
  });
  it('renders tables and code while escaping executable HTML and disabling image fetches', () => {
    const result = renderMarkdown('<script>alert(1)</script>\n\n![private](https://tracker.test/x)\n\n[a](javascript:alert(1))\n\n|A|B|\n|-|-|\n|1|2|\n\n```ts\nconst a = 1;\n```');
    expect(result.html).not.toContain('<script>');
    expect(result.html).not.toContain('<img');
    expect(result.html).not.toContain('href="javascript:');
    expect(result.html).toContain('<table>');
    expect(result.html).toContain('const a = 1;');
  });
  it('keeps malicious closing tags out of the app script context', () => {
    const page = buildReaderPage('</script><script>attack()</script>', 'light', 0.5);
    expect(page).not.toContain('<script>attack()');
    expect(page).toContain("default-src 'none'");
    expect(page).toContain('heading-');
    expect(page).toContain('0.5');
  });
});
