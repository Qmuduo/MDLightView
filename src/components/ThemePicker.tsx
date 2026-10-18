import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ThemePreference, Palette } from '../theme/colors';
import { Icon, IconButton, type IconName } from './Icon';

const options: { value: ThemePreference; label: string; detail: string; icon: IconName }[] = [
  { value: 'system', label: '跟随系统', detail: '与手机外观保持一致', icon: 'monitor' },
  { value: 'light', label: '浅色', detail: '清亮的纸面与群青', icon: 'sun' },
  { value: 'dark', label: '深色', detail: '柔和的暗色阅读界面', icon: 'moon' },
];

export function ThemePicker({ visible, preference, colors, onChoose, onClose }: {
  visible: boolean; preference: ThemePreference; colors: Palette;
  onChoose: (value: ThemePreference) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
    <View style={styles.scrim}>
      <Pressable accessibilityRole="button" accessibilityLabel="关闭主题选择" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.paper, paddingBottom: Math.max(24, insets.bottom + 12) }]}>
        <View style={styles.heading}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>阅读主题</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>选择适合现在的明暗</Text>
          </View>
          <IconButton icon="x" label="关闭主题选择" colors={colors} onPress={onClose} />
        </View>
        <View style={styles.options}>
          {options.map(option => {
            const selected = preference === option.value;
            return <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: selected }}
              accessibilityLabel={`${option.label}，${option.detail}`} onPress={() => onChoose(option.value)}
              style={({ pressed }) => [styles.option, {
                backgroundColor: selected ? colors.soft : colors.background,
                borderColor: selected ? colors.accent : colors.border,
                opacity: pressed ? 0.76 : 1,
              }]}>
              <Icon name={option.icon} color={selected ? colors.accent : colors.slate} />
              <View style={styles.copy}>
                <Text style={[styles.label, { color: colors.text }]}>{option.label}</Text>
                <Text style={[styles.detail, { color: colors.muted }]}>{option.detail}</Text>
              </View>
              {selected && <Icon name="check" color={colors.accent} />}
            </Pressable>;
          })}
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  title: { fontSize: 21, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { marginTop: 4, fontSize: 12 },
  options: { gap: 10 },
  option: { minHeight: 66, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 13 },
  copy: { flex: 1, minWidth: 0 },
  label: { fontSize: 14, fontWeight: '600' },
  detail: { fontSize: 12, marginTop: 3 },
});
