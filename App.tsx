import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { FarmProvider } from './src/context/FarmContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FarmProvider>
          <RootNavigator />
          <StatusBar style="dark" />
        </FarmProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
