import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Palette } from '../theme/colors';
import { Icon, type IconName } from './Icon';

export function Action({ label, onPress, colors, primary = false, disabled = false, icon }: {
  label: string; onPress: () => void; colors: Palette; primary?: boolean; disabled?: boolean; icon?: IconName;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, { backgroundColor: primary ? colors.accent : colors.soft, opacity: disabled ? 0.42 : pressed ? 0.72 : 1 }]}>
    {icon && <Icon name={icon} color={primary ? colors.onAccent : colors.accent} />}
    <Text style={[styles.label, { color: primary ? colors.onAccent : colors.accent }]}>{label}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ button: { minHeight: 44, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, label: { fontSize: 14, fontWeight: '600' } });
