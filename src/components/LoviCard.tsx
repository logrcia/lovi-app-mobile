import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { alpha, COLORS, INK_WASH, RADIUS, SHADOWS, TEXT } from '../theme';
import type { LoviMemory, Pet } from '../types';
import { AspectImage } from './AspectImage';
import { Sticker } from './Sticker';

interface LoviCardProps {
  memory: LoviMemory;
  pet: Pet;
  onPetClick: (petId: string) => void;
  onFollowToggle?: (petId: string) => void;
}

const AUDIO_BARS = [
  { height: 12, color: alpha(COLORS.ink, 0.3) },
  { height: 20, color: alpha(COLORS.ink, 0.6) },
  { height: 8, color: alpha(COLORS.ink, 0.3) },
  { height: 16, color: alpha(COLORS.ink, 0.8) },
  { height: 24, color: COLORS.fucsia },
  { height: 12, color: alpha(COLORS.ink, 0.5) },
  { height: 20, color: alpha(COLORS.ink, 0.7) },
  { height: 8, color: alpha(COLORS.ink, 0.3) },
];

/** Editorial scrapbook card: one memory, its author pet and its social actions. */
export const LoviCard: React.FC<LoviCardProps> = ({ memory, pet, onPetClick, onFollowToggle }) => {
  const [liked, setLiked] = React.useState(false);

  return (
    <View style={styles.card}>
      {/* Author */}
      <View style={styles.header}>
        <Pressable
          onPress={() => onPetClick(pet.id)}
          style={({ pressed }) => [styles.author, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${pet.name}`}
        >
          <View style={styles.avatarWrap}>
            <Image source={pet.avatar} style={styles.avatar} />
            {pet.isMine ? (
              <View style={styles.ownBadge}>
                <Text style={styles.ownBadgeText}>★</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.authorText}>
            <View style={styles.nameRow}>
              <Text style={styles.petName} numberOfLines={1}>
                {pet.name}
              </Text>
              <View style={styles.speciesPill}>
                <Text style={styles.speciesText}>{pet.species}</Text>
              </View>
            </View>
            <Text style={styles.ownerLine} numberOfLines={1}>
              su dueño <Text style={styles.ownerName}>{pet.owner.name}</Text>
            </Text>
          </View>
        </Pressable>

        <View style={styles.actionSlot}>
          {pet.isMine ? (
            <Sticker variant="butter">Tu mascota</Sticker>
          ) : (
            <Pressable
              onPress={() => onFollowToggle?.(pet.id)}
              style={({ pressed }) => [
                styles.followButton,
                pet.isFollowing ? styles.followingButton : styles.notFollowingButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${pet.isFollowing ? 'Dejar de seguir' : 'Seguir'} a ${pet.name}`}
            >
              <Text
                style={[
                  styles.followLabel,
                  pet.isFollowing ? styles.followingLabel : styles.notFollowingLabel,
                ]}
              >
                {pet.isFollowing ? 'Siguiendo' : 'Seguir'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Recommendation notice */}
      {memory.isRecommendation && !pet.isMine && !pet.isFollowing ? (
        <View style={styles.recommendation}>
          <View style={styles.recommendationLeft}>
            <Ionicons name="sparkles" size={14} color={COLORS.fucsia} />
            <Text style={styles.recommendationText}>De cuentas que no seguís</Text>
          </View>
          <Text style={styles.recommendationTag}>Recomendado</Text>
        </View>
      ) : null}

      {/* Media */}
      {memory.mediaType === 'image' && memory.mediaUrl ? (
        <AspectImage
          source={memory.mediaUrl}
          ratio={4 / 3}
          style={styles.mediaFrame}
          accessibilityLabel={memory.title}
        />
      ) : null}

      {memory.mediaType === 'video' && memory.mediaUrl ? (
        <AspectImage
          source={memory.mediaUrl}
          ratio={4 / 3}
          style={styles.mediaFrame}
          accessibilityLabel={memory.title}
        >
          <View style={styles.videoOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={20} color={COLORS.ink} style={styles.playIcon} />
            </View>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>Video · {memory.videoDuration || '0:45'}</Text>
          </View>
        </AspectImage>
      ) : null}

      {memory.mediaType === 'audio' ? (
        <View style={styles.audioFrame}>
          <View style={styles.audioLeft}>
            <View style={styles.audioButton}>
              <Ionicons name="volume-high" size={20} color={COLORS.butter} />
            </View>
            <View>
              <Text style={styles.audioTitle}>Nota de audio de {pet.name}</Text>
              <View style={styles.waveform}>
                {AUDIO_BARS.map((bar, index) => (
                  <View
                    key={`bar-${index}`}
                    style={[styles.waveBar, { height: bar.height, backgroundColor: bar.color }]}
                  />
                ))}
              </View>
            </View>
          </View>
          <Text style={styles.audioDuration}>{memory.audioDuration || '0:30'}</Text>
        </View>
      ) : null}

      {memory.mediaType === 'text' ? (
        <View style={styles.quoteFrame}>
          <View style={styles.quoteTag}>
            <Text style={styles.quoteTagText}>solo palabras</Text>
          </View>
          <Text style={styles.quoteText}>“{memory.description}”</Text>
        </View>
      ) : null}

      {/* Copy */}
      <View style={styles.copy}>
        <Text style={styles.memoryTitle}>{memory.title}</Text>
        {memory.mediaType !== 'text' && memory.description ? (
          <Text style={styles.memoryDescription}>{memory.description}</Text>
        ) : null}
      </View>

      {/* Meta + actions */}
      <View style={styles.footer}>
        <Text style={styles.createdAt}>{memory.createdAt}</Text>

        <View style={styles.footerActions}>
          <Pressable
            onPress={() => setLiked((prev) => !prev)}
            style={({ pressed }) => [
              styles.likeButton,
              liked ? styles.likedButton : styles.unlikedButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: liked }}
            accessibilityLabel={liked ? 'Quitar me gusta' : 'Me gusta'}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={14}
              color={liked ? COLORS.fucsia : INK_WASH.medium}
            />
            <Text style={[styles.likeLabel, liked ? styles.likedLabel : styles.unlikedLabel]}>
              {liked ? 'Te gusta' : 'Me gusta'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Compartir recuerdo"
          >
            <Ionicons name="share-social-outline" size={15} color={INK_WASH.medium} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.parchment,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
    padding: 16,
    ...SHADOWS.card,
  },
  pressed: {
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarWrap: {
    width: 44,
    height: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    borderColor: COLORS.parchment,
    backgroundColor: COLORS.cream,
  },
  ownBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.butter,
    borderWidth: 2,
    borderColor: COLORS.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownBadgeText: {
    fontSize: 8,
    lineHeight: 9,
    color: COLORS.ink,
    fontWeight: '700',
  },
  authorText: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  petName: {
    fontFamily: TEXT.title.fontFamily,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: COLORS.ink,
    flexShrink: 1,
  },
  speciesPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
  },
  speciesText: {
    fontFamily: TEXT.eyebrow.fontFamily,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: INK_WASH.soft,
  },
  ownerLine: {
    ...TEXT.small,
    fontSize: 11,
    lineHeight: 15,
  },
  ownerName: {
    fontWeight: '600',
    color: COLORS.ink,
  },
  actionSlot: {
    flexShrink: 0,
  },
  followButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  followingButton: {
    backgroundColor: COLORS.cream,
  },
  notFollowingButton: {
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
  },
  followLabel: {
    fontFamily: TEXT.small.fontFamily,
    fontSize: 11,
    fontWeight: '600',
  },
  followingLabel: {
    color: INK_WASH.strong,
  },
  notFollowingLabel: {
    color: COLORS.parchment,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: alpha(COLORS.butter, 0.2),
    marginBottom: 14,
  },
  recommendationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  recommendationText: {
    ...TEXT.small,
    fontSize: 11,
    color: COLORS.ink,
    fontWeight: '500',
  },
  recommendationTag: {
    fontFamily: TEXT.eyebrow.fontFamily,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: INK_WASH.soft,
  },
  mediaFrame: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: alpha(COLORS.ink, 0.05),
    marginBottom: 14,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
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
    backgroundColor: COLORS.navy,
  },
  durationText: {
    fontFamily: TEXT.eyebrow.fontFamily,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: COLORS.parchment,
  },
  audioFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
    marginBottom: 14,
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
  audioDuration: {
    fontFamily: TEXT.small.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: INK_WASH.soft,
  },
  quoteFrame: {
    padding: 20,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    marginBottom: 14,
  },
  quoteTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.parchment,
    marginBottom: 8,
  },
  quoteTagText: {
    fontFamily: TEXT.title.fontFamily,
    fontSize: 10,
    fontStyle: 'italic',
    color: INK_WASH.strong,
  },
  quoteText: {
    fontFamily: TEXT.title.fontFamily,
    fontSize: 17,
    lineHeight: 25,
    fontStyle: 'italic',
    color: COLORS.ink,
    textAlign: 'center',
  },
  copy: {
    gap: 6,
  },
  memoryTitle: {
    fontFamily: TEXT.title.fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: COLORS.ink,
  },
  memoryDescription: {
    ...TEXT.body,
    color: INK_WASH.strong,
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: INK_WASH.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  createdAt: {
    fontFamily: TEXT.eyebrow.fontFamily,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: INK_WASH.faint,
    flexShrink: 1,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  likedButton: {
    backgroundColor: alpha(COLORS.fucsia, 0.1),
  },
  unlikedButton: {
    backgroundColor: COLORS.cream,
  },
  likeLabel: {
    fontFamily: TEXT.small.fontFamily,
    fontSize: 11,
  },
  likedLabel: {
    color: COLORS.fucsia,
    fontWeight: '600',
  },
  unlikedLabel: {
    color: INK_WASH.medium,
  },
  shareButton: {
    padding: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
  },
});
