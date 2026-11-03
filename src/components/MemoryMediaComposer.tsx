import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';

import { showMessage } from '../lib/feedback';
import {
  formatClock,
  MAX_CAMERA_VIDEO_SECONDS,
  MAX_MEDIA_BYTES,
  resolveMediaMimeType,
} from '../lib/media/memoryMedia';
import { alpha, COLORS, FONTS, INK_WASH, RADIUS, SHADOWS } from '../theme';

/** A video or audio file chosen in the composer, not uploaded yet. */
export interface PickedTimedMedia {
  uri: string;
  mimeType: string;
  /** Whole seconds; `null` until the file has been measured. */
  durationSeconds: number | null;
}

interface ComposerProps {
  value: PickedTimedMedia | null;
  onChange: (value: PickedTimedMedia | null) => void;
}

const TOO_HEAVY = 'El archivo pesa más de 50 MB. Probá con uno más corto.';

/**
 * Hands the audio session back to playback. Best effort: it runs on cleanup paths, where a
 * failure has nothing left to undo and must not surface as an unhandled rejection.
 */
const releaseMicrophone = () =>
  setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);

/* -------------------------------------------------------------------------- */
/* Video                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Picks a clip from the gallery or records one with the camera, and previews it with the
 * platform's own controls. The duration comes from the picker, which reports milliseconds.
 */
export const VideoComposer: React.FC<ComposerProps> = ({ value, onChange }) => {
  const accept = (asset: ImagePicker.ImagePickerAsset | undefined) => {
    if (!asset) return;

    const mimeType = resolveMediaMimeType('video', {
      uri: asset.uri,
      name: asset.fileName,
      mimeType: asset.mimeType,
    });
    if (!mimeType) {
      showMessage('Formato no soportado', 'Ese video no se puede subir. Probá con uno MP4 o MOV.');
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_MEDIA_BYTES) {
      showMessage('Video muy pesado', TOO_HEAVY);
      return;
    }

    onChange({
      uri: asset.uri,
      mimeType,
      durationSeconds: asset.duration ? Math.round(asset.duration / 1000) : null,
    });
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showMessage('Permiso de galería', 'Necesitamos permiso para acceder a tus videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] });
    if (result.canceled) return;
    accept(result.assets[0]);
  };

  const recordWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showMessage('Permiso de cámara', 'Necesitamos permiso para usar la cámara.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: MAX_CAMERA_VIDEO_SECONDS,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });
    if (result.canceled) return;
    accept(result.assets[0]);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Video del recuerdo</Text>

      {value ? (
        <>
          {/* Keyed by uri: a new clip gets a fresh player instead of reusing the old one. */}
          <VideoPreview key={value.uri} uri={value.uri} />
          <View style={styles.actions}>
            <Text style={styles.caption}>
              {value.durationSeconds !== null ? `${formatClock(value.durationSeconds)} · ` : ''}
              Se sube al guardar el recuerdo.
            </Text>
            <Pressable
              onPress={() => void pickFromLibrary()}
              accessibilityRole="button"
              accessibilityLabel="Cambiar video"
            >
              <Text style={styles.link}>Cambiar</Text>
            </Pressable>
            <Pressable
              onPress={() => onChange(null)}
              accessibilityRole="button"
              accessibilityLabel="Quitar video"
            >
              <Text style={styles.linkMuted}>Quitar</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Pressable
          onPress={() => void pickFromLibrary()}
          style={({ pressed }) => [styles.drop, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Elegir un video para el recuerdo"
        >
          <View style={styles.dropIcon}>
            <Ionicons name="videocam-outline" size={20} color={COLORS.fucsia} />
          </View>
          <Text style={styles.dropTitle}>Elegir un video</Text>
          <Text style={styles.dropHint}>MP4 o MOV, hasta 50 MB</Text>
        </Pressable>
      )}

      <View style={styles.sourceRow}>
        <SourceButton icon="images-outline" label="Galería" onPress={pickFromLibrary} />
        {Platform.OS !== 'web' ? (
          <SourceButton
            icon="videocam-outline"
            label={`Grabar (hasta ${MAX_CAMERA_VIDEO_SECONDS} s)`}
            onPress={recordWithCamera}
          />
        ) : null}
      </View>
    </View>
  );
};

const VideoPreview: React.FC<{ uri: string }> = ({ uri }) => {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });

  return (
    <View style={styles.videoFrame}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls
        accessibilityLabel="Video elegido para el recuerdo"
      />
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* Audio                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Records a voice note with the microphone, or picks an audio file. Recording is native only:
 * browsers record WebM, which the bucket does not accept, so on web only the file picker shows.
 */
export const AudioComposer: React.FC<ComposerProps> = ({ value, onChange }) => {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [starting, setStarting] = useState(false);
  const isRecording = recorderState.isRecording;
  const canRecord = Platform.OS !== 'web';

  // Leaving the screen mid-recording must hand the audio session back to playback, otherwise
  // iOS keeps routing every later sound through the quiet earpiece.
  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecording;
  useEffect(
    () => () => {
      if (isRecordingRef.current) {
        void releaseMicrophone();
      }
    },
    []
  );

  const startRecording = async () => {
    if (starting || isRecording) return;
    setStarting(true);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        showMessage('Permiso de micrófono', 'Necesitamos permiso para grabar con el micrófono.');
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      showMessage('No pudimos grabar', 'Probá de nuevo en un momento.');
      await releaseMicrophone();
    } finally {
      setStarting(false);
    }
  };

  const stopRecording = async () => {
    const durationMillis = recorder.getStatus().durationMillis;
    try {
      await recorder.stop();
    } catch {
      showMessage('No pudimos guardar la grabación', 'Probá grabar de nuevo.');
      return;
    } finally {
      await releaseMicrophone();
    }

    if (!recorder.uri) {
      showMessage('No pudimos guardar la grabación', 'Probá grabar de nuevo.');
      return;
    }
    if (durationMillis < 1000) {
      showMessage('Grabación muy corta', 'Mantené la grabación al menos un segundo.');
      return;
    }

    onChange({
      uri: recorder.uri,
      // Both platforms record AAC inside an MPEG-4 container (`.m4a`) with this preset.
      mimeType: 'audio/mp4',
      durationSeconds: Math.round(durationMillis / 1000),
    });
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    const mimeType = resolveMediaMimeType('audio', asset);
    if (!mimeType) {
      showMessage('Formato no soportado', 'Ese audio no se puede subir. Probá con MP3, M4A o WAV.');
      return;
    }
    if (asset.size && asset.size > MAX_MEDIA_BYTES) {
      showMessage('Audio muy pesado', TOO_HEAVY);
      return;
    }

    // The picker does not know the length; the preview player measures it once loaded.
    onChange({ uri: asset.uri, mimeType, durationSeconds: null });
  };

  if (isRecording) {
    return (
      <View style={[styles.card, styles.recordingCard]}>
        <Text style={styles.cardLabel}>Grabando nota de audio</Text>
        <View style={styles.recordingRow}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingClock}>
            {formatClock(recorderState.durationMillis / 1000)}
          </Text>
        </View>
        <Pressable
          onPress={() => void stopRecording()}
          style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Terminar la grabación"
        >
          <Ionicons name="stop" size={16} color={COLORS.parchment} />
          <Text style={styles.stopLabel}>Terminar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Audio del recuerdo</Text>

      {value ? (
        <>
          <AudioPreview
            key={value.uri}
            uri={value.uri}
            durationSeconds={value.durationSeconds}
            onMeasured={(seconds) => onChange({ ...value, durationSeconds: seconds })}
          />
          <View style={styles.actions}>
            <Text style={styles.caption}>Se sube al guardar el recuerdo.</Text>
            <Pressable
              onPress={() => onChange(null)}
              accessibilityRole="button"
              accessibilityLabel="Quitar audio"
            >
              <Text style={styles.linkMuted}>Quitar</Text>
            </Pressable>
          </View>
        </>
      ) : canRecord ? (
        <Pressable
          onPress={() => void startRecording()}
          disabled={starting}
          style={({ pressed }) => [styles.drop, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Grabar una nota de audio"
        >
          <View style={styles.dropIcon}>
            <Ionicons name="mic-outline" size={20} color={COLORS.fucsia} />
          </View>
          <Text style={styles.dropTitle}>Grabar una nota de audio</Text>
          <Text style={styles.dropHint}>Tocá para empezar a grabar</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => void pickFile()}
          style={({ pressed }) => [styles.drop, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Elegir un archivo de audio"
        >
          <View style={styles.dropIcon}>
            <Ionicons name="musical-notes-outline" size={20} color={COLORS.fucsia} />
          </View>
          <Text style={styles.dropTitle}>Elegir un audio</Text>
          <Text style={styles.dropHint}>MP3, M4A o WAV, hasta 50 MB</Text>
        </Pressable>
      )}

      <View style={styles.sourceRow}>
        {canRecord ? (
          <SourceButton
            icon="mic-outline"
            label={value ? 'Grabar de nuevo' : 'Grabar'}
            onPress={startRecording}
          />
        ) : null}
        <SourceButton icon="folder-open-outline" label="Elegir archivo" onPress={pickFile} />
      </View>
    </View>
  );
};

interface AudioPreviewProps {
  uri: string;
  durationSeconds: number | null;
  onMeasured: (seconds: number) => void;
}

const AudioPreview: React.FC<AudioPreviewProps> = ({ uri, durationSeconds, onMeasured }) => {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const total = durationSeconds ?? (status.duration > 0 ? Math.round(status.duration) : null);

  useEffect(() => {
    if (durationSeconds === null && status.isLoaded && status.duration > 0) {
      onMeasured(Math.round(status.duration));
    }
  }, [durationSeconds, onMeasured, status.duration, status.isLoaded]);

  const toggle = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) {
      await player.seekTo(0);
    }
    await setAudioModeAsync({ playsInSilentMode: true });
    player.play();
  };

  return (
    <View style={styles.audioRow}>
      <Pressable
        onPress={() => void toggle()}
        style={({ pressed }) => [styles.audioButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pausar audio' : 'Escuchar audio'}
      >
        <Ionicons name={status.playing ? 'pause' : 'play'} size={18} color={COLORS.butter} />
      </Pressable>
      <Text style={styles.audioClock}>
        {formatClock(status.currentTime)}
        {total !== null ? ` / ${formatClock(total)}` : ''}
      </Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SourceButton: React.FC<{
  icon: IoniconName;
  label: string;
  onPress: () => void | Promise<void>;
}> = ({ icon, label, onPress }) => (
  <Pressable
    onPress={() => void onPress()}
    style={({ pressed }) => [styles.sourceButton, pressed && styles.pressed]}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Ionicons name={icon} size={13} color={COLORS.ink} />
    <Text style={styles.sourceLabel}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  card: {
    backgroundColor: COLORS.parchment,
    borderRadius: RADIUS.xl,
    padding: 12,
    gap: 8,
    ...SHADOWS.card,
  },
  cardLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: alpha(COLORS.ink, 0.6),
  },
  drop: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 26,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: alpha(COLORS.fucsia, 0.35),
    backgroundColor: alpha(COLORS.fucsia, 0.04),
  },
  dropIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(COLORS.fucsia, 0.1),
    marginBottom: 4,
  },
  dropTitle: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  dropHint: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: INK_WASH.faint,
  },
  sourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
  },
  sourceLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  caption: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    fontStyle: 'italic',
    color: alpha(COLORS.ink, 0.5),
    textAlign: 'center',
  },
  link: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.fucsia,
  },
  linkMuted: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: INK_WASH.medium,
  },

  /* Video */
  videoFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.navy,
  },

  /* Audio */
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
  },
  audioButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dock,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioClock: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: alpha(COLORS.ink, 0.7),
  },
  recordingCard: {
    alignItems: 'center',
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.fucsia,
  },
  recordingClock: {
    fontFamily: FONTS.mono,
    fontSize: 28,
    color: COLORS.ink,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.dock,
  },
  stopLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.parchment,
  },
});
