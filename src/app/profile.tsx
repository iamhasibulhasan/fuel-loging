import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { close } from '../components/FormParts';
import { Select } from '../components/Select';
import { Avatar, Button, Card, DateField, Field, Icon, Screen, SectionTitle } from '../components/ui';
import { deletePhoto, pickProfilePhoto } from '../lib/photo';
import { useStore } from '../lib/store';
import { colors } from '../lib/theme';
import type { Profile } from '../lib/types';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// digits with optional leading +, spaces or dashes; 7-15 digits total
const validPhone = (p: string) => /^\+?[\d\s-]+$/.test(p) && p.replace(/\D/g, '').length >= 7 && p.replace(/\D/g, '').length <= 15;

function SheetRow({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, opacity: pressed ? 0.6 : 1 })}
    >
      <Icon name={icon} size={24} color={danger ? colors.danger : colors.primary} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: danger ? colors.danger : colors.text }}>{label}</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { data, saveProfile } = useStore();
  const [p, setP] = useState<Profile>(data.profile);
  const [errors, setErrors] = useState<Partial<Record<keyof Profile, string>>>({});

  const set = <K extends keyof Profile>(k: K) => (v: Profile[K]) => setP((cur) => ({ ...cur, [k]: v }));

  // Photo changes are saved immediately (the rest of the form waits for "Save profile").
  const [sheet, setSheet] = useState(false);
  const applyPhoto = (photo: string | null) => {
    const old = data.profile.photo;
    saveProfile({ ...data.profile, photo });
    setP((cur) => ({ ...cur, photo }));
    if (old && old !== photo) deletePhoto(old);
  };
  const changePhoto = async (source: 'camera' | 'library') => {
    setSheet(false);
    try {
      const name = await pickProfilePhoto(source);
      if (name) applyPhoto(name);
    } catch (e) {
      Alert.alert('Could not set photo', e instanceof Error ? e.message : String(e));
    }
  };
  const removePhoto = () => {
    setSheet(false);
    applyPhoto(null);
  };

  const save = () => {
    const e: Partial<Record<keyof Profile, string>> = {};
    const t = (s: string) => s.trim();
    if (!t(p.name)) e.name = 'Please enter your name';
    if (t(p.phone) && !validPhone(t(p.phone))) e.phone = 'Enter a valid phone number, e.g. +8801712345678';
    if (t(p.email) && !EMAIL_RE.test(t(p.email))) e.email = 'Enter a valid email, e.g. name@gmail.com';
    if (t(p.emergencyPhone) && !validPhone(t(p.emergencyPhone))) e.emergencyPhone = 'Enter a valid phone number';
    setErrors(e);
    if (Object.keys(e).length) return;
    saveProfile({
      ...p,
      name: t(p.name),
      phone: t(p.phone),
      email: t(p.email).toLowerCase(),
      occupation: t(p.occupation),
      address: t(p.address),
      city: t(p.city),
      licenseNo: t(p.licenseNo),
      emergencyName: t(p.emergencyName),
      emergencyPhone: t(p.emergencyPhone),
    });
    close();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'My Profile' }} />

      <View style={{ alignItems: 'center', marginVertical: 12, gap: 6 }}>
        <Pressable onPress={() => setSheet(true)}>
          <Avatar name={p.name} photo={p.photo} size={104} />
          <View
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: colors.primary,
              borderWidth: 3,
              borderColor: colors.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="camera" size={16} color="#fff" />
          </View>
        </Pressable>
        <Pressable onPress={() => setSheet(true)} hitSlop={8}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{p.photo ? 'Change photo' : 'Add photo'}</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{p.name.trim() || 'Your name'}</Text>
        {p.occupation.trim() ? <Text style={{ color: colors.sub }}>{p.occupation.trim()}</Text> : null}
      </View>

      <SectionTitle>Personal</SectionTitle>
      <Card>
        <Field label="Full name *" value={p.name} onChangeText={set('name')} placeholder="e.g. Md. Rahim Uddin" autoCapitalize="words" textContentType="name" autoComplete="name" error={errors.name} />
        <Field label="Occupation (optional)" value={p.occupation} onChangeText={set('occupation')} placeholder="e.g. Businessman, Engineer" autoCapitalize="words" />
      </Card>

      <SectionTitle>Contact</SectionTitle>
      <Card>
        <Field
          label="Mobile number"
          value={p.phone}
          onChangeText={set('phone')}
          placeholder="+880 1XXX-XXXXXX"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          error={errors.phone}
        />
        <Field
          label="Email (Gmail etc.)"
          value={p.email}
          onChangeText={set('email')}
          placeholder="yourname@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          autoComplete="email"
          error={errors.email}
        />
        <Field label="Address (optional)" value={p.address} onChangeText={set('address')} placeholder="House, road, area" multiline />
        <Field label="City (optional)" value={p.city} onChangeText={set('city')} placeholder="e.g. Dhaka" autoCapitalize="words" />
      </Card>

      <SectionTitle>Driving licence</SectionTitle>
      <Card>
        <Field label="Licence number (optional)" value={p.licenseNo} onChangeText={set('licenseNo')} placeholder="e.g. DK0123456CL0001" autoCapitalize="characters" />
        <DateField
          label="Licence expiry date"
          value={p.licenseExpiry ?? ''}
          onChange={(d) => set('licenseExpiry')(d)}
          onClear={() => set('licenseExpiry')(null)}
        />
        <Text style={{ color: colors.faint, fontSize: 12, marginTop: -8 }}>You&apos;ll get a reminder on the dashboard 30 days before it expires.</Text>
      </Card>

      <SectionTitle>Emergency</SectionTitle>
      <Card>
        <Select
          label="Blood group (optional)"
          searchable={false}
          placeholder="Not set"
          options={[{ key: '-', label: 'Not set' }, ...BLOOD_GROUPS.map((b) => ({ key: b, label: b }))]}
          value={p.bloodGroup || '-'}
          onChange={(b) => set('bloodGroup')(b === '-' ? '' : b)}
        />
        <Field label="Emergency contact name" value={p.emergencyName} onChangeText={set('emergencyName')} placeholder="e.g. Father, Spouse" autoCapitalize="words" />
        <Field
          label="Emergency contact phone"
          value={p.emergencyPhone}
          onChangeText={set('emergencyPhone')}
          placeholder="+880 1XXX-XXXXXX"
          keyboardType="phone-pad"
          error={errors.emergencyPhone}
        />
      </Card>

      <Button title="Save profile" icon="check" onPress={save} />
      <Text style={{ color: colors.faint, fontSize: 12, textAlign: 'center', marginTop: 10 }}>
        Your profile is stored only on this phone and included in your backups.
      </Text>

      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
        <Pressable onPress={() => setSheet(false)} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: 28 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 14 }} />
            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 }}>Profile photo</Text>
            <SheetRow icon="camera-outline" label="Take photo" onPress={() => changePhoto('camera')} />
            <SheetRow icon="image-outline" label="Choose from gallery" onPress={() => changePhoto('library')} />
            {p.photo ? <SheetRow icon="delete-outline" label="Remove photo" danger onPress={removePhoto} /> : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
