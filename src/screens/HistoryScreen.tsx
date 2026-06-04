import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { getHistory } from '../services/api';
import { HistoryRecord, Intent } from '../types';
import { colors } from '../utils/theme';

const filters: Array<Intent | 'ALL'> = ['ALL', 'DISEASE', 'YIELD_ADVICE', 'FARM_PLANNING', 'MEMORY_QUERY'];

export function HistoryScreen() {
  const { user } = useAuth();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [filter, setFilter] = useState<Intent | 'ALL'>('ALL');

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      getHistory(user.userId).then(setRecords);
    }, [user]),
  );

  const visible = filter === 'ALL' ? records : records.filter((record) => record.intent === filter);

  return (
    <Screen>
      <Text style={styles.title}>Farm memory</Text>
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
      {visible.length ? (
        visible.map((record) => (
          <InfoCard
            key={record.id}
            title={record.intent.replace('_', ' ')}
            subtitle={new Date(record.timestamp).toLocaleString()}
            icon={record.type === 'diagnosis' ? 'leaf' : record.type === 'plan' ? 'map' : 'chatbubble'}
          >
            <Text style={styles.input}>{record.input}</Text>
            <Text numberOfLines={5} style={styles.response}>{record.response}</Text>
          </InfoCard>
        ))
      ) : (
        <InfoCard title="No records yet" subtitle="Ask a question or run a crop diagnosis to build farm history." icon="folder-open" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
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
