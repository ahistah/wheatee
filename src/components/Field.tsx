import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors } from '../utils/theme';

type FieldProps = TextInputProps & {
  label: string;
};

export function Field({ label, style, ...props }: FieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#8b958d" style={[styles.input, style]} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
  },
});
