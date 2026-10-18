import { useMemo, useRef, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { DocumentRecord } from '../documents/repository';
import { buildReaderPage, renderMarkdown } from './markdown';
import type { Palette } from '../../theme/colors';
import { Action } from '../../components/Action';
import { Icon, IconButton, type IconName } from '../../components/Icon';
import { EditorToolbar } from './EditorToolbar';
import { applyEditorCommand, type EditorCommand, type TextSelection } from './editorCommands';

export function Reader({ record, source, editing, busy, colors, theme, themeIcon, draftStatus, onBack, onTheme, onEdit, onChange, onSave, onProgress }: {
  record: DocumentRecord; source: string; editing: boolean; busy: boolean; colors: Palette; theme: 'light' | 'dark';
  themeIcon: IconName; draftStatus: string; onBack: () => void; onTheme: () => void;
  onEdit: () => void; onChange: (value: string) => void; onSave: () => void; onProgress: (value: number) => void;
}) {
  const web = useRef<WebView>(null);
  const editor = useRef<TextInput>(null);
  const progress = useRef(record.progress);
  const [readProgress, setReadProgress] = useState(Math.round(record.progress * 100));
  const [selection, setSelection] = useState<TextSelection>({ start: source.length, end: source.length });
  const [toc, setToc] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const insets = useSafeAreaInsets();
  const headings = useMemo(() => editing ? [] : renderMarkdown(source).headings, [source, editing]);
  // Progress updates are kept out of this memo so a scroll never reloads the WebView.
  const page = useMemo(() => ({ html: editing ? '' : buildReaderPage(source, theme, progress.current) }), [source, theme, editing]);

  const applyCommand = (command: EditorCommand) => {
    const result = applyEditorCommand(source, selection, command);
    onChange(result.text);
    setSelection(result.selection);
    editor.current?.focus();
  };

  const openExternal = (url: string) => {
    if (!/^(https?:\/\/|mailto:)/i.test(url)) return;
    Alert.alert('打开外部链接？', url, [{ text: '取消', style: 'cancel' }, { text: '打开', onPress: () => {
      void Linking.openURL(url).catch(() => Alert.alert('链接无法打开', '请检查手机上是否有可用的浏览器或邮件应用。'));
    } }]);
  };

  return <View style={[styles.root, { backgroundColor: colors.paper }]}>
    <View style={[styles.documentBar, { backgroundColor: colors.paper, borderBottomColor: colors.border }]}>
      <IconButton icon="arrow-left" label={editing ? '返回阅读' : '返回我的文档'} colors={colors} onPress={onBack} disabled={busy} />
      <View style={styles.documentCopy}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>{record.name}</Text>
        <Text numberOfLines={1} style={[styles.documentState, { color: colors.muted }]}>{editing ? '编辑草稿' : record.draftUri ? '阅读草稿' : '阅读'}</Text>
      </View>
      <IconButton icon={themeIcon} label="阅读主题" colors={colors} onPress={onTheme} disabled={busy} />
    </View>

    {editing && <View style={[styles.draftStatus, { backgroundColor: colors.paper, borderBottomColor: colors.border }]}>
      <View style={[styles.statusDot, { backgroundColor: draftStatus.includes('正在') ? colors.water : colors.accent }]} />
      <Text accessibilityLiveRegion="polite" numberOfLines={1} style={[styles.draftStatusText, { color: colors.muted }]}>{draftStatus || '编辑时自动保留在本机'}</Text>
    </View>}

    {editing ? <TextInput ref={editor} accessibilityLabel="Markdown 源码" value={source} onChangeText={onChange} multiline
      autoCapitalize="none" autoCorrect={false} spellCheck={false} textAlignVertical="top" editable={!busy}
      selection={selection} onSelectionChange={event => setSelection(event.nativeEvent.selection)}
      selectionColor={colors.accent} keyboardAppearance={theme}
      style={[styles.editor, { color: colors.text, backgroundColor: colors.paper, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]} /> :
      loadError ? <View style={styles.error}>
        <View style={[styles.errorIcon, { backgroundColor: colors.soft }]}><Icon name="alert-circle" color={colors.danger} size={21} /></View>
        <Text style={{ color: colors.text }}>正文未能显示，请重新加载。</Text>
        <Action label="重新加载" icon="rotate-cw" colors={colors} onPress={() => { setLoadError(false); setReload(value => value + 1); }} />
      </View> :
      <WebView key={reload} ref={web} source={page} originWhitelist={['*']} style={{ flex: 1, backgroundColor: colors.paper }}
        javaScriptEnabled domStorageEnabled={false} allowFileAccess={false} allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false} mixedContentMode="never" setSupportMultipleWindows={false}
        textZoom={100} onError={() => setLoadError(true)}
        onShouldStartLoadWithRequest={request => request.url === 'about:blank'}
        onMessage={event => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'progress' && typeof message.value === 'number' && Number.isFinite(message.value)) {
              progress.current = Math.max(0, Math.min(1, message.value));
              setReadProgress(Math.round(progress.current * 100));
              onProgress(progress.current);
            }
            if (message.type === 'link' && typeof message.url === 'string') openExternal(message.url);
          } catch { /* Ignore malformed messages; document content never gets a native API. */ }
        }} />}

    {editing && <EditorToolbar colors={colors} disabled={busy} onCommand={applyCommand} />}

    <View style={[styles.toolbar, { backgroundColor: colors.paper, borderTopColor: colors.border }]}>
      {editing ? <>
        <Action label="阅读预览" icon="book-open" onPress={onEdit} colors={colors} disabled={busy} />
        <Action label="另存副本" icon="save" primary onPress={onSave} colors={colors} disabled={busy} />
      </> : <>
        <Action label="目录" icon="list" onPress={() => setToc(true)} colors={colors} disabled={busy} />
        <Text accessibilityLabel={`已读 ${readProgress}%`} style={[styles.progressText, { color: colors.muted }]}>{`已读 ${readProgress}%`}</Text>
        <Action label="编辑源码" icon="edit-3" primary onPress={onEdit} colors={colors} disabled={busy} />
      </>}
    </View>

    <Modal visible={toc} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setToc(false)}>
      <View style={styles.scrim}>
        <Pressable accessibilityRole="button" accessibilityLabel="关闭目录" onPress={() => setToc(false)} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.paper, paddingBottom: Math.max(24, insets.bottom + 12) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeading}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>目录</Text>
            <IconButton icon="x" label="关闭目录" colors={colors} onPress={() => setToc(false)} />
          </View>
          <Text numberOfLines={1} style={[styles.sheetDocument, { color: colors.muted }]}>{record.name}</Text>
          <ScrollView style={styles.tocScroll} contentContainerStyle={styles.tocContent}>
            {headings.length === 0 ? <View style={[styles.noHeadings, { backgroundColor: colors.background }]}>
              <Icon name="file-text" color={colors.slate} size={20} />
              <Text style={[styles.noHeadingsText, { color: colors.muted }]}>这份文档还没有标题。</Text>
            </View> : headings.map(heading => <Pressable key={heading.id} accessibilityRole="button"
              accessibilityLabel={`跳到 ${heading.title}`} disabled={busy}
              onPress={() => { setToc(false); web.current?.injectJavaScript(`document.getElementById(${JSON.stringify(heading.id)})?.scrollIntoView();true;`); }}
              style={({ pressed }) => [styles.tocEntry, { paddingLeft: 14 + (heading.level - 1) * 14, borderBottomColor: colors.border, opacity: pressed ? 0.66 : 1 }]}>
              <Text numberOfLines={2} style={[styles.tocText, { color: heading.level === 1 ? colors.text : colors.muted, fontWeight: heading.level <= 2 ? '600' : '400' }]}>{heading.title}</Text>
              <Icon name="arrow-up-right" color={colors.muted} size={15} />
            </Pressable>)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  documentBar: { minHeight: 61, paddingHorizontal: 15, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 9 },
  documentCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '600' },
  documentState: { fontSize: 11, marginTop: 3 },
  draftStatus: { minHeight: 38, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  draftStatusText: { flex: 1, fontSize: 11 },
  editor: { flex: 1, minHeight: 0, paddingHorizontal: 21, paddingTop: 16, paddingBottom: 20, fontSize: 15, lineHeight: 25 },
  toolbar: { minHeight: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: 9, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  progressText: { flex: 1, textAlign: 'center', fontSize: 11 },
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  sheet: { maxHeight: '78%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 21, paddingTop: 10 },
  sheetHandle: { width: 34, height: 4, borderRadius: 2, backgroundColor: '#7B879455', alignSelf: 'center', marginBottom: 13 },
  sheetHeading: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 21, fontWeight: '700', letterSpacing: -0.3 },
  sheetDocument: { fontSize: 11, marginBottom: 9 },
  tocScroll: { flexGrow: 0 },
  tocContent: { paddingBottom: 8 },
  tocEntry: { minHeight: 50, paddingVertical: 12, paddingRight: 9, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tocText: { flex: 1, fontSize: 14, lineHeight: 20 },
  noHeadings: { minHeight: 72, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 11 },
  noHeadingsText: { fontSize: 13 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 15 },
  errorIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
