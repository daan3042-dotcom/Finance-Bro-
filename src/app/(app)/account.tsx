import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';

import { deleteAccount } from '../../lib/account';
import { useAuth } from '../../lib/auth-context';
import { toUserMessage } from '../../lib/networkError';
import { supabase } from '../../lib/supabase';

const CONFIRM_WORD = 'VERWIJDER';

export default function AccountScreen() {
  const { session } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  const handleDelete = async () => {
    setErrorMessage(null);
    setIsDeleting(true);
    try {
      await deleteAccount();
      Alert.alert(
        'Account verwijderd',
        'Je account en alle bijbehorende gegevens zijn permanent verwijderd.',
        [{ text: 'OK', onPress: () => void supabase.auth.signOut() }]
      );
    } catch (error) {
      setErrorMessage(toUserMessage(error));
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Account' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {session?.user.email && (
          <Text style={styles.sessionEmail}>Ingelogd als {session.user.email}</Text>
        )}

        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Account verwijderen</Text>
          <Text style={styles.dangerText}>
            Dit verwijdert je account en al je voortgang definitief. Dit kan niet ongedaan
            worden gemaakt.
          </Text>
          {/*
            TODO (C4 — betaalmuur): zodra er een betaald abonnement bestaat, moet
            de gebruiker hier vóór verwijdering gewaarschuwd worden dat een lopend
            Apple-abonnement niet automatisch stopt en zelf via Apple opgezegd
            moet worden.
          */}

          <Text style={styles.confirmLabel}>Typ {CONFIRM_WORD} om te bevestigen</Text>
          <TextInput
            style={styles.confirmInput}
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={CONFIRM_WORD}
            placeholderTextColor="#9AA1B9"
            editable={!isDeleting}
          />

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <Pressable
            style={[
              styles.deleteButton,
              (!canDelete || isDeleting) && styles.deleteButtonDisabled,
            ]}
            onPress={handleDelete}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteButtonText}>Account definitief verwijderen</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sessionEmail: {
    fontSize: 13,
    color: '#6B7190',
    marginBottom: 24,
  },
  dangerSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FCEAEA',
    padding: 18,
  },
  dangerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3C4257',
    marginBottom: 16,
  },
  confirmLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C4257',
    marginBottom: 6,
  },
  confirmInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E6F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1F36',
    marginBottom: 16,
  },
  errorText: {
    color: '#B92B2B',
    fontSize: 14,
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: '#E14343',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
