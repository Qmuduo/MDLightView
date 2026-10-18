export const MAX_BYTES = 2 * 1024 * 1024;
export function validateUtf8Bytes(bytes: Uint8Array): void {
  if (bytes.length > MAX_BYTES) throw new Error('文件超过 2 MiB，请选择更小的文档。');
  const invalid = () => { throw new Error('文件不是有效的 UTF-8 文本，请转换编码后再打开。'); };
  for (let index = 0; index < bytes.length; index++) {
    const lead = bytes[index];
    if (lead <= 0x7f) continue;
    const count = lead >= 0xc2 && lead <= 0xdf ? 1 : lead >= 0xe0 && lead <= 0xef ? 2 : lead >= 0xf0 && lead <= 0xf4 ? 3 : 0;
    if (!count || index + count >= bytes.length) invalid();
    const second = bytes[index + 1];
    if ((lead === 0xe0 && second < 0xa0) || (lead === 0xed && second > 0x9f) || (lead === 0xf0 && second < 0x90) || (lead === 0xf4 && second > 0x8f)) invalid();
    for (let offset = 1; offset <= count; offset++) if (bytes[index + offset] < 0x80 || bytes[index + offset] > 0xbf) invalid();
    index += count;
  }
}

export function validateImport(name: string, source: string): void {
  if (!/\.(md|markdown|txt)$/i.test(name)) throw new Error('请选择 .md、.markdown 或 .txt 文件。');
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(source)) throw new Error('文件包含二进制内容，请选择文本文件。');
  let bytes = 0;
  for (const character of source) {
    const point = character.codePointAt(0)!;
    if (point >= 0xd800 && point <= 0xdfff) throw new Error('文字编码不完整，请检查内容。');
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
    if (bytes > MAX_BYTES) throw new Error('文件超过 2 MiB，请选择更小的文档。');
  }
}

export function normalizeNewDocumentName(value: string): string {
  const name = value.trim();
  if (!name) throw new Error('请输入文件名。');
  if (/[\\/:*?"<>|\u0000-\u001f]/.test(name)) throw new Error('文件名不能包含路径或特殊字符。');

  const extension = name.match(/\.(md|markdown)$/i)?.[0];
  const base = extension ? name.slice(0, -extension.length) : name;
  if (!base || /^\.+$/.test(base)) throw new Error('请输入有效的文件名。');
  if (!extension && /\.[^.]+$/.test(name)) throw new Error('新建文件请使用 .md 或 .markdown 扩展名。');
  return extension ? name : `${name}.md`;
}

export function validateLocalUri(uri: string): void {
  if (!/^(content|file):\/\/.+/i.test(uri)) throw new Error('只支持本地文件，不会下载远程文档。');
}

export function exportName(name: string, suffix: string): string {
  const basename = (name.split(/[\\/]/).pop() ?? '文档').replace(/\.(md|markdown|txt)$/i, '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/^[.\s]+|[.\s]+$/g, '').slice(0, 80) || '文档';
  return `${basename}-${suffix.replace(/[^a-zA-Z0-9-]/g, '')}.md`;
}
