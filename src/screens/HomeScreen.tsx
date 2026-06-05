import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { StatusBanner } from '../components/StatusBanner';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { getBackendStatus } from '../services/api';
import { BackendStatus, RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { error: farmError, farmProfile } = useFarm();
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const mappedArea = farmProfile?.areaKanal ? `${farmProfile.areaKanal.toFixed(1)} kanal mapped` : null;

  useFocusEffect(
    useCallback(() => {
      getBackendStatus().then(setBackendStatus);
    }, []),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>Ask Wheaty</Text>
        <Text style={styles.title}>Good field decisions, saved to farm memory.</Text>
        <Text style={styles.subtitle}>
          {farmProfile
            ? `${farmProfile.farmSize} in ${farmProfile.location || 'Pakistan'} - ${farmProfile.cropTypes.join(', ')}${mappedArea ? ` - ${mappedArea}` : ''}`
            : `Welcome, ${user?.name}. Add a farm profile for contextual advice.`}
        </Text>
      </View>

      {backendStatus ? (
        <StatusBanner
          tone={
            backendStatus.reachable
              ? backendStatus.mode === 'remote' && backendStatus.ready
                ? 'success'
                : backendStatus.missingConfig?.length
                  ? 'warning'
                  : 'info'
              : 'warning'
          }
          icon={backendStatus.mode === 'remote' ? 'cloud' : 'phone-portrait'}
          text={backendStatus.message}
        />
      ) : null}
      {farmError ? <StatusBanner tone="warning" icon="alert-circle" text={farmError} /> : null}

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{farmProfile?.areaKanal ? farmProfile.areaKanal.toFixed(1) : '5'}</Text>
          <Text style={styles.metricLabel}>{farmProfile?.areaKanal ? 'kanal mapped' : 'agent intents'}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>4</Text>
          <Text style={styles.metricLabel}>input modes</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>24/7</Text>
          <Text style={styles.metricLabel}>farm memory</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <InfoCard
          title="Chat"
          subtitle="Ask fertilizer, yield, disease, or planning questions."
          icon="chatbubbles"
          onPress={() => navigation.navigate('Chat')}
        />
        <InfoCard
          title="Camera"
          subtitle="Upload a crop image with optional field notes."
          icon="camera"
          onPress={() => navigation.navigate('Camera')}
        />
        <InfoCard
          title="Voice"
          subtitle="Record a spoken question for Urdu or English workflows."
          icon="mic"
          onPress={() => navigation.navigate('Voice')}
        />
        <InfoCard
          title="Farm memory"
          subtitle="Review diagnoses, plans, and past agronomy advice."
          icon="folder-open"
          onPress={() => navigation.navigate('MainTabs', { screen: 'History' })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    paddingTop: 8,
  },
  kicker: {
    color: colors.wheat,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  grid: {
    gap: 12,
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    flex: 1,
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 10,
    justifyContent: 'center',
  },
  metricValue: {
    color: colors.leafDark,
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
});
