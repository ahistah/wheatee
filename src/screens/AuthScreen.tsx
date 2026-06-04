import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { colors } from '../utils/theme';

export function AuthScreen() {
  const { signIn } = useAuth();
  const [name, setName] = useState('Ahmed Khan');
  const [phoneOrEmail, setPhoneOrEmail] = useState('demo@wheaty.app');
  const [language, setLanguage] = useState<Language>('en');

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.brand}>Wheaty</Text>
        <Text style={styles.title}>Digital agronomist for wheat farmers</Text>
        <Text style={styles.subtitle}>Image, voice, chat, farm memory, and planning in one mobile workflow.</Text>
      </View>

      <View style={styles.form}>
        <TextInput value={name} onChangeText={setName} placeholder="Farmer name" style={styles.input} />
        <TextInput
          value={phoneOrEmail}
          onChangeText={setPhoneOrEmail}
          placeholder="Phone or email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <View style={styles.segment}>
          <Button label="English" onPress={() => setLanguage('en')} variant={language === 'en' ? 'primary' : 'secondary'} />
          <Button label="Urdu" onPress={() => setLanguage('ur')} variant={language === 'ur' ? 'primary' : 'secondary'} />
        </View>

        <Button label="Continue" icon="arrow-forward" onPress={() => signIn(name, phoneOrEmail, language)} />
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
