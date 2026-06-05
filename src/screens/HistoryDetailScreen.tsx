import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { InfoCard } from '../components/InfoCard';
import { IntentBadge } from '../components/IntentBadge';
import { Screen } from '../components/Screen';
import { StatusBanner } from '../components/StatusBanner';
import { RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'HistoryDetail'>;

export function HistoryDetailScreen({ navigation, route }: Props) {
  const { record } = route.params;
  const imageSource = displayableImageUri(record.imageDisplayURL) ?? displayableImageUri(record.imageUri) ?? displayableImageUri(record.imageURL);

  return (
    <Screen>
      <Button label="Back" icon="chevron-back" variant="ghost" onPress={() => navigation.goBack()} style={styles.back} />
      <View style={styles.header}>
        <IntentBadge intent={record.intent} />
        <Text style={styles.title}>{record.type === 'diagnosis' ? 'Diagnosis record' : record.type === 'plan' ? 'Farm plan' : 'Conversation'}</Text>
        <Text style={styles.date}>{new Date(record.timestamp).toLocaleString()}</Text>
      </View>

      {record.backendMode ? (
        <StatusBanner
          tone={record.backendMode === 'remote' ? 'success' : 'info'}
          icon={record.backendMode === 'remote' ? 'cloud-done' : 'phone-portrait'}
          text={record.backendMode === 'remote' ? 'Saved from backend response.' : 'Saved from local demo response.'}
        />
      ) : null}

      {record.imageURL ? <StatusBanner tone="success" icon="cloud-done" text="Crop image stored with the deployed backend." /> : null}
      {imageSource ? <Image source={{ uri: imageSource }} style={styles.image} /> : null}

      <InfoCard title="Farmer input" icon="person">
        <Text style={styles.copy}>{record.input}</Text>
      </InfoCard>

      <InfoCard title="Wheaty response" icon="sparkles">
        <Text style={styles.copy}>{record.response}</Text>
      </InfoCard>

      {record.confidence ? (
        <InfoCard title="Confidence" icon="analytics">
          <Text style={styles.metric}>{Math.round(record.confidence * 100)}%</Text>
        </InfoCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
  },
  header: {
    gap: 7,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  date: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    backgroundColor: colors.field,
  },
  copy: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22,
  },
  metric: {
    color: colors.leafDark,
    fontSize: 32,
    fontWeight: '900',
  },
});

function displayableImageUri(uri?: string) {
  if (!uri) return undefined;
  return /^(https?:|file:|content:)/.test(uri) ? uri : undefined;
}
