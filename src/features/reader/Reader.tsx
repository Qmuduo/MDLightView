import { useMemo, useRef, useState } from 'react';
import { Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { DocumentRecord } from '../documents/repository';
import { buildReaderPage, renderMarkdown } from './markdown';
import type { Palette } from '../../theme/colors';
import { Action } from '../../components/Action';

export function Reader({ record, source, editing, busy, colors, theme, onEdit, onChange, onSave, onProgress }: {
  record: DocumentRecord; source: string; editing: boolean; busy: boolean; colors: Palette; theme: 'light' | 'dark';
  onEdit: () => void; onChange: (value: string) => void; onSave: () => void; onProgress: (value: number) => void;
}) {
  const web = useRef<WebView>(null);
  const progress = useRef(record.progress);
  const [toc, setToc] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const headings = useMemo(() => editing ? [] : renderMarkdown(source).headings, [source, editing]);
  // Progress changes must not replace the WebView's source and reset scrolling.
  const page = useMemo(() => ({ html: editing ? '' : buildReaderPage(source, theme, progress.current) }), [source, theme, editing]);
  const openExternal = (url: string) => {
    if (!/^(https?:\/\/|mailto:)/i.test(url)) return;
    Alert.alert('打开外部链接？', url, [{ text: '取消', style: 'cancel' }, { text: '打开', onPress: () => { void Linking.openURL(url).catch(() => Alert.alert('链接无法打开', '请检查手机上是否有可用的浏览器或邮件应用。')); } }]);
  };

  return <View style={styles.root}>
    <View style={[styles.documentBar, { borderBottomColor: colors.border }]}>
      <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>{record.name}</Text>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{editing ? '编辑草稿' : record.draftUri ? '阅读草稿' : '阅读'}</Text>
    </View>
    {editing ? <TextInput accessibilityLabel="Markdown 源码" value={source} onChangeText={onChange} multiline
      autoCapitalize="none" autoCorrect={false} textAlignVertical="top" editable={!busy}
      style={[styles.editor, { color: colors.text, backgroundColor: colors.paper, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]} /> :
      loadError ? <View style={styles.error}><Text style={{ color: colors.text }}>正文未能显示，请重新加载。</Text><Action label="重新加载" colors={colors} onPress={() => { setLoadError(false); setReload(value => value + 1); }} /></View> :
      <WebView key={reload} ref={web} source={page} originWhitelist={['*']} style={{ backgroundColor: colors.paper }}
        javaScriptEnabled domStorageEnabled={false} allowFileAccess={false} allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false} mixedContentMode="never" setSupportMultipleWindows={false}
        textZoom={100} onError={() => setLoadError(true)}
        onShouldStartLoadWithRequest={request => request.url === 'about:blank'}
        onMessage={event => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'progress' && typeof message.value === 'number' && Number.isFinite(message.value)) {
              progress.current = Math.max(0, Math.min(1, message.value)); onProgress(progress.current);
            }
            if (message.type === 'link' && typeof message.url === 'string') openExternal(message.url);
          } catch { /* Ignore malformed messages; document content never gets a native API. */ }
        }} />}
    <View style={[styles.toolbar, { backgroundColor: colors.paper, borderTopColor: colors.border }]}>
      <Action label={editing ? '阅读预览' : '编辑源码'} onPress={onEdit} colors={colors} disabled={busy} />
      {editing ? <Action label="另存副本" primary onPress={onSave} colors={colors} disabled={busy} /> : <Action label="目录" onPress={() => setToc(true)} colors={colors} />}
    </View>
    <Modal visible={toc} transparent animationType="slide" onRequestClose={() => setToc(false)}>
      <View style={styles.scrim}><View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.paper }]}>
        <View style={styles.sheetHeading}><Text style={[styles.sheetTitle, { color: colors.text }]}>标题目录</Text><Action label="关闭" colors={colors} onPress={() => setToc(false)} /></View>
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {headings.length === 0 && <Text style={{ color: colors.muted, padding: 20 }}>这篇文档没有标题。</Text>}
          {headings.map(heading => <Text key={heading.id} accessibilityRole="button" accessibilityLabel={`跳到 ${heading.title}`}
            onPress={() => { setToc(false); web.current?.injectJavaScript(`document.getElementById(${JSON.stringify(heading.id)})?.scrollIntoView();true;`); }}
            style={[styles.tocEntry, { color: colors.text, paddingLeft: 16 + (heading.level - 1) * 14, borderBottomColor: colors.border }]}>{heading.title}</Text>)}
        </ScrollView>
      </View></View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, documentBar: { paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 6 }, name: { fontSize: 15, fontWeight: '600' }, editor: { flex: 1, padding: 22, fontSize: 16, lineHeight: 26 }, toolbar: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, gap: 12, borderTopWidth: StyleSheet.hairlineWidth }, scrim: { flex: 1, backgroundColor: '#00000070', justifyContent: 'flex-end' }, sheet: { maxHeight: '75%', padding: 20, paddingBottom: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, sheetHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }, sheetTitle: { fontSize: 22, fontWeight: '700' }, tocEntry: { minHeight: 48, paddingVertical: 14, paddingRight: 16, fontSize: 16, lineHeight: 24, borderBottomWidth: StyleSheet.hairlineWidth }, error: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 } });
