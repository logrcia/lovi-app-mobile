/**
 * Formats the `pet-media` bucket accepts for video and audio memories.
 *
 * The bucket's `allowed_mime_types` is the real gatekeeper (see the initial schema migration):
 * anything outside this list is rejected at upload. Resolving the type here first lets the
 * composer refuse an unsupported file the moment it is picked, with a message in Spanish,
 * instead of after a long upload.
 */

/** The bucket's `file_size_limit` (50 MiB). */
export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

/** Longest clip the in-app camera records, in seconds. Keeps uploads well under the limit. */
export const MAX_CAMERA_VIDEO_SECONDS = 60;

export const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/wav': 'wav',
};

const VIDEO_BY_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
};

const AUDIO_BY_EXTENSION: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/mp4',
  wav: 'audio/wav',
};

/**
 * Platforms report the same container under several names. Each alias maps onto the one name
 * the bucket allows; `null` means the alias has no accepted equivalent.
 */
const MIME_ALIASES: Record<string, string> = {
  'video/x-m4v': 'video/mp4',
  'audio/m4a': 'audio/mp4',
  'audio/aac': 'audio/mp4',
  'audio/x-aac': 'audio/mp4',
  'audio/mp3': 'audio/mpeg',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/vnd.wave': 'audio/wav',
};

const ACCEPTED = new Set(Object.keys(EXTENSION_BY_MIME_TYPE));

export const extensionOf = (uriOrName: string): string => {
  const withoutQuery = uriOrName.split('?')[0];
  const lastDot = withoutQuery.lastIndexOf('.');
  return lastDot === -1 ? '' : withoutQuery.slice(lastDot + 1).toLowerCase();
};

/**
 * Returns the bucket mime type for a picked video or audio file, or `null` when the format is
 * not one the bucket stores. The reported mime type wins; the extension is the fallback, since
 * pickers and recorders do not always report one.
 */
export function resolveMediaMimeType(
  kind: 'video' | 'audio',
  source: { uri: string; name?: string | null; mimeType?: string | null }
): string | null {
  const reported = source.mimeType?.toLowerCase() ?? null;
  if (reported) {
    const canonical = MIME_ALIASES[reported] ?? reported;
    if (ACCEPTED.has(canonical) && canonical.startsWith(`${kind}/`)) return canonical;
  }

  const byExtension = kind === 'video' ? VIDEO_BY_EXTENSION : AUDIO_BY_EXTENSION;
  const extension = extensionOf(source.name || source.uri);
  return byExtension[extension] ?? null;
}

/** `125` → `'2:05'`. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}
