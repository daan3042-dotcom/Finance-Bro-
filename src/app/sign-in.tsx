import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { toUserMessage } from '../lib/networkError';
import { supabase } from '../lib/supabase';

type Mode = 'sign-in' | 'sign-up';

export default function SignInScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const isSignUp = mode === 'sign-up';

  const handleSubmit = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Vul een e-mailadres en wachtwoord in.');
      return;
    }

    if (isSignUp && !consentGiven) {
      setErrorMessage('Geef toestemming voor het verwerken van je gegevens om een account aan te maken.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { consent_given: consentGiven } },
        });
        if (error) {
          setErrorMessage(toUserMessage(error));
          return;
        }
        if (!data.session) {
          setInfoMessage(
            'Account aangemaakt. Check je e-mail om je adres te bevestigen, en log daarna in.'
          );
          setMode('sign-in');
        }
        // Als er wel meteen een sessie is (bevestiging staat uit), logt de
        // gebruiker automatisch in via de auth-state-listener in _layout.
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setErrorMessage(toUserMessage(error));
        }
        // Bij succes ververst de sessie automatisch en stuurt de root-layout
        // door naar het modules-overzicht.
      }
    } catch (error) {
      // Een echte netwerkfout (geen verbinding, time-out) komt hier terecht
      // in plaats van als { error } terug te komen.
      setErrorMessage(toUserMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Finance Bro</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Maak een account aan' : 'Log in om verder te leren'}
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>E-mailadres</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="naam@voorbeeld.nl"
            placeholderTextColor="#9AA1B9"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Wachtwoord</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType={isSignUp ? 'newPassword' : 'password'}
            placeholder="••••••••"
            placeholderTextColor="#9AA1B9"
          />
        </View>

        {isSignUp && (
          <Pressable
            style={styles.consentRow}
            onPress={() => setConsentGiven((value) => !value)}
          >
            <View style={[styles.checkbox, consentGiven && styles.checkboxChecked]}>
              {consentGiven && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              Ik geef toestemming voor het verwerken van mijn gegevens om mijn voortgang op te
              slaan.
            </Text>
          </Pressable>
        )}

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {infoMessage && <Text style={styles.infoText}>{infoMessage}</Text>}

        <Pressable
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isSignUp ? 'Account aanmaken' : 'Inloggen'}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.toggleButton}
          onPress={() => {
            setMode(isSignUp ? 'sign-in' : 'sign-up');
            setErrorMessage(null);
            setInfoMessage(null);
            setConsentGiven(false);
          }}
        >
          <Text style={styles.toggleButtonText}>
            {isSignUp ? 'Al een account? Log in' : 'Nog geen account? Registreer'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1F36',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7190',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C4257',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E6F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1F36',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#E2E6F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#3B4FD9',
    borderColor: '#3B4FD9',
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#3C4257',
  },
  errorText: {
    color: '#B92B2B',
    fontSize: 14,
    marginBottom: 12,
  },
  infoText: {
    color: '#1E7B3B',
    fontSize: 14,
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#3B4FD9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleButton: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#3B4FD9',
    fontSize: 14,
    fontWeight: '600',
  },
});
