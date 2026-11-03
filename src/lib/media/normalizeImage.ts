import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface PickedImage {
  uri: string;
  mimeType: string | null;
}

/**
 * The `pet-media` bucket only accepts these three image types, so it is the real gatekeeper:
 * anything else is rejected at upload with a "mime type not supported" error.
 */
const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Longest side kept when re-encoding. A feed card never renders more than this. */
const MAX_DIMENSION = 2048;

const extensionOf = (uri: string): string => {
  const withoutQuery = uri.split('?')[0];
  const lastDot = withoutQuery.lastIndexOf('.');
  return lastDot === -1 ? '' : withoutQuery.slice(lastDot + 1).toLowerCase();
};

/**
 * The picker does not always report a mime type, so the extension is the fallback. Returning
 * `null` means "unknown", which is treated as unsafe and re-encoded rather than guessed.
 */
function resolveMimeType(source: PickedImage): string | null {
  if (source.mimeType) return source.mimeType.toLowerCase();

  switch (extensionOf(source.uri)) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
    case 'heif':
      return 'image/heic';
    default:
      return null;
  }
}

/**
 * iOS photos come out of the library as HEIC, which the bucket rejects, so a pick taken straight
 * from the gallery fails at upload with a format error. Accepted types pass through untouched;
 * everything else is re-encoded to JPEG, which also downsamples modern 48MP originals at decode
 * time and bakes in the EXIF orientation.
 */
export async function normalizePickedImage(source: PickedImage): Promise<PickedImage> {
  const mimeType = resolveMimeType(source);
  if (mimeType && ACCEPTED_MIME_TYPES.has(mimeType)) {
    return { uri: source.uri, mimeType };
  }

  try {
    const context = ImageManipulator.manipulate(source.uri, {
      maxWidth: MAX_DIMENSION,
      maxHeight: MAX_DIMENSION,
    });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
    return { uri: saved.uri, mimeType: 'image/jpeg' };
  } catch {
    throw new Error('No pudimos preparar esa foto. Probá con otra o sacala de nuevo con la cámara.');
  }
}
