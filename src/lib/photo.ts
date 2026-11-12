import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

// Profile pictures live in the app's document directory (persistent, private).
// Only the file name is stored in app data; a new name per change avoids stale image caches.

export const photoUri = (name: string | null | undefined) => (name ? new File(Paths.document, name).uri : null);

export function deletePhoto(name: string | null | undefined) {
  if (!name) return;
  try {
    const f = new File(Paths.document, name);
    if (f.exists) f.delete();
  } catch (e) {
    console.warn('Could not delete photo', e);
  }
}

const newName = () => `profile-${Date.now()}.jpg`;

/** Opens the camera or gallery with a square crop. Returns the stored file name, or null if cancelled. */
export async function pickProfilePhoto(source: 'camera' | 'library'): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    shape: 'oval',
    quality: 0.6,
  };
  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('Camera permission is needed to take a photo. You can allow it in phone Settings → Apps → Fuel Burn.');
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }
  if (result.canceled || !result.assets?.length) return null;

  const name = newName();
  await new File(result.assets[0].uri).copy(new File(Paths.document, name));
  return name;
}

/** base64 of the stored photo, for including in backups */
export async function photoBase64(name: string | null | undefined): Promise<string | null> {
  if (!name) return null;
  const f = new File(Paths.document, name);
  return f.exists ? f.base64() : null;
}

/** writes a photo from a backup and returns its new file name */
export async function restorePhoto(base64: string): Promise<string> {
  const name = newName();
  const f = new File(Paths.document, name);
  f.create({ overwrite: true });
  await f.write(base64, { encoding: 'base64' });
  return name;
}
