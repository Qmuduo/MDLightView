export type EditorCommand = 'bold' | 'italic' | 'heading' | 'bullet' | 'numbered' | 'quote' | 'code' | 'link';
export type TextSelection = { start: number; end: number };
export type EditorEdit = { text: string; selection: TextSelection };

type LineSpan = { start: number; contentEnd: number; end: number };
type TextEdit = { start: number; end: number; replacement: string };

const isLineBreak = (character: string | undefined) => character === '\n' || character === '\r';

function normalizeSelection(text: string, selection: TextSelection): TextSelection {
  const clamp = (value: number) => Math.max(0, Math.min(text.length, Math.trunc(value)));
  const start = clamp(selection.start);
  const end = clamp(selection.end);
  return start <= end ? { start, end } : { start: end, end: start };
}

function replaceRange(text: string, start: number, end: number, replacement: string, selection: TextSelection): EditorEdit {
  return {
    text: `${text.slice(0, start)}${replacement}${text.slice(end)}`,
    selection,
  };
}

function wrapInline(text: string, selection: TextSelection, marker: string): EditorEdit {
  const { start, end } = selection;
  if (start === end) {
    return replaceRange(text, start, end, marker + marker, { start: start + marker.length, end: start + marker.length });
  }

  const selected = text.slice(start, end);
  return replaceRange(text, start, end, marker + selected + marker, {
    start: start + marker.length,
    end: start + marker.length + selected.length,
  });
}

function getLineSpans(text: string): LineSpan[] {
  const lines: LineSpan[] = [];
  let start = 0;
  while (true) {
    let breakStart = text.length;
    let breakLength = 0;
    for (let index = start; index < text.length; index += 1) {
      if (!isLineBreak(text[index])) continue;
      breakStart = index;
      breakLength = text[index] === '\r' && text[index + 1] === '\n' ? 2 : 1;
      break;
    }

    const end = breakStart + breakLength;
    lines.push({ start, contentEnd: breakStart, end });
    if (breakLength === 0) break;
    start = end;
    if (start === text.length) {
      lines.push({ start, contentEnd: start, end: start });
      break;
    }
  }
  return lines;
}

function lineAtPosition(lines: LineSpan[], position: number): number {
  if (position >= lines[lines.length - 1].end) return lines.length - 1;
  const index = lines.findIndex(line => position >= line.start && position < line.end);
  return Math.max(0, index);
}

function touchedLines(text: string, selection: TextSelection, lines: LineSpan[]): number[] {
  const first = lineAtPosition(lines, selection.start);
  let endPosition = selection.end;
  if (endPosition > selection.start && isLineBreak(text[endPosition - 1])) endPosition -= 1;
  const last = selection.start === selection.end ? first : lineAtPosition(lines, endPosition);
  return Array.from({ length: Math.max(1, last - first + 1) }, (_, offset) => first + offset);
}

function applyEdits(text: string, selection: TextSelection, edits: TextEdit[]): EditorEdit {
  const ordered = [...edits].sort((left, right) => left.start - right.start);
  let result = text;
  for (const edit of [...ordered].reverse()) {
    result = `${result.slice(0, edit.start)}${edit.replacement}${result.slice(edit.end)}`;
  }

  const mapPosition = (position: number) => {
    let offset = 0;
    for (const edit of ordered) {
      if (position < edit.start) break;
      if (position <= edit.end) return edit.start + offset + edit.replacement.length;
      offset += edit.replacement.length - (edit.end - edit.start);
    }
    return position + offset;
  };

  return {
    text: result,
    selection: { start: mapPosition(selection.start), end: mapPosition(selection.end) },
  };
}

function lineEndingFor(text: string): string {
  const crlf = text.indexOf('\r\n');
  if (crlf >= 0) return '\r\n';
  if (text.includes('\n')) return '\n';
  if (text.includes('\r')) return '\r';
  return '\n';
}

const listPrefix = /^(?:[-*+][\t ]+|\d+\.[\t ]+)/;
const numberedPrefix = /^\d+\.[\t ]+/;
const headingPrefix = /^#{1,6}[\t ]+/;

function lineCommand(text: string, selection: TextSelection, command: 'heading' | 'bullet' | 'numbered' | 'quote'): EditorEdit {
  const lines = getLineSpans(text);
  const indices = touchedLines(text, selection, lines);
  const selectedLines = indices.map(index => lines[index]);
  const edits: TextEdit[] = [];

  if (command === 'numbered') {
    const allNumbered = selectedLines.every(line => numberedPrefix.test(text.slice(line.start, line.contentEnd)));
    selectedLines.forEach((line, index) => {
      const content = text.slice(line.start, line.contentEnd);
      const prefix = allNumbered ? numberedPrefix : listPrefix;
      const existing = content.match(prefix)?.[0] ?? '';
      const replacement = allNumbered ? '' : `${index + 1}. `;
      if (existing !== replacement) edits.push({ start: line.start, end: line.start + existing.length, replacement });
    });
  } else if (command === 'heading') {
    const line = lines[indices[0]];
    const content = text.slice(line.start, line.contentEnd);
    const existing = content.match(headingPrefix)?.[0] ?? '';
    const level = existing.match(/^(#+)/)?.[1].length ?? 0;
    const replacement = level === 2 ? '' : '## ';
    if (existing !== replacement) edits.push({ start: line.start, end: line.start + existing.length, replacement });
  } else {
    const prefix = command === 'bullet' ? '- ' : '> ';
    selectedLines.forEach(line => {
      const content = text.slice(line.start, line.contentEnd);
      if (command === 'quote') {
        const existing = content.startsWith(prefix) ? prefix : '';
        if (existing !== prefix) edits.push({ start: line.start, end: line.start + existing.length, replacement: prefix });
        else edits.push({ start: line.start, end: line.start + existing.length, replacement: '' });
        return;
      }

      const existing = content.match(listPrefix)?.[0] ?? '';
      const replacement = existing === prefix ? '' : prefix;
      if (existing !== replacement) edits.push({ start: line.start, end: line.start + existing.length, replacement });
    });
  }

  return applyEdits(text, selection, edits);
}

function applyCode(text: string, selection: TextSelection): EditorEdit {
  const { start, end } = selection;
  const lineEnding = lineEndingFor(text);

  if (start === end) {
    const lines = getLineSpans(text);
    const line = lines[lineAtPosition(lines, start)];
    const needsLeadingLineBreak = start > line.start;
    const needsTrailingLineBreak = start < line.contentEnd;
    const leading = needsLeadingLineBreak ? lineEnding : '';
    const opening = `\`\`\`${lineEnding}`;
    const closing = `\`\`\``;
    const trailing = needsTrailingLineBreak ? lineEnding : '';
    const inserted = `${leading}${opening}${lineEnding}${closing}${trailing}`;
    const cursor = start + leading.length + opening.length;
    return replaceRange(text, start, end, inserted, { start: cursor, end: cursor });
  }

  const selected = text.slice(start, end);
  if (!/[\r\n]/.test(selected)) return wrapInline(text, selection, '`');

  const lines = getLineSpans(text);
  const firstLine = lines[lineAtPosition(lines, start)];
  const leading = start > firstLine.start ? lineEnding : '';
  const opening = `\`\`\`${lineEnding}`;
  const trailing = /[\r\n]$/.test(selected) ? '' : lineEnding;
  const suffix = end < text.length && !isLineBreak(text[end]) ? lineEnding : '';
  const replacement = `${leading}${opening}${selected}${trailing}\`\`\`${suffix}`;
  const contentStart = start + leading.length + opening.length;
  return replaceRange(text, start, end, replacement, {
    start: contentStart,
    end: contentStart + selected.length,
  });
}

function applyLink(text: string, selection: TextSelection): EditorEdit {
  const { start, end } = selection;
  if (start === end) {
    const label = '链接文字';
    const inserted = `[${label}](https://)`;
    return replaceRange(text, start, end, inserted, {
      start: start + 1,
      end: start + 1 + label.length,
    });
  }

  const selected = text.slice(start, end);
  const inserted = `[${selected}](https://)`;
  const cursor = start + selected.length + 11;
  return replaceRange(text, start, end, inserted, { start: cursor, end: cursor });
}

export function applyEditorCommand(text: string, currentSelection: TextSelection, command: EditorCommand): EditorEdit {
  const selection = normalizeSelection(text, currentSelection);
  switch (command) {
    case 'bold': return wrapInline(text, selection, '**');
    case 'italic': return wrapInline(text, selection, '*');
    case 'heading':
    case 'bullet':
    case 'numbered':
    case 'quote': return lineCommand(text, selection, command);
    case 'code': return applyCode(text, selection);
    case 'link': return applyLink(text, selection);
  }
}
