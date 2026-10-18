import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Action } from '../../components/Action';
import { IconButton } from '../../components/Icon';
import type { Palette } from '../../theme/colors';
import { normalizeNewDocumentName } from '../documents/validation';

export function NewDocumentDialog({ visible, colors, busy, onClose, onCreate }: {
  visible: boolean; colors: Palette; busy: boolean; onClose: () => void; onCreate: (name: string) => void;
}) {
  const [name, setName] = useState('新建文档.md');
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setName('新建文档.md');
      setError('');
    }
  }, [visible]);

  const submit = () => {
    try {
      onCreate(normalizeNewDocumentName(name));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '请检查文件名后重试。');
    }
  };

  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent
    onRequestClose={() => { if (!busy) onClose(); }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[
      styles.scrim,
      { paddingTop: Math.max(20, insets.top), paddingBottom: Math.max(20, insets.bottom) },
    ]}>
      <Pressable accessibilityRole="button" accessibilityLabel="关闭新建文档" disabled={busy} onPress={onClose} style={StyleSheet.absoluteFill} />
      <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: colors.paper, borderColor: colors.border }]}>
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            <Text style={[styles.title, { color: colors.text }]}>新建文档</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>创建空白 Markdown，并立即开始编辑。</Text>
          </View>
          <IconButton icon="x" label="关闭新建文档" colors={colors} onPress={onClose} disabled={busy} />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>文件名</Text>
        <TextInput accessibilityLabel="新文档文件名" value={name} onChangeText={value => { setName(value); setError(''); }}
          selectTextOnFocus autoCapitalize="none" autoCorrect={false} spellCheck={false} editable={!busy}
          returnKeyType="done" onSubmitEditing={submit} selectionColor={colors.accent}
          style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: error ? colors.danger : colors.border }]} />
        <Text style={[styles.hint, { color: colors.muted }]}>不填写扩展名时会自动添加 .md，也支持 .markdown。</Text>
        {error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={onClose}
            style={({ pressed }) => [styles.cancel, { borderColor: colors.border, opacity: busy ? 0.45 : pressed ? 0.7 : 1 }]}>
            <Text style={[styles.cancelText, { color: colors.muted }]}>取消</Text>
          </Pressable>
          <View style={styles.createSlot}>
            <Action label="创建并编辑" icon="file-plus" primary colors={colors} onPress={submit} disabled={busy} />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22, backgroundColor: '#00000066' },
  dialog: { width: '100%', maxWidth: 480, borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 20 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  headingCopy: { flex: 1, minWidth: 0 },
  title: { fontSize: 19, fontWeight: '700' },
  subtitle: { marginTop: 5, fontSize: 12, lineHeight: 18 },
  label: { marginBottom: 7, fontSize: 12, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 11, paddingHorizontal: 13, fontSize: 14 },
  hint: { marginTop: 8, fontSize: 11, lineHeight: 16 },
  error: { marginTop: 8, fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancel: { minHeight: 44, minWidth: 84, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 14 },
  cancelText: { fontSize: 13, fontWeight: '600' },
  createSlot: { flex: 1, maxWidth: 190, alignItems: 'stretch' },
});
