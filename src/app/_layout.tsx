import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#F4F6FB' },
          headerTintColor: '#1A1F36',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#F4F6FB' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Finance Bro' }} />
        <Stack.Screen name="lesson/[conceptId]" options={{ title: 'Les' }} />
      </Stack>
    </>
  );
}
