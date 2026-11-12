import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../components/Logo';
import { FadeIn, PressableScale } from '../components/motion';
import { Button, Card, Field, Icon, Screen } from '../components/ui';
import { authErrorMessage, useAuth, type AccountInfo } from '../lib/auth';
import { useStore } from '../lib/store';
import { colors, copyright } from '../lib/theme';

type Mode = 'signIn' | 'signUp';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Login() {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const { data, saveProfile } = useStore();
  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState<null | 'email' | 'google' | 'guest'>(null);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  // fill empty profile fields from the account so the app greets the user by name
  const fillProfile = (acc: AccountInfo) => {
    const p = data.profile;
    if (p.name && p.email) return;
    saveProfile({ ...p, name: p.name || acc.name, email: p.email || acc.email });
  };

  const run = async (kind: 'email' | 'google' | 'guest', fn: () => Promise<AccountInfo | null | void>) => {
    setBusy(kind);
    try {
      const acc = await fn();
      if (acc) fillProfile(acc);
    } catch (e) {
      Alert.alert(kind === 'google' ? 'Google sign-in failed' : 'Could not sign in', authErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const submit = () => {
    const e: typeof errors = {};
    if (mode === 'signUp' && !name.trim()) e.name = 'Please enter your name';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email, e.g. name@gmail.com';
    if (password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    if (Object.keys(e).length) return;
    run('email', () => (mode === 'signIn' ? auth.signIn(email, password) : auth.signUp(name, email, password)));
  };

  const forgot = () => {
    if (!EMAIL_RE.test(email.trim())) {
      setErrors({ email: 'Enter your email above first' });
      return;
    }
    auth
      .resetPassword(email)
      .then(() => Alert.alert('Check your inbox', `We sent a password reset link to ${email.trim()}.`))
      .catch((e) => Alert.alert('Could not send reset email', authErrorMessage(e)));
  };

  const disabled = !auth.configured;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Screen>
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 18 }}>
          <Logo size={92} showName />
        </View>

        <FadeIn delay={900}>
          <Card style={{ padding: 16 }}>
            {/* sign in / sign up switch */}
            <View style={{ flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 12, padding: 3, marginBottom: 14 }}>
              {(['signIn', 'signUp'] as Mode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMode(m);
                    setErrors({});
                  }}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: mode === m ? colors.card : 'transparent' }}
                >
                  <Text style={{ fontWeight: '700', color: mode === m ? colors.text : colors.sub }}>{m === 'signIn' ? 'Sign in' : 'Create account'}</Text>
                </Pressable>
              ))}
            </View>

            {disabled ? (
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: colors.oilSoft, padding: 10, borderRadius: 10, marginBottom: 12 }}>
                <Icon name="information-outline" size={18} color={colors.oil} />
                <Text style={{ flex: 1, color: colors.oil, fontSize: 12 }}>
                  Account login isn’t set up in this build yet. You can use the app as a guest — your data stays on this phone.
                </Text>
              </View>
            ) : null}

            {mode === 'signUp' ? (
              <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" autoComplete="name" error={errors.name} editable={!disabled} />
            ) : null}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="yourname@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              error={errors.email}
              editable={!disabled}
            />
            <View>
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'signUp' ? 'At least 6 characters' : 'Your password'}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                error={errors.password}
                editable={!disabled}
                onSubmitEditing={submit}
              />
              <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={10} style={{ position: 'absolute', right: 12, top: 30 }}>
                <Icon name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.sub} />
              </Pressable>
            </View>

            {mode === 'signIn' ? (
              <Pressable onPress={forgot} disabled={disabled} style={{ alignSelf: 'flex-end', marginTop: -4, marginBottom: 12 }}>
                <Text style={{ color: disabled ? colors.faint : colors.primary, fontWeight: '600', fontSize: 13 }}>Forgot password?</Text>
              </Pressable>
            ) : null}

            {busy === 'email' ? (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <Button
                title={mode === 'signIn' ? 'Sign in' : 'Create account'}
                icon={mode === 'signIn' ? 'login' : 'account-plus'}
                onPress={submit}
                color={disabled ? colors.faint : colors.primary}
              />
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ color: colors.faint, fontSize: 12 }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            <PressableScale
              scaleTo={0.97}
              disabled={busy != null}
              onPress={() => run('google', auth.signInWithGoogle)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: 11,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.input,
                opacity: auth.googleAvailable ? 1 : 0.6,
              }}
            >
              {busy === 'google' ? <ActivityIndicator color={colors.primary} /> : <Icon name="google" size={20} color="#EA4335" />}
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>Continue with Google</Text>
            </PressableScale>
          </Card>
        </FadeIn>

        <FadeIn delay={1050}>
          <Pressable onPress={() => run('guest', auth.continueAsGuest)} style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ color: colors.sub }}>
              Just looking? <Text style={{ color: colors.primary, fontWeight: '800' }}>Continue as guest →</Text>
            </Text>
          </Pressable>
          <Text style={{ textAlign: 'center', color: colors.faint, fontSize: 11, marginTop: 8 }}>
            Your fuel, service and oil records are stored on this phone.
          </Text>
          <Text style={{ textAlign: 'center', color: colors.faint, fontSize: 11, marginTop: 4 }}>{copyright()}</Text>
        </FadeIn>
      </Screen>
    </View>
  );
}
