import { StyleSheet, Text, View } from 'react-native';

import { Intent } from '../types';
import { colors } from '../utils/theme';

const labels: Record<Intent, string> = {
  DISEASE: 'Disease',
  YIELD_ADVICE: 'Yield',
  FARM_PLANNING: 'Planning',
  MEMORY_QUERY: 'Memory',
  GENERAL_AGRICULTURE: 'General',
};

export function IntentBadge({ intent }: { intent: Intent }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{labels[intent]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    color: colors.leafDark,
    fontSize: 12,
    fontWeight: '900',
  },
});
