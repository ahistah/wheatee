import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../utils/theme';

type StatusBannerProps = {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function StatusBanner({ tone = 'info', text, icon = 'information-circle' }: StatusBannerProps) {
  return (
    <View style={[styles.banner, styles[tone]]}>
      <Ionicons name={icon} size={18} color={tone === 'danger' ? colors.danger : colors.leafDark} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
  },
  info: {
    backgroundColor: '#eaf3f7',
    borderColor: '#c7dfe9',
  },
  success: {
    backgroundColor: colors.field,
    borderColor: '#c8dfbc',
  },
  warning: {
    backgroundColor: '#fff4d8',
    borderColor: '#ead28f',
  },
  danger: {
    backgroundColor: '#f7e2dd',
    borderColor: '#efbeb4',
  },
  text: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});
