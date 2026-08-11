import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgressProvider } from '@/lib/ProgressContext';
import { theme } from '@/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ProgressProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.color.bg },
            animation: 'slide_from_right',
          }}
        />
      </ProgressProvider>
    </SafeAreaProvider>
  );
}
