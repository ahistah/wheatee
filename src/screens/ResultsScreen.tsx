import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, StyleSheet, Text } from 'react-native';

import { Button } from '../components/Button';
import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export function ResultsScreen({ navigation, route }: Props) {
  const { title, record } = route.params;

  return (
    <Screen>
      <Button label="Back home" icon="home" variant="ghost" onPress={() => navigation.navigate('MainTabs')} style={styles.back} />
      <Text style={styles.title}>{title}</Text>
      {record.imageUri ? <Image source={{ uri: record.imageUri }} style={styles.image} /> : null}
      <InfoCard title={record.intent.replace('_', ' ')} subtitle={new Date(record.timestamp).toLocaleString()} icon="sparkles">
        <Text style={styles.input}>{record.input}</Text>
        <Text style={styles.response}>{record.response}</Text>
      </InfoCard>
      <Button label="View history" icon="time" onPress={() => navigation.navigate('MainTabs', { screen: 'History' })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
  },
  input: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  response: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22,
  },
});
