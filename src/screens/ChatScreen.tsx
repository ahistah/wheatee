import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { MessageBubble } from '../components/MessageBubble';
import { Screen } from '../components/Screen';
import { StatusBanner } from '../components/StatusBanner';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { askWheaty, buildAdviceRecord, saveRecord } from '../services/api';
import { RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const isProductionApp = process.env.EXPO_PUBLIC_APP_ENV === 'production';

type ChatMessage = {
  role: 'farmer' | 'wheaty';
  text: string;
};

export function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { farmProfile } = useFarm();
  const [text, setText] = useState(isProductionApp ? '' : 'How can I increase wheat yield on my farm?');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'wheaty', text: 'Send a question about wheat health, yield, planning, or records.' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!user || !text.trim()) return;
    const input = text.trim();
    setText('');
    setMessages((current) => [...current, { role: 'farmer', text: input }]);
    setLoading(true);
    setError(null);

    try {
      const result = await askWheaty({ text: input, userId: user.userId, farmProfile });
      const record = buildAdviceRecord(user.userId, input, result);
      setMessages((current) => [...current, { role: 'wheaty', text: record.response }]);
      await saveRecord(record);
    } catch {
      setError('Wheaty could not process that question. Check the backend URL or try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll={false}>
        <Button label="Back" icon="chevron-back" variant="ghost" onPress={() => navigation.goBack()} style={styles.back} />
        {error ? <StatusBanner tone="danger" icon="alert-circle" text={error} /> : null}
        <View style={styles.messages}>
          {messages.map((message, index) => (
            <MessageBubble key={`${message.role}-${index}`} role={message.role} text={message.text} />
          ))}
          {loading ? <ActivityIndicator color={colors.leafDark} /> : null}
        </View>
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Ask Wheaty..."
            multiline
            style={styles.input}
          />
          <View style={styles.suggestions}>
            {['Show previous diseases', 'Organize my 10 kanal farm', 'How much fertilizer for wheat?'].map((item) => (
              <Button key={item} label={item} variant="secondary" onPress={() => setText(item)} style={styles.suggestion} />
            ))}
          </View>
          <Button label="Send" icon="send" onPress={submit} disabled={loading || !text.trim()} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
  },
  messages: {
    flex: 1,
    gap: 10,
  },
  composer: {
    gap: 10,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestion: {
    minHeight: 36,
  },
  input: {
    minHeight: 82,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
