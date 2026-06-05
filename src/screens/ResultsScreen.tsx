import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, StyleSheet, Text } from 'react-native';

import { Button } from '../components/Button';
import { InfoCard } from '../components/InfoCard';
import { IntentBadge } from '../components/IntentBadge';
import { Screen } from '../components/Screen';
import { StatusBanner } from '../components/StatusBanner';
import { RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export function ResultsScreen({ navigation, route }: Props) {
  const { title, record } = route.params;
  const imageSource = displayableImageUri(record.imageDisplayURL) ?? displayableImageUri(record.imageUri) ?? displayableImageUri(record.imageURL);

  return (
    <Screen>
      <Button label="Back home" icon="home" variant="ghost" onPress={() => navigation.navigate('MainTabs')} style={styles.back} />
      <Text style={styles.title}>{title}</Text>
      <IntentBadge intent={record.intent} />
      {record.backendMode ? (
        <StatusBanner
          tone={record.backendMode === 'remote' ? 'success' : 'info'}
          icon={record.backendMode === 'remote' ? 'cloud-done' : 'phone-portrait'}
          text={record.backendMode === 'remote' ? 'Response saved from deployed backend.' : 'Response generated in local demo mode and saved to farm memory.'}
        />
      ) : null}
      {record.imageURL ? <StatusBanner tone="success" icon="cloud-done" text="Crop image stored with the deployed backend." /> : null}
      {imageSource ? <Image source={{ uri: imageSource }} style={styles.image} /> : null}
      <InfoCard title={record.intent.replace('_', ' ')} subtitle={new Date(record.timestamp).toLocaleString()} icon="sparkles">
        <Text style={styles.input}>{record.input}</Text>
        <Text style={styles.response}>{record.response}</Text>
      </InfoCard>
      {record.confidence ? (
        <InfoCard title="Confidence score" icon="analytics">
          <Text style={styles.confidence}>{Math.round(record.confidence * 100)}%</Text>
        </InfoCard>
      ) : null}
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
  confidence: {
    color: colors.leafDark,
    fontSize: 32,
    fontWeight: '900',
  },
});

function displayableImageUri(uri?: string) {
  if (!uri) return undefined;
  return /^(https?:|file:|content:)/.test(uri) ? uri : undefined;
}
