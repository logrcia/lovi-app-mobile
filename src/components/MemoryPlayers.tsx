import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

import { formatClock } from '../lib/media/memoryMedia';
import { alpha, COLORS, INK_WASH, RADIUS, SHADOWS, TEXT } from '../theme';

/*
 * Feed players are lazy: a card shows a static frame and only creates its native player the
 * first time it is tapped. A feed of twenty cards would otherwise open twenty network streams
 * just by scrolling past them.
 */

/* -------------------------------------------------------------------------- */
/* Video                                                                      */
/* -------------------------------------------------------------------------- */

interface VideoMemoryProps {
  uri: string;
  /** Formatted length, e.g. `'0:45'`, when it is known. */
  durationLabel?: string;
  title: string;
}

export const VideoMemory: React.FC<VideoMemoryProps> = ({ uri, durationLabel, title }) => {
  const [started, setStarted] = useState(false);

  if (started) {
    return (
      <View style={styles.videoFrame}>
        <ActiveVideo uri={uri} title={title} />
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => setStarted(true)}
      style={({ pressed }) => [styles.videoFrame, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Reproducir video: ${title}`}
    >
      <View style={styles.playButton}>
        <Ionicons name="play" size={20} color={COLORS.ink} style={styles.playIcon} />
      </View>
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>
          Video{durationLabel ? ` · ${durationLabel}` : ''}
        </Text>
      </View>
    </Pressable>
  );
};

const ActiveVideo: React.FC<{ uri: string; title: string }> = ({ uri, title }) => {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    instance.play();
  });

  // Back to the first frame when the clip ends, so the next play starts over instead of
  // sitting on the last frame.
  useEventListener(player, 'playToEnd', () => {
    player.pause();
    player.currentTime = 0;
  });

  return (
    <VideoView
      player={player}
      style={styles.videoFill}
      contentFit="contain"
      nativeControls
      accessibilityLabel={title}
    />
  );
};

/* -------------------------------------------------------------------------- */
/* Audio                                                                      */
/* -------------------------------------------------------------------------- */

const WAVE_HEIGHTS = [12, 20, 8, 16, 24, 12, 20, 8];

interface AudioMemoryProps {
  uri: string;
  durationLabel?: string;
  petName: string;
}

export const AudioMemory: React.FC<AudioMemoryProps> = ({ uri, durationLabel, petName }) => {
  const [started, setStarted] = useState(false);

  if (started) {
    return <ActiveAudio uri={uri} durationLabel={durationLabel} petName={petName} />;
  }

  return (
    <AudioRow
      petName={petName}
      playing={false}
      progress={0}
      clock={durationLabel ?? ''}
      onToggle={() => setStarted(true)}
    />
  );
};

const ActiveAudio: React.FC<AudioMemoryProps> = ({ uri, durationLabel, petName }) => {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  // Mounting this component is the user's first tap, so it starts playing right away.
  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true }).then(() => player.play());
  }, [player]);

  const toggle = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) {
      await player.seekTo(0);
    }
    player.play();
  };

  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
  const total = status.duration > 0 ? formatClock(status.duration) : durationLabel;
  const clock = status.currentTime > 0 && total ? `${formatClock(status.currentTime)} / ${total}` : (total ?? '');

  return (
    <AudioRow
      petName={petName}
      playing={status.playing}
      loading={!status.isLoaded}
      progress={progress}
      clock={clock}
      onToggle={() => void toggle()}
    />
  );
};

interface AudioRowProps {
  petName: string;
  playing: boolean;
  loading?: boolean;
  /** 0–1; the share of waveform bars painted as already heard. */
  progress: number;
  clock: string;
  onToggle: () => void;
}

const AudioRow: React.FC<AudioRowProps> = ({
  petName,
  playing,
  loading = false,
  progress,
  clock,
  onToggle,
}) => {
  const heardBars = Math.round(progress * WAVE_HEIGHTS.length);

  return (
    <View style={styles.audioFrame}>
      <View style={styles.audioLeft}>
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => [styles.audioButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pausar nota de audio' : 'Escuchar nota de audio'}
        >
          <Ionicons
            name={playing ? 'pause' : loading ? 'hourglass-outline' : 'play'}
            size={20}
            color={COLORS.butter}
            style={playing || loading ? undefined : styles.playIcon}
          />
        </Pressable>
        <View style={styles.audioText}>
          <Text style={styles.audioTitle} numberOfLines={1}>
            Nota de audio de {petName}
          </Text>
          <View style={styles.waveform}>
            {WAVE_HEIGHTS.map((height, index) => (
              <View
                key={`bar-${index}`}
                style={[
                  styles.waveBar,
                  {
                    height,
                    backgroundColor:
                      index < heardBars ? COLORS.fucsia : alpha(COLORS.ink, 0.35),
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.audioClock}>{clock}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },

  /* Video — same frame, play button and badge the card always drew. */
  /**
   * On web the view is a bare `<video>` element: offsets alone leave it at the clip's intrinsic
   * size (e.g. 1920 px wide), so the frame crops it to a zoomed-in corner. Explicit 100% sizes
   * make it fit the frame on every platform.
   */
  videoFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  videoFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.parchment,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  playIcon: {
    marginLeft: 2,
  },
  durationBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: alpha(COLORS.parchment, 0.15),
  },
  durationText: {
    fontFamily: TEXT.eyebrow.fontFamily,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: COLORS.parchment,
  },

  /* Audio */
  audioFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
  },
  audioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  audioButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.dock,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioText: {
    flexShrink: 1,
  },
  audioTitle: {
    fontFamily: TEXT.small.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  waveBar: {
    width: 3,
    borderRadius: RADIUS.pill,
  },
  audioClock: {
    fontFamily: TEXT.small.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: INK_WASH.soft,
  },
});
