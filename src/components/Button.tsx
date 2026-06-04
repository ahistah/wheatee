import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors } from '../utils/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, icon, variant = 'primary', disabled, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={variant === 'primary' ? '#fff' : colors.ink} /> : null}
      <Text style={[styles.label, variant === 'primary' && styles.primaryLabel, disabled && styles.disabledLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: colors.leafDark,
  },
  secondary: {
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: '#f5ded9',
    borderWidth: 1,
    borderColor: '#ebbbb1',
  },
  label: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  primaryLabel: {
    color: '#fff',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledLabel: {
    color: colors.muted,
  },
  pressed: {
    opacity: 0.82,
  },
});
