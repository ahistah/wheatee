import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { farmProfile } = useFarm();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>Ask Wheaty</Text>
        <Text style={styles.title}>Good field decisions, saved to farm memory.</Text>
        <Text style={styles.subtitle}>
          {farmProfile
            ? `${farmProfile.farmSize} in ${farmProfile.location || 'Pakistan'} - ${farmProfile.cropTypes.join(', ')}`
            : `Welcome, ${user?.name}. Add a farm profile for contextual advice.`}
        </Text>
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
});
