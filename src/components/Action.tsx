import { Pressable, StyleSheet, Text } from 'react-native';
import type { Palette } from '../theme/colors';

export function Action({ label, onPress, colors, primary = false, disabled = false }: {
  label: string; onPress: () => void; colors: Palette; primary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, { backgroundColor: primary ? colors.accent : colors.soft, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}>
    <Text style={[styles.label, { color: primary ? colors.paper : colors.accent }]}>{label}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ button: { minHeight: 44, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }, label: { fontSize: 14, fontWeight: '600' } });
