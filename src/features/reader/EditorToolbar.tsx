import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { Palette } from '../../theme/colors';
import type { EditorCommand } from './editorCommands';

const actions: { command: EditorCommand; label: string; accessibilityLabel: string }[] = [
  { command: 'bold', label: '加粗', accessibilityLabel: '插入加粗格式' },
  { command: 'italic', label: '斜体', accessibilityLabel: '插入斜体格式' },
  { command: 'heading', label: '标题', accessibilityLabel: '切换二级标题' },
  { command: 'bullet', label: '• 列表', accessibilityLabel: '插入无序列表' },
  { command: 'numbered', label: '1. 列表', accessibilityLabel: '插入有序列表' },
  { command: 'quote', label: '引用', accessibilityLabel: '插入引用格式' },
  { command: 'code', label: '代码', accessibilityLabel: '插入代码格式' },
  { command: 'link', label: '链接', accessibilityLabel: '插入链接' },
];

export function EditorToolbar({ colors, disabled, onCommand }: {
  colors: Palette;
  disabled: boolean;
  onCommand: (command: EditorCommand) => void;
}) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always"
    style={[styles.root, { backgroundColor: colors.paper }]}
    contentContainerStyle={styles.content}>
    {actions.map(action => <Pressable key={action.command} accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel} accessibilityState={{ disabled }} disabled={disabled}
      onPress={() => onCommand(action.command)}
      style={({ pressed }) => [styles.button, { backgroundColor: colors.soft, opacity: disabled ? 0.42 : pressed ? 0.68 : 1 }]}>
      <Text style={[styles.label, { color: colors.accent }]}>{action.label}</Text>
    </Pressable>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  root: { flexGrow: 0, minHeight: 52, maxHeight: 52 },
  content: { alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  button: { minWidth: 44, minHeight: 44, borderRadius: 11, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '600' },
});
