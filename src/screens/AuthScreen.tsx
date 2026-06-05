import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { StatusBanner } from '../components/StatusBanner';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { colors } from '../utils/theme';

const isProductionApp = process.env.EXPO_PUBLIC_APP_ENV === 'production';
const hasFirebaseAuth = Boolean(process.env.EXPO_PUBLIC_FIREBASE_API_KEY);

export function AuthScreen() {
  const { signIn } = useAuth();
  const [name, setName] = useState(isProductionApp ? '' : 'Ahmed Khan');
  const [phoneOrEmail, setPhoneOrEmail] = useState(isProductionApp ? '' : 'demo@wheaty.app');
  const [password, setPassword] = useState(isProductionApp ? '' : 'wheaty-demo');
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      await signIn(name, phoneOrEmail, password, language);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message.replaceAll('_', ' ') : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.brand}>Wheaty</Text>
        <Text style={styles.title}>Digital agronomist for wheat farmers</Text>
        <Text style={styles.subtitle}>Image, voice, chat, farm memory, and planning in one mobile workflow.</Text>
      </View>

      <View style={styles.form}>
        <StatusBanner
          tone={hasFirebaseAuth ? 'success' : isProductionApp ? 'danger' : 'info'}
          icon={hasFirebaseAuth ? 'shield-checkmark' : isProductionApp ? 'alert-circle' : 'phone-portrait'}
          text={
            hasFirebaseAuth
              ? 'Firebase Authentication is enabled.'
              : isProductionApp
                ? 'Firebase Authentication is required for production sign-in.'
                : 'Demo login is active until Firebase env vars are configured.'
          }
        />
        {error ? <StatusBanner tone="danger" icon="alert-circle" text={error} /> : null}
        <TextInput value={name} onChangeText={setName} placeholder="Farmer name" style={styles.input} />
        <TextInput
          value={phoneOrEmail}
          onChangeText={setPhoneOrEmail}
          placeholder="Phone or email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />

        <View style={styles.segment}>
          <Button label="English" onPress={() => setLanguage('en')} variant={language === 'en' ? 'primary' : 'secondary'} />
          <Button label="Urdu" onPress={() => setLanguage('ur')} variant={language === 'ur' ? 'primary' : 'secondary'} />
        </View>

        {loading ? <ActivityIndicator color={colors.leafDark} /> : <Button label="Continue" icon="arrow-forward" onPress={submit} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 28,
    gap: 10,
  },
  brand: {
    color: colors.leafDark,
    fontSize: 42,
    fontWeight: '900',
  },
  title: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 31,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  form: {
    gap: 12,
    marginTop: 18,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
  },
  segment: {
    flexDirection: 'row',
    gap: 10,
  },
});
