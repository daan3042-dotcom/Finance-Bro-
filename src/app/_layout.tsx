import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { LoadErrorState } from '../components/LoadErrorState';
import { OfflineBanner } from '../components/OfflineBanner';
import { AuthProvider, useAuth } from '../lib/auth-context';

function RootNavigator() {
  const { session, isLoading, loadErrorMessage, retryLoadSession } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Laden…</Text>
      </View>
    );
  }

  if (loadErrorMessage) {
    return (
      <View style={styles.loadingContainer}>
        <LoadErrorState message={loadErrorMessage} onRetry={retryLoadSession} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <OfflineBanner />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6FB',
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7190',
  },
});
