import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../utils/theme';

export function MessageBubble({ role, text }: { role: 'farmer' | 'wheatee'; text: string }) {
  const isFarmer = role === 'farmer';
  return (
    <View style={[styles.bubble, isFarmer ? styles.farmer : styles.wheatee]}>
      <Text style={[styles.text, isFarmer && styles.farmerText]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '88%',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  farmer: {
    alignSelf: 'flex-end',
    backgroundColor: colors.leafDark,
  },
  wheatee: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  text: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
  },
  farmerText: {
    color: '#fff',
  },
});
