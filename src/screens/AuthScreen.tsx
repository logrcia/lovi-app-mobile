import React, { useState } from 'react';
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

import { Sticker } from '../components/Sticker';
import { signInWithPassword, signUpWithPassword } from '../lib/auth/actions';
import {
  alpha,
  CARD_SURFACE,
  COLORS,
  FONTS,
  INK_WASH,
  RADIUS,
  SCREEN_PADDING,
  SHADOWS,
  TEXT,
} from '../theme';

type Mode = 'signin' | 'signup';

/** Supabase talks in English; the app answers in Spanish. */
function readableError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (normalized.includes('already registered')) return 'Ese email ya tiene cuenta. Probá entrar.';
  if (normalized.includes('email not confirmed')) return 'Falta confirmar tu email antes de entrar.';
  if (normalized.includes('password should be at least'))
    return 'La contraseña necesita al menos 6 caracteres.';
  if (normalized.includes('unable to validate email')) return 'Ese email no parece válido.';
  if (normalized.includes('network')) return 'No hay conexión. Revisá tu red.';

  return message;
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType = 'default',
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={INK_WASH.faint}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
};

/** Editorial sign in / sign up. The app shell only mounts once a session exists. */
export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const submit = async () => {
    if (busy) return;

    setError(null);
    setNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      setError('Escribí un email válido.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña necesita al menos 6 caracteres.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Contanos cómo te llamás.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithPassword(cleanEmail, password);
      } else {
        const result = await signUpWithPassword(cleanEmail, password, name);
        if (result.needsEmailConfirmation) {
          setNotice('Te mandamos un email para confirmar la cuenta.');
        }
      }
    } catch (unknownError) {
      setError(
        unknownError instanceof Error
          ? readableError(unknownError.message)
          : 'No pudimos entrar. Probá de nuevo.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Sticker variant="butter" rotation="none">
            tu diario social
          </Sticker>
          <Text style={styles.brand}>Lovi</Text>
          <Text style={styles.lead}>
            Guardá cada siesta, salto y rayito de sol de tus mascotas.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            {(
              [
                { key: 'signin', label: 'Entrar' },
                { key: 'signup', label: 'Crear cuenta' },
              ] as const
            ).map((tab) => {
              const active = mode === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => switchMode(tab.key)}
                  style={[styles.tab, active && styles.tabActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {mode === 'signup' ? (
            <Field label="Tu nombre" value={name} onChangeText={setName} placeholder="Abril Morales" />
          ) : null}

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="vos@ejemplo.com"
            keyboardType="email-address"
          />

          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Al menos 6 caracteres"
            secure
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [
              styles.submit,
              busy && styles.submitBusy,
              pressed && !busy && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator color={COLORS.parchment} />
            ) : (
              <Text style={styles.submitLabel}>
                {mode === 'signin' ? 'Entrar' : 'Crear mi cuenta'}
              </Text>
            )}
          </Pressable>

          <Text style={styles.footnote}>
            {mode === 'signin'
              ? 'Todavía no tenés cuenta? Tocá «Crear cuenta».'
              : 'Tu diario arranca vacío: después vas a poder sumar a tus mascotas.'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 40,
    gap: 28,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    ...TEXT.display,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1,
  },
  lead: {
    ...TEXT.body,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    ...CARD_SURFACE,
    padding: 20,
    borderRadius: RADIUS.xxl,
    gap: 14,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: alpha(COLORS.ink, 0.04),
    borderRadius: RADIUS.pill,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.parchment,
    ...SHADOWS.soft,
  },
  tabLabel: {
    ...TEXT.small,
    fontFamily: FONTS.sans,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.ink,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    ...TEXT.eyebrow,
  },
  input: {
    ...TEXT.body,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
    backgroundColor: COLORS.parchment,
    color: COLORS.ink,
  },
  inputFocused: {
    borderColor: alpha(COLORS.fucsia, 0.45),
  },
  error: {
    ...TEXT.small,
    color: COLORS.fucsia,
    fontWeight: '600',
  },
  notice: {
    ...TEXT.small,
    color: COLORS.navy,
    fontWeight: '600',
  },
  submit: {
    marginTop: 4,
    backgroundColor: COLORS.fucsia,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...SHADOWS.fucsiaGlow,
  },
  submitBusy: {
    opacity: 0.75,
  },
  submitLabel: {
    ...TEXT.body,
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.parchment,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  footnote: {
    ...TEXT.small,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
});
