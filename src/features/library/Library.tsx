import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import type { DocumentRecord } from '../documents/repository';
import type { Palette } from '../../theme/colors';
import { Action } from '../../components/Action';

export function Library({ records, colors, busy, onOpen, onSample, onSelect }: {
  records: DocumentRecord[]; colors: Palette; busy: boolean; onOpen: () => void; onSample: () => void; onSelect: (id: string) => void;
}) {
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={[styles.brand, { color: colors.accent }]}>轻览 MD <Text style={[styles.english, { color: colors.muted }]}>/ MDLightView</Text></Text>
    <View style={styles.intro}>
      <Text style={[styles.title, { color: colors.text }]}>打开，接着读。</Text>
      <Text style={[styles.description, { color: colors.muted }]}>本地笔记、技术文档、随手记录。{ '\n' }让文字回到舒服的阅读方式。</Text>
    </View>
    <View style={[styles.openCard, { backgroundColor: colors.paper, borderColor: colors.border }]}>
      <Text style={[styles.fileMark, { color: colors.accent }]}>M↓</Text>
      <Text style={[styles.cardTitle, { color: colors.text }]}>从一个 Markdown 文件开始</Text>
      <Text style={[styles.description, { color: colors.muted }]}>支持 .md、.markdown 和 .txt</Text>
      <View style={styles.actions}>
        <Action label="打开文件" primary onPress={onOpen} colors={colors} disabled={busy} />
        <Action label="阅读示例" onPress={onSample} colors={colors} disabled={busy} />
      </View>
    </View>
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>最近阅读</Text>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{records.length} 份文档</Text>
    </View>
    {records.length === 0 ? <Text style={[styles.empty, { color: colors.muted }]}>打开过的文档会留在这里，{ '\n' }下次从上次的位置继续。</Text> : records.map(record =>
      <Pressable accessibilityRole="button" accessibilityLabel={`继续阅读 ${record.name}`} key={record.id} disabled={busy} onPress={() => onSelect(record.id)}
        style={[styles.document, { backgroundColor: colors.paper, borderColor: colors.border }]}>
        <Text style={[styles.docName, { color: colors.text }]} numberOfLines={2}>{record.name}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>{record.draftUri ? '含编辑草稿 · ' : ''}已读 {Math.round(record.progress * 100)}%</Text>
        <View style={[styles.track, { backgroundColor: colors.soft }]}><View style={{ width: `${record.progress * 100}%`, height: 3, backgroundColor: colors.accent }} /></View>
      </Pressable>)}
    <Text style={[styles.footer, { color: colors.muted }]}>文件保存在本机 · 编辑后可另存副本</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({ page: { padding: 24, paddingBottom: 40, width: '100%', maxWidth: 760, alignSelf: 'center' }, brand: { fontSize: 20, fontWeight: '700', marginTop: 20 }, english: { fontSize: 12, fontWeight: '400' }, intro: { marginTop: 48, marginBottom: 30 }, title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.6 }, description: { fontSize: 14, lineHeight: 24, marginTop: 10 }, openCard: { padding: 24, borderWidth: 1, borderRadius: 20 }, fileMark: { fontSize: 30, fontWeight: '700', marginBottom: 24 }, cardTitle: { fontSize: 17, fontWeight: '600' }, actions: { flexDirection: 'row', gap: 12, marginTop: 24, flexWrap: 'wrap' }, sectionHeading: { marginTop: 38, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { fontSize: 18, fontWeight: '600' }, empty: { lineHeight: 26, paddingVertical: 20 }, document: { padding: 18, borderWidth: 1, borderRadius: 14, marginBottom: 12 }, docName: { fontSize: 16, fontWeight: '500', lineHeight: 24 }, meta: { fontSize: 12, marginTop: 10 }, track: { height: 3, borderRadius: 3, overflow: 'hidden', marginTop: 14 }, footer: { fontSize: 12, textAlign: 'center', marginTop: 30 } });
