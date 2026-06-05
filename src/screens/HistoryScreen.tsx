import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { InfoCard } from '../components/InfoCard';
import { IntentBadge } from '../components/IntentBadge';
import { Screen } from '../components/Screen';
import { StatusBanner } from '../components/StatusBanner';
import { useAuth } from '../context/AuthContext';
import { getHistory } from '../services/api';
import { HistoryRecord, Intent, RootStackParamList } from '../types';
import { colors } from '../utils/theme';

const filters: Array<Intent | 'ALL'> = ['ALL', 'DISEASE', 'YIELD_ADVICE', 'FARM_PLANNING', 'MEMORY_QUERY'];
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [filter, setFilter] = useState<Intent | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      setError(null);
      getHistory(user.userId)
        .then(setRecords)
        .catch(() => setError('Could not load farm memory. Try again from Home.'))
        .finally(() => setLoading(false));
    }, [user]),
  );

  const visible = filter === 'ALL' ? records : records.filter((record) => record.intent === filter);

  return (
    <Screen>
      <Text style={styles.title}>Farm memory</Text>
      <Text style={styles.subtitle}>Diagnoses, advice, planning outputs, and memory queries linked to this farmer profile.</Text>
      <View style={styles.filters}>
        {filters.map((item) => (
          <Button
            key={item}
            label={item === 'ALL' ? 'All' : item.split('_')[0]}
            variant={filter === item ? 'primary' : 'secondary'}
            onPress={() => setFilter(item)}
            style={styles.filterButton}
          />
        ))}
      </View>
      {error ? <StatusBanner tone="danger" icon="alert-circle" text={error} /> : null}
      {loading ? <ActivityIndicator color={colors.leafDark} /> : null}
      {!loading && visible.length ? (
        visible.map((record) => (
          <InfoCard
            key={record.id}
            title={record.intent.replace('_', ' ')}
            subtitle={new Date(record.timestamp).toLocaleString()}
            icon={record.type === 'diagnosis' ? 'leaf' : record.type === 'plan' ? 'map' : 'chatbubble'}
            onPress={() => navigation.navigate('HistoryDetail', { record })}
          >
            <IntentBadge intent={record.intent} />
            <Text style={styles.input}>{record.input}</Text>
            <Text numberOfLines={5} style={styles.response}>{record.response}</Text>
          </InfoCard>
        ))
      ) : null}
      {!loading && !visible.length ? (
        <InfoCard title="No records yet" subtitle="Ask a question or run a crop diagnosis to build farm history." icon="folder-open" />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    minHeight: 38,
  },
  input: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  response: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
});
