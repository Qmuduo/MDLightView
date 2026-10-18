import { describe, expect, it } from 'vitest';
import { applyEditorCommand } from '../src/features/reader/editorCommands';

describe('Markdown editor shortcuts', () => {
  it('wraps selected text and places a caret between inline markers', () => {
    expect(applyEditorCommand('write this', { start: 6, end: 10 }, 'bold')).toEqual({
      text: 'write **this**',
      selection: { start: 8, end: 12 },
    });
    expect(applyEditorCommand('note', { start: 2, end: 2 }, 'italic')).toEqual({
      text: 'no**te',
      selection: { start: 3, end: 3 },
    });
  });

  it('normalizes a reversed selection before formatting it', () => {
    expect(applyEditorCommand('word', { start: 4, end: 0 }, 'code')).toEqual({
      text: '`word`',
      selection: { start: 1, end: 5 },
    });
  });

  it('toggles a secondary heading on the current line and preserves line endings', () => {
    expect(applyEditorCommand('first\r\n## second\r\nthird', { start: 9, end: 9 }, 'heading')).toEqual({
      text: 'first\r\nsecond\r\nthird',
      selection: { start: 7, end: 7 },
    });
    expect(applyEditorCommand('first\r\nsecond', { start: 8, end: 8 }, 'heading').text).toBe('first\r\n## second');
  });

  it('applies bullet prefixes to each selected line and toggles them off', () => {
    const selected = { start: 4, end: 13 };
    const result = applyEditorCommand('one\ntwo\nthree', selected, 'bullet');
    expect(result.text).toBe('one\n- two\n- three');
    expect(applyEditorCommand(result.text, result.selection, 'bullet').text).toBe('one\ntwo\nthree');
  });

  it('numbers selected lines in order and toggles an all-numbered selection off', () => {
    const result = applyEditorCommand('- one\n7. two\nthree', { start: 0, end: 18 }, 'numbered');
    expect(result.text).toBe('1. one\n2. two\n3. three');
    expect(applyEditorCommand(result.text, result.selection, 'numbered').text).toBe('one\ntwo\nthree');
  });

  it('toggles quote prefixes over a CRLF selection', () => {
    const first = applyEditorCommand('one\r\ntwo\r\nthree', { start: 0, end: 8 }, 'quote');
    expect(first.text).toBe('> one\r\n> two\r\nthree');
    expect(applyEditorCommand(first.text, first.selection, 'quote').text).toBe('one\r\ntwo\r\nthree');
  });

  it('uses inline code for one line and a fenced block for multiple lines', () => {
    expect(applyEditorCommand('say hello now', { start: 4, end: 9 }, 'code')).toEqual({
      text: 'say `hello` now',
      selection: { start: 5, end: 10 },
    });
    expect(applyEditorCommand('before\r\nafter', { start: 0, end: 13 }, 'code')).toEqual({
      text: '```\r\nbefore\r\nafter\r\n```',
      selection: { start: 5, end: 18 },
    });
  });

  it('inserts an empty fenced block at the caret using the document line ending', () => {
    expect(applyEditorCommand('abc', { start: 1, end: 1 }, 'code')).toEqual({
      text: 'a\n```\n\n```\nbc',
      selection: { start: 6, end: 6 },
    });
  });

  it('places the caret in a selected link URL or selects the placeholder label', () => {
    expect(applyEditorCommand('read this', { start: 5, end: 9 }, 'link')).toEqual({
      text: 'read [this](https://)',
      selection: { start: 20, end: 20 },
    });
    expect(applyEditorCommand('', { start: 0, end: 0 }, 'link')).toEqual({
      text: '[链接文字](https://)',
      selection: { start: 1, end: 5 },
    });
  });
});
