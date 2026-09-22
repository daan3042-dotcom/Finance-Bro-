import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

// Dun, niet-blokkerend bandje bovenin, zichtbaar zolang het toestel geen
// verbinding heeft. `isConnected` begint als `null` (nog onbekend) — pas
// bij een expliciete `false` tonen we de balk, anders flitst hij bij het
// opstarten even onterecht op.
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
  }, []);

  if (!isOffline) return null;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Text style={styles.text}>Je bent offline</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#3C4257',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 6,
  },
});
