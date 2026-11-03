import { File } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Reads the bytes of a file the picker handed us.
 *
 * `expo-file-system`'s `File` throws on web ("expo-file-system is not supported on web"), and
 * the browser picker returns an object or data URL instead of a path on disk. `fetch` resolves
 * both, so the web branch reads the same bytes the native branch gets from the filesystem.
 */
export async function readLocalAssetBytes(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('La foto no se pudo leer.');
    }
    return await response.arrayBuffer();
  }

  return await new File(uri).arrayBuffer();
}
