import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, BackHandler, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, View, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Action } from './components/Action';
import { ThemePicker } from './components/ThemePicker';
import { Library } from './features/library/Library';
import { SAMPLE, SAMPLE_NAME } from './features/library/sample';
import { Reader } from './features/reader/Reader';
import { exportCopy, pickDocument, readExternalFile, repository } from './features/documents/expoStorage';
import type { DocumentRecord } from './features/documents/repository';
import { DraftWriter } from './features/documents/draftWriter';
import { FirstHomeGuide, shouldPrepareHomeAfterInitialRoute } from './features/onboarding/firstHomeGuide';
import { palettes, type ThemePreference } from './theme/colors';

type ActiveDocument = { record: DocumentRecord; source: string };
const THEME_KEY = '@mdlightview/theme/v1';
const FIRST_HOME_KEY = '@mdlightview/onboarding/first-home-seen/v1';
const isLocalDocumentUrl = (url?: string | null) => Boolean(url && /^(content|file):\/\//i.test(url));

function Main() {
  const system = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const theme = preference === 'system' ? system === 'dark' ? 'dark' : 'light' : preference;
  const colors = palettes[theme];
  const [records, setRecords] = useState<DocumentRecord[]>([]);
  const [active, setActive] = useState<ActiveDocument | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(true);
  const [startupReady, setStartupReady] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [incoming, setIncoming] = useState<string[]>([]);
  const current = useRef<ActiveDocument | null>(null);
  const initialRoutePending = useRef(false);
  const guideReady = useRef(false);
  const guide = useRef<FirstHomeGuide | null>(null);
  if (!guide.current) guide.current = new FirstHomeGuide({
    readSeen: async () => await AsyncStorage.getItem(FIRST_HOME_KEY) === 'seen',
    markSeen: () => AsyncStorage.setItem(FIRST_HOME_KEY, 'seen'),
  });
  const incomingQueue = useRef<string[]>([]);
  const draftWriter = useRef(new DraftWriter((id, source) => repository.saveDraft(id, source)));
  const locked = useRef(false);
  const mounted = useRef(true);

  const report = useCallback((error: unknown) => {
    if (mounted.current) Alert.alert('操作未完成', error instanceof Error ? error.message : '请重试，当前内容仍保留。');
  }, []);
  const refresh = useCallback(async () => {
    const values = await repository.list();
    if (mounted.current) setRecords(values);
  }, []);
  const prepareHome = useCallback(async () => {
    if (!guideReady.current) {
      if (mounted.current) setShowSample(false);
      return;
    }
    try {
      const visible = await guide.current!.enterHome();
      if (mounted.current) setShowSample(visible);
    } catch (error) {
      report(error);
      if (mounted.current) setShowSample(false);
    }
  }, [report]);
  const flushDraft = useCallback(async () => {
    const document = await draftWriter.current.flush(() => current.current ? { id: current.current.record.id, source: current.current.source } : null);
    if (!document) return;
    const record = (await repository.list()).find(value => value.id === document.id);
    if (!record) throw new Error('找不到这份文档，草稿仍保留在本机。');
    if (current.current?.record.id === document.id) {
      const next = { ...current.current, record };
      current.current = next;
      if (mounted.current) {
        setActive(next);
        setNotice(current.current.source === document.source ? '草稿已保留在本机' : '正在保留草稿…');
      }
    }
  }, []);
  const run = useCallback(async (operation: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    if (mounted.current) { setBusy(true); setNotice(''); }
    try { await operation(); }
    catch (error) { report(error); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }, [report]);
  const activate = useCallback(async (document: ActiveDocument, editingMode = false) => {
    current.current = document;
    draftWriter.current.markLoaded(document.record.id, document.source);
    setActive(document);
    setEditing(editingMode);
    setNotice(document.record.draftUri ? '已恢复编辑草稿' : '');
    await refresh();
  }, [refresh]);
  const importAndOpen = useCallback(async (name: string, source: string) => {
    await flushDraft();
    const record = await repository.importDocument(name, source);
    await activate({ record, source });
  }, [activate, flushDraft]);
  const createAndEdit = useCallback((name: string) => {
    void run(async () => {
      await flushDraft();
      const record = await repository.createDocument(name);
      await activate({ record, source: '' }, true);
    });
  }, [activate, flushDraft, run]);
  const goBack = useCallback(() => {
    void run(async () => {
      await flushDraft();
      if (editing) { setEditing(false); return; }
      await refresh();
      await prepareHome();
      current.current = null;
      setActive(null);
    });
  }, [editing, flushDraft, prepareHome, refresh, run]);
  const queueIncoming = useCallback((url?: string | null) => {
    const queue = [...incomingQueue.current, url ?? 'share'];
    incomingQueue.current = queue;
    setIncoming(queue);
  }, []);
  const completeInitialRoute = useCallback(async (wasInitialRoute: boolean) => {
    if (!wasInitialRoute || incomingQueue.current.length > 0) return;
    initialRoutePending.current = false;
    if (shouldPrepareHomeAfterInitialRoute({ wasInitialRoute, hasActiveDocument: Boolean(current.current), pendingIncomingCount: incomingQueue.current.length })) {
      await prepareHome();
    }
    if (mounted.current) setStartupReady(true);
  }, [prepareHome]);

  useEffect(() => {
    mounted.current = true;
    let links: ReturnType<typeof Linking.addEventListener> | undefined;
    let app: ReturnType<typeof AppState.addEventListener> | undefined;
    links = Linking.addEventListener('url', ({ url }) => queueIncoming(url));
    app = AppState.addEventListener('change', state => {
      if (state === 'active') {
        try { if (Sharing.getSharedPayloads().length > 0) queueIncoming(); }
        catch (error) { report(error); }
      }
      else void flushDraft().catch(report);
    });

    void (async () => {
      const [recordsResult, themeResult, initialUrlResult] = await Promise.allSettled([
        repository.list(), AsyncStorage.getItem(THEME_KEY), Linking.getInitialURL(),
      ]);
      let startupRecords: DocumentRecord[] = [];
      if (recordsResult.status === 'fulfilled') {
        startupRecords = recordsResult.value;
        if (mounted.current) setRecords(startupRecords);
      } else report(recordsResult.reason);
      if (themeResult.status === 'fulfilled') {
        const value = themeResult.value;
        if (value === 'light' || value === 'dark' || value === 'system') setPreference(value);
      } else report(themeResult.reason);

      if (recordsResult.status === 'fulfilled') {
        try {
          await guide.current!.hydrate(startupRecords.length);
          guideReady.current = true;
        } catch (error) { report(error); }
      }

      let initialShares = [] as ReturnType<typeof Sharing.getSharedPayloads>;
      try { initialShares = Sharing.getSharedPayloads(); } catch (error) { report(error); }
      const initialUrl = initialUrlResult.status === 'fulfilled' ? initialUrlResult.value : null;
      if (initialUrlResult.status === 'rejected') report(initialUrlResult.reason);
      const hasInitialRoute = isLocalDocumentUrl(initialUrl) || initialShares.length > 0 || incomingQueue.current.length > 0;
      if (hasInitialRoute) {
        initialRoutePending.current = true;
        if (isLocalDocumentUrl(initialUrl) && !incomingQueue.current.includes(initialUrl!)) queueIncoming(initialUrl);
        else if (initialShares.length > 0 && incomingQueue.current.length === 0) queueIncoming('share');
      } else {
        await prepareHome();
        if (mounted.current) setStartupReady(true);
      }
      if (mounted.current) setBusy(false);
    })().catch(error => {
      report(error);
      if (mounted.current) { setShowSample(false); setStartupReady(true); setBusy(false); }
    });

    return () => {
      mounted.current = false;
      links?.remove();
      app?.remove();
    };
  }, [flushDraft, prepareHome, queueIncoming, report]);

  useEffect(() => {
    if (busy || incoming.length === 0) return;
    const url = incomingQueue.current[0] ?? incoming[0];
    incomingQueue.current = incomingQueue.current.slice(1);
    setIncoming(incomingQueue.current);
    let shares: ReturnType<typeof Sharing.getSharedPayloads> = [];
    try { shares = Sharing.getSharedPayloads(); } catch (error) { report(error); }
    const wasInitialRoute = initialRoutePending.current;
    if (shares.length > 0) {
      Sharing.clearSharedPayloads();
      void run(async () => {
        if (shares.length !== 1 || !shares[0].value) throw new Error('请选择一份文档或分享一段文字。');
        const payload = shares[0];
        const value = payload.value!;
        if (payload.shareType === 'file' || isLocalDocumentUrl(value)) {
          const file = await readExternalFile(value);
          await importAndOpen(file.name, file.source);
        } else if (!payload.shareType || payload.shareType === 'text' || payload.shareType === 'url') {
          await importAndOpen('分享的文字.md', value);
        } else throw new Error('请选择 Markdown 文件或分享文字。');
      }).finally(() => { void completeInitialRoute(wasInitialRoute); });
    } else if (isLocalDocumentUrl(url)) {
      void run(async () => {
        const file = await readExternalFile(url);
        await importAndOpen(file.name, file.source);
      }).finally(() => { void completeInitialRoute(wasInitialRoute); });
    } else void completeInitialRoute(wasInitialRoute);
  }, [busy, incoming, importAndOpen, prepareHome, report, run, completeInitialRoute]);

  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (busy) return true;
      if (current.current) { goBack(); return true; }
      return false;
    });
    return () => listener.remove();
  }, [busy, goBack]);

  const changeTheme = (value: ThemePreference) => {
    setPreference(value);
    setThemePickerOpen(false);
    void AsyncStorage.setItem(THEME_KEY, value).catch(report);
  };
  const themeIcon = preference === 'system' ? 'monitor' : preference === 'dark' ? 'moon' : 'sun';

  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
    <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {active ? <Reader key={active.record.id} record={active.record} source={active.source} editing={editing} busy={busy} colors={colors} theme={theme}
        themeIcon={themeIcon} draftStatus={notice} onBack={goBack} onTheme={() => setThemePickerOpen(true)}
        onChange={source => {
          const document = current.current;
          if (!document) return;
          const next = { ...document, source };
          current.current = next;
          setActive(next);
          setNotice('正在保留草稿…');
        }}
        onEdit={() => { void run(async () => { await flushDraft(); setEditing(value => !value); }); }}
        onSave={() => { void run(async () => { await flushDraft(); const doc = current.current!; const name = await exportCopy(doc.record.name, doc.source); if (name) Alert.alert('副本已保存', name); }); }}
        onProgress={value => { void repository.saveProgress(active.record.id, value).catch(report); }} /> : startupReady ?
        <Library records={records} colors={colors} busy={busy} showSample={showSample} themeIcon={themeIcon}
          onTheme={() => setThemePickerOpen(true)}
          onOpen={() => { void run(async () => { const file = await pickDocument(); if (file) await importAndOpen(file.name, file.source); }); }}
          onCreateDocument={createAndEdit}
          onSample={() => { void run(async () => {
            const existing = (await repository.list()).find(record => record.name === SAMPLE_NAME);
            if (existing) await activate(await repository.open(existing.id));
            else await importAndOpen(SAMPLE_NAME, SAMPLE);
          }); }}
          onSelect={id => { void run(async () => { await activate(await repository.open(id)); }); }} /> :
        <View style={styles.startup}>
          <ActivityIndicator color={colors.accent} />
          <Text style={[styles.startupText, { color: colors.muted }]}>正在准备文档…</Text>
        </View>}
      <ThemePicker visible={themePickerOpen} preference={preference} colors={colors} onChoose={changeTheme} onClose={() => setThemePickerOpen(false)} />
      {busy && startupReady && <View pointerEvents="none" style={[styles.busy, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[styles.busyText, { color: colors.muted }]}>正在处理…</Text>
      </View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><Main /></SafeAreaProvider>; }

const styles = StyleSheet.create({
  safe: { flex: 1 },
  startup: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  startupText: { fontSize: 12 },
  busy: { position: 'absolute', top: 8, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 30, paddingHorizontal: 13, paddingVertical: 7, opacity: 0.94 },
  busyText: { fontSize: 11 },
});
