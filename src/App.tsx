import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, BackHandler, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, View, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Action } from './components/Action';
import { Library } from './features/library/Library';
import { SAMPLE, SAMPLE_NAME } from './features/library/sample';
import { Reader } from './features/reader/Reader';
import { exportCopy, pickDocument, readExternalFile, repository } from './features/documents/expoStorage';
import type { DocumentRecord } from './features/documents/repository';
import { DraftWriter } from './features/documents/draftWriter';
import { palettes, type ThemePreference } from './theme/colors';

type ActiveDocument = { record: DocumentRecord; source: string };
const THEME_KEY = '@mdlightview/theme/v1';

function Main() {
  const system = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const theme = preference === 'system' ? system === 'dark' ? 'dark' : 'light' : preference;
  const colors = palettes[theme];
  const [records, setRecords] = useState<DocumentRecord[]>([]);
  const [active, setActive] = useState<ActiveDocument | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState('');
  const current = useRef(active);
  const draftWriter = useRef(new DraftWriter((id, source) => repository.saveDraft(id, source)));
  const locked = useRef(false);
  const mounted = useRef(true);
  const [incoming, setIncoming] = useState<string[]>([]);
  const report = useCallback((error: unknown) => {
    if (mounted.current) Alert.alert('操作未完成', error instanceof Error ? error.message : '请重试，当前内容仍保留。');
  }, []);
  const refresh = async () => { const values = await repository.list(); if (mounted.current) setRecords(values); };
  const flushDraft = useCallback(async () => {
    const document = await draftWriter.current.flush(() => current.current ? { id: current.current.record.id, source: current.current.source } : null);
    if (!document) return;
    const record = (await repository.list()).find(value => value.id === document.id)!;
    if (current.current?.record.id === document.id) {
      const next = { ...current.current, record };
      current.current = next;
      if (mounted.current) { setActive(next); setNotice(current.current.source === document.source ? '草稿已保留在本机' : '正在保留草稿…'); }
    }
  }, []);
  const run = useCallback(async (operation: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setNotice('');
    try { await operation(); } catch (error) { report(error); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }, [report]);
  const activate = async (document: ActiveDocument) => {
    current.current = document; draftWriter.current.markLoaded(document.record.id, document.source);
    setActive(document); setEditing(false); setNotice(document.record.draftUri ? '已恢复编辑草稿' : '');
    await refresh();
  };
  const importAndOpen = async (name: string, source: string) => {
    await flushDraft();
    const record = await repository.importDocument(name, source);
    await activate({ record, source });
  };
  const goBack = () => { void run(async () => {
    await flushDraft();
    if (editing) { setEditing(false); return; }
    await refresh(); current.current = null; setActive(null);
  }); };

  useEffect(() => {
    mounted.current = true;
    void Promise.all([refresh(), AsyncStorage.getItem(THEME_KEY).then(value => {
      if (value === 'light' || value === 'dark' || value === 'system') setPreference(value);
    })]).catch(report).finally(() => setBusy(false));
    return () => { mounted.current = false; };
  }, [report]);
  useEffect(() => {
    if (!editing) return;
    const timer = setTimeout(() => { void flushDraft().catch(report); }, 650);
    return () => clearTimeout(timer);
  }, [active?.source, editing, flushDraft, report]);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (busy) return true;
      if (current.current) { goBack(); return true; }
      return false;
    });
    return () => listener.remove();
  });
  useEffect(() => {
    const receive = (url?: string | null) => setIncoming(values => [...values, url ?? 'share']);
    void Linking.getInitialURL().then(receive).catch(report);
    const link = Linking.addEventListener('url', ({ url }) => receive(url));
    const app = AppState.addEventListener('change', state => {
      if (state === 'active') receive();
      else void flushDraft().catch(report);
    });
    return () => { link.remove(); app.remove(); };
  }, [flushDraft, report]);
  useEffect(() => {
    if (busy || incoming.length === 0) return;
    const url = incoming[0]; setIncoming(values => values.slice(1));
    // Read raw payloads: URL metadata resolution could otherwise access the network.
    const shares = Sharing.getSharedPayloads();
    if (shares.length > 0) {
      Sharing.clearSharedPayloads();
      void run(async () => {
        if (shares.length !== 1 || !shares[0].value) throw new Error('请选择一份文档或分享一段文字。');
        const payload = shares[0]; const value = payload.value!;
        if (payload.shareType === 'file' || /^(content|file):\/\//i.test(value)) {
          const file = await readExternalFile(value); await importAndOpen(file.name, file.source);
        } else if (!payload.shareType || payload.shareType === 'text' || payload.shareType === 'url') {
          await importAndOpen('分享的文字.md', value);
        } else throw new Error('请选择 Markdown 文件或分享文字。');
      });
    } else if (/^(content|file):\/\//i.test(url)) {
      void run(async () => { const file = await readExternalFile(url); await importAndOpen(file.name, file.source); });
    }
  }, [busy, incoming, run]);

  const changeTheme = () => Alert.alert('阅读主题', '选择你习惯的明暗', [
    ...(['system', 'light', 'dark'] as const).map((value, index) => ({ text: ['跟随系统', '浅色', '深色'][index], onPress: () => {
      setPreference(value); void AsyncStorage.setItem(THEME_KEY, value).catch(report);
    } })), { text: '取消', style: 'cancel' },
  ]);
  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
    <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {active ? <Action label={editing ? '返回阅读' : '文档首页'} onPress={goBack} colors={colors} disabled={busy} /> : <Text style={[styles.headerLabel, { color: colors.muted }]}>本地 Markdown 阅读器</Text>}
        <Action label="主题" onPress={changeTheme} colors={colors} />
      </View>
      {busy && <View style={styles.status}><ActivityIndicator color={colors.accent} /><Text style={{ color: colors.muted }}>正在处理…</Text></View>}
      {notice !== '' && <Text accessibilityLiveRegion="polite" style={[styles.notice, { color: colors.accent, backgroundColor: colors.soft }]}>{notice}</Text>}
      {active ? <Reader key={active.record.id} record={active.record} source={active.source} editing={editing} busy={busy} colors={colors} theme={theme}
        onChange={source => { const next = { ...current.current!, source }; current.current = next; setActive(next); setNotice('正在保留草稿…'); }}
        onEdit={() => { void run(async () => { await flushDraft(); setEditing(value => !value); }); }}
        onSave={() => { void run(async () => { await flushDraft(); const doc = current.current!; const name = await exportCopy(doc.record.name, doc.source); if (name) Alert.alert('副本已保存', name); }); }}
        onProgress={value => { void repository.saveProgress(active.record.id, value).catch(report); }} /> :
        <Library records={records} colors={colors} busy={busy}
          onOpen={() => { void run(async () => { const file = await pickDocument(); if (file) await importAndOpen(file.name, file.source); }); }}
          onSample={() => { void run(async () => { const existing = (await repository.list()).find(record => record.name === SAMPLE_NAME); if (existing) await activate(await repository.open(existing.id)); else await importAndOpen(SAMPLE_NAME, SAMPLE); }); }}
          onSelect={id => { void run(async () => { await activate(await repository.open(id)); }); }} />}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><Main /></SafeAreaProvider>; }
const styles = StyleSheet.create({ safe: { flex: 1 }, header: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth }, headerLabel: { fontSize: 12 }, status: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 10 }, notice: { paddingHorizontal: 20, paddingVertical: 8, fontSize: 12 } });
