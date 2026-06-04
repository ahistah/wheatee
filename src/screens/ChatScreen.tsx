import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { MessageBubble } from '../components/MessageBubble';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { askWheaty, saveRecord } from '../services/api';
import { HistoryRecord, RootStackParamList } from '../types';
import { colors } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ChatMessage = {
  role: 'farmer' | 'wheaty';
  text: string;
};

export function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { farmProfile } = useFarm();
  const [text, setText] = useState('How can I increase wheat yield on my farm?');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'wheaty', text: 'Send a question about wheat health, yield, planning, or records.' },
  ]);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!user || !text.trim()) return;
    const input = text.trim();
    setText('');
    setMessages((current) => [...current, { role: 'farmer', text: input }]);
    setLoading(true);

    try {
      const result = await askWheaty({ text: input, userId: user.userId, farmProfile });
      const response = `${result.response}\n\n${result.actionItems.map((item) => `- ${item}`).join('\n')}`;
      setMessages((current) => [...current, { role: 'wheaty', text: response }]);

      const record: HistoryRecord = {
        id: `record-${Date.now()}`,
        userId: user.userId,
        type: result.intent === 'FARM_PLANNING' ? 'plan' : 'conversation',
        input,
        response,
        intent: result.intent,
        timestamp: new Date().toISOString(),
      };
      await saveRecord(record);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll={false}>
        <Button label="Back" icon="chevron-back" variant="ghost" onPress={() => navigation.goBack()} style={styles.back} />
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
