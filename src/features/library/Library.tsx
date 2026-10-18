import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DocumentRecord } from '../documents/repository';
import type { Palette } from '../../theme/colors';
import { Action } from '../../components/Action';
import { Icon, IconButton, type IconName } from '../../components/Icon';
import { NewDocumentDialog } from './NewDocumentDialog';

function relativeDate(timestamp: number, now = Date.now()) {
  const date = new Date(timestamp);
  const today = new Date(now);
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return '今天';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(date, yesterday)) return '昨天';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function progressLabel(progress: number) {
  return `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`;
}

function progressWidth(progress: number): `${number}%` {
  return `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`;
}

export function Library({ records, colors, busy, showSample, themeIcon, onOpen, onSample, onSelect, onTheme, onCreateDocument }: {
  records: DocumentRecord[]; colors: Palette; busy: boolean; showSample: boolean; themeIcon: IconName;
  onOpen: () => void; onSample: () => void; onSelect: (id: string) => void; onTheme: () => void;
  onCreateDocument: (name: string) => void;
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const latest = records[0];
  return <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.page}>
    <View style={styles.brandBar}>
      <View style={[styles.brandMark, { backgroundColor: colors.accent }]}>
        <Text style={[styles.markLetter, { color: colors.onAccent }]}>M</Text>
        <Icon name="arrow-down" color={colors.onAccent} size={13} />
      </View>
      <View style={styles.brandCopy}>
        <Text style={[styles.brand, { color: colors.text }]}>轻览 <Text style={[styles.brandEnglish, { color: colors.muted }]}>MD</Text></Text>
        <Text style={[styles.tagline, { color: colors.muted }]}>留一点时间，给阅读。</Text>
      </View>
      <IconButton icon={themeIcon} label="阅读主题" colors={colors} onPress={onTheme} disabled={busy} />
    </View>

    <View style={styles.pageHeading}>
      <Text style={[styles.title, { color: colors.text }]}>我的文档</Text>
      <Text style={[styles.count, { color: colors.muted }]}>{records.length} 份 · 本机</Text>
    </View>

    <View style={styles.fileActions}>
      <View style={styles.actionSlot}><Action label="打开文件" icon="folder" primary colors={colors} onPress={onOpen} disabled={busy} /></View>
      <View style={styles.actionSlot}><Action label="新建文档" icon="file-plus" colors={colors} onPress={() => setCreateDialogOpen(true)} disabled={busy} /></View>
    </View>

    <NewDocumentDialog visible={createDialogOpen} colors={colors} busy={busy}
      onClose={() => setCreateDialogOpen(false)} onCreate={onCreateDocument} />

    {latest ? <>
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>继续阅读</Text>
        <Text style={[styles.sectionHint, { color: colors.muted }]}>上次打开</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`继续阅读 ${latest.name}，已读 ${progressLabel(latest.progress)}`}
        disabled={busy} onPress={() => onSelect(latest.id)}
        style={({ pressed }) => [styles.resume, { backgroundColor: colors.feature, opacity: busy ? 0.45 : pressed ? 0.78 : 1 }]}>
        <View style={[styles.bookmark, { backgroundColor: colors.paper }]}><Icon name="bookmark" color={colors.accent} size={17} /></View>
        <Text style={[styles.resumeEyebrow, { color: colors.muted }]} numberOfLines={1}>{latest.name}</Text>
        <Text style={[styles.resumeTitle, { color: colors.text }]} numberOfLines={2}>接着上次的位置读下去</Text>
        <View style={styles.resumeMeta}>
          <Text style={[styles.resumeProgress, { color: colors.muted }]}>已读 {progressLabel(latest.progress)} · {relativeDate(latest.updatedAt)}</Text>
          <View style={styles.resumeAction}><Text style={[styles.resumeActionText, { color: colors.accent }]}>接着读</Text><Icon name="arrow-up-right" color={colors.accent} size={15} /></View>
        </View>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View style={{ width: progressWidth(latest.progress), height: '100%', backgroundColor: colors.water }} />
        </View>
      </Pressable>
    </> : <View style={[styles.empty, { backgroundColor: colors.paper, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.background }]}><Icon name="file-text" color={colors.slate} size={19} /></View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>这里还没有文档</Text>
      <Text style={[styles.emptyCopy, { color: colors.muted }]}>打开一份本地 Markdown 文件，开始阅读。</Text>
    </View>}

    {records.length > 0 && <>
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>最近阅读</Text>
        <Text style={[styles.sectionHint, { color: colors.muted }]}>按打开时间</Text>
      </View>
      <View style={[styles.fileList, { backgroundColor: colors.paper }]}>
        {records.map((record, index) => <Pressable key={record.id} accessibilityRole="button"
          accessibilityLabel={`打开 ${record.name}${record.draftUri ? '，含编辑草稿' : ''}，已读 ${progressLabel(record.progress)}`}
          disabled={busy} onPress={() => onSelect(record.id)}
          style={({ pressed }) => [styles.fileRow, index !== records.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }, { opacity: busy ? 0.45 : pressed ? 0.7 : 1 }]}>
          <View style={[styles.fileIcon, { backgroundColor: colors.background }]}>
            <Icon name={record.draftUri ? 'file-plus' : 'file-text'} color={colors.slate} size={18} />
          </View>
          <View style={styles.fileCopy}>
            <Text numberOfLines={1} style={[styles.fileName, { color: colors.text }]}>{record.name}</Text>
            <View style={styles.fileMeta}>
              {record.draftUri && <Text style={[styles.draft, { backgroundColor: colors.draftBackground, color: colors.draftText }]}>有草稿</Text>}
              <Text numberOfLines={1} style={[styles.fileDetails, { color: colors.muted }]}>{record.draftUri ? ' · ' : ''}已读 {progressLabel(record.progress)} · {relativeDate(record.updatedAt)}</Text>
            </View>
          </View>
          <Icon name="chevron-right" color={colors.muted} size={16} />
        </Pressable>)}
      </View>
    </>}

    {showSample && <Pressable accessibilityRole="button" accessibilityLabel="阅读示例" disabled={busy} onPress={onSample}
      style={({ pressed }) => [styles.sampleLink, { opacity: busy ? 0.45 : pressed ? 0.65 : 1 }]}>
      <Icon name="book-open" color={colors.accent} size={15} />
      <Text style={[styles.sampleText, { color: colors.accent }]}>阅读示例</Text>
      <Icon name="arrow-right" color={colors.accent} size={14} />
    </Pressable>}

    <View style={styles.footer}>
      <Icon name="hard-drive" color={colors.muted} size={13} />
      <Text style={[styles.footerText, { color: colors.muted }]}>文件与草稿保存在本机</Text>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  page: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 13, paddingBottom: 28 },
  brandBar: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 0 },
  markLetter: { fontSize: 20, fontWeight: '800', fontFamily: 'serif', marginRight: -2 },
  brandCopy: { flex: 1 },
  brand: { fontSize: 18, fontWeight: '700', letterSpacing: 0.6 },
  brandEnglish: { fontSize: 12, fontWeight: '500', letterSpacing: 0 },
  tagline: { fontSize: 11, marginTop: 2 },
  pageHeading: { marginTop: 23, marginBottom: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { fontSize: 25, fontWeight: '700', letterSpacing: -0.5 },
  count: { fontSize: 12 },
  fileActions: { flexDirection: 'row', gap: 10 },
  actionSlot: { flex: 1, minWidth: 0, alignItems: 'stretch' },
  sectionHeading: { marginTop: 26, marginBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  sectionHint: { fontSize: 11 },
  resume: { position: 'relative', borderRadius: 16, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 15, overflow: 'hidden' },
  bookmark: { position: 'absolute', right: 16, top: 16, width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  resumeEyebrow: { maxWidth: '78%', fontSize: 11 },
  resumeTitle: { maxWidth: '84%', fontSize: 18, lineHeight: 26, fontWeight: '600', marginTop: 4, marginBottom: 15 },
  resumeMeta: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  resumeProgress: { flexShrink: 1, fontSize: 11 },
  resumeAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resumeActionText: { fontSize: 12, fontWeight: '600' },
  track: { width: '100%', height: 3, borderRadius: 3, overflow: 'hidden', marginTop: 11 },
  empty: { borderWidth: 1, borderRadius: 15, paddingHorizontal: 18, paddingVertical: 18 },
  emptyIcon: { width: 38, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 9, marginBottom: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '600' },
  emptyCopy: { marginTop: 5, fontSize: 12, lineHeight: 18 },
  fileList: { borderRadius: 14, paddingHorizontal: 14 },
  fileRow: { minHeight: 72, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  fileIcon: { width: 35, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 },
  fileCopy: { flex: 1, minWidth: 0 },
  fileName: { fontSize: 13, fontWeight: '500' },
  fileMeta: { marginTop: 5, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  draft: { flexShrink: 0, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, fontSize: 10, overflow: 'hidden' },
  fileDetails: { flexShrink: 1, fontSize: 10 },
  sampleLink: { minHeight: 44, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11, paddingHorizontal: 12 },
  sampleText: { fontSize: 12, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 17 },
  footerText: { fontSize: 10 },
});
