import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import type { Palette } from '../theme/colors';

export type IconName = keyof typeof Feather.glyphMap;

export function Icon({ name, color, size = 18 }: { name: IconName; color: string; size?: number }) {
  return <Feather name={name} color={color} size={size} />;
}

export function IconButton({ icon, label, colors, onPress, disabled = false }: {
  icon: IconName; label: string; colors: Palette; onPress: () => void; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, { opacity: disabled ? 0.42 : pressed ? 0.65 : 1 }]}>
    <Icon name={icon} color={colors.muted} />
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
