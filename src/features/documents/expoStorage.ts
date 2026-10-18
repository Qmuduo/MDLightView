import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as LegacyFS from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { DocumentRepository, type StoragePort } from './repository';
import { exportName, MAX_BYTES, validateImport, validateLocalUri, validateUtf8Bytes } from './validation';

const documents = new Directory(Paths.document, 'documents');
const storage: StoragePort = {
  async readText(uri) { return new File(uri).text(); },
  async writeNew(text) {
    documents.create({ idempotent: true, intermediates: true });
    const file = new File(documents, `${Date.now()}-${Math.random().toString(36).slice(2)}.md`);
    file.create();
    await file.write(text);
    if (await file.text() !== text) throw new Error('草稿校验失败，请重试。');
    return file.uri;
  },
  getIndex: () => AsyncStorage.getItem('@mdlightview/documents/v1'),
  setIndex: value => AsyncStorage.setItem('@mdlightview/documents/v1', value),
};
export const repository = new DocumentRepository(storage);

export async function readExternalFile(uri: string, suggestedName?: string) {
  validateLocalUri(uri);
  const file = new File(uri);
  if ((file.size ?? 0) > MAX_BYTES) throw new Error('文件超过 2 MiB，请选择更小的文档。');
  let decoded = '';
  try { decoded = decodeURIComponent(uri.split('/').pop() ?? ''); } catch { /* Provider names may not be URL encoded. */ }
  const name = suggestedName || (/\.(md|markdown|txt)$/i.test(decoded) ? decoded : '打开的文档.md');
  validateUtf8Bytes(await file.bytes());
  const source = await file.text();
  validateImport(name, source);
  return { name, source };
}

export async function pickDocument() {
  // Providers sometimes label Markdown as application/octet-stream; validate after selection.
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > MAX_BYTES) throw new Error('文件超过 2 MiB，请选择更小的文档。');
  return readExternalFile(asset.uri, asset.name);
}

export async function exportCopy(name: string, source: string): Promise<string | null> {
  validateImport(name, source);
  if (Platform.OS !== 'android') throw new Error('另存副本目前仅支持 Android。');
  const permission = await LegacyFS.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) return null;
  const filename = exportName(name, `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const uri = await LegacyFS.StorageAccessFramework.createFileAsync(permission.directoryUri, filename, 'text/markdown');
  await LegacyFS.writeAsStringAsync(uri, source, { encoding: LegacyFS.EncodingType.UTF8 });
  if (await LegacyFS.readAsStringAsync(uri, { encoding: LegacyFS.EncodingType.UTF8 }) !== source) throw new Error('新文件校验失败，草稿仍保留。请换一个目录重试。');
  return filename;
}
