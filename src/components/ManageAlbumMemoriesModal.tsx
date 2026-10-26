import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { alpha, COLORS, FONTS, INK_WASH, RADIUS, SHADOWS } from '../theme';
import type { Album, LoviMemory, Pet } from '../types';
import { AppModal } from './AppModal';

interface ManageAlbumMemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: Album;
  pet: Pet;
  allPetMemories: LoviMemory[];
  onToggleMemoryInAlbum: (memoryId: string, addToAlbum: boolean) => void;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type TileTone = 'album' | 'available';

interface MemoryThumbProps {
  memory: LoviMemory;
  tone: TileTone;
}

/** Cover thumbnail for image memories, tinted icon tile for audio / video / text ones. */
const MemoryThumb: React.FC<MemoryThumbProps> = ({ memory, tone }) => {
  if (memory.mediaUrl) {
    return <Image source={memory.mediaUrl} style={styles.thumb} />;
  }

  const isAudio = memory.mediaType === 'audio';
  const isVideo = memory.mediaType === 'video';
  const icon: IconName = isAudio ? 'volume-high' : isVideo ? 'videocam' : 'document-text';
  const iconColor = isAudio
    ? COLORS.navy
    : isVideo
      ? COLORS.fucsia
      : tone === 'album'
        ? COLORS.fucsia
        : alpha(COLORS.ink, 0.7);

  return (
    <View
      style={[
        styles.thumbTile,
        tone === 'album' ? styles.thumbTileAlbum : styles.thumbTileAvailable,
      ]}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
  );
};

/**
 * "Add already-created memories to this album" flow. It never creates memories
 * and never navigates: every tap toggles membership through the parent.
 */
export const ManageAlbumMemoriesModal: React.FC<ManageAlbumMemoriesModalProps> = ({
  isOpen,
  onClose,
  album,
  pet,
  allPetMemories,
  onToggleMemoryInAlbum,
}) => {
  const inAlbumMemories = allPetMemories.filter((memory) => memory.albumId === album.id);
  const availableMemories = allPetMemories.filter((memory) => memory.albumId !== album.id);
  const hasMemories = allPetMemories.length > 0;

  return (
    <AppModal
      visible={isOpen}
      onClose={onClose}
      eyebrow="álbum"
      title={album.title}
      description={`Administrar recuerdos de ${pet.name} en esta colección`}
      accent={COLORS.fucsia}
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            Los cambios se guardan automáticamente en el álbum.
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.doneButton, pressed && styles.doneButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Listo, cerrar administración del álbum"
          >
            <Text style={styles.doneLabel}>Listo</Text>
          </Pressable>
        </View>
      }
    >
      {/* Album identity: cover + live counter */}
      <View style={styles.albumStrip}>
        <Image source={album.coverUrl} style={styles.albumCover} />
        <View style={styles.albumStripText}>
          <View style={styles.albumCounterPill}>
            <Text style={styles.albumCounterLabel}>{inAlbumMemories.length} en este álbum</Text>
          </View>
          <Text style={styles.albumStripCopy} numberOfLines={2}>
            {album.description ?? `Colección privada de ${pet.name}`}
          </Text>
        </View>
      </View>

      {!hasMemories ? (
        <View style={styles.emptyPetCard}>
          <View style={styles.emptyPetIcon}>
            <Ionicons name="image" size={20} color={alpha(COLORS.ink, 0.45)} />
          </View>
          <Text style={styles.emptyPetTitle}>Todavía no hay recuerdos de {pet.name}</Text>
          <Text style={styles.emptyPetCopy}>
            Cuando guardes su primer Lovi va a aparecer acá para sumarlo a este álbum.
          </Text>
        </View>
      ) : (
        <>
          {/* Section 1: already in this album */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDot, { backgroundColor: COLORS.fucsia }]} />
                <Text style={styles.sectionTitle}>En este álbum ({inAlbumMemories.length})</Text>
              </View>
              <Text style={styles.sectionHint}>Guardados actualmente</Text>
            </View>

            {inAlbumMemories.length === 0 ? (
              <View style={styles.sectionEmpty}>
                <Text style={styles.sectionEmptyQuote}>
                  Todavía no hay recuerdos agregados a este álbum.
                </Text>
                <Text style={styles.sectionEmptyCopy}>
                  Elegí de los recuerdos disponibles abajo para sumarlos con un toque.
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {inAlbumMemories.map((memory) => (
                  <View key={memory.id} style={styles.memberCard}>
                    <View style={styles.cardBody}>
                      <MemoryThumb memory={memory} tone="album" />
                      <View style={styles.cardText}>
                        <View style={styles.badgeRow}>
                          <View style={styles.inAlbumBadge}>
                            <Ionicons name="checkmark" size={9} color={COLORS.fucsia} />
                            <Text style={styles.inAlbumBadgeLabel}>En el álbum</Text>
                          </View>
                          <Text style={styles.metaText} numberOfLines={1}>
                            {memory.createdAt}
                          </Text>
                        </View>
                        <Text style={styles.memberTitle} numberOfLines={1}>
                          {memory.title}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => onToggleMemoryInAlbum(memory.id, false)}
                      style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar ${memory.title} del álbum`}
                    >
                      <Ionicons name="remove-circle" size={14} color={alpha(COLORS.ink, 0.7)} />
                      <Text style={styles.removeLabel}>Quitar</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Section 2: already-created memories available to link */}
          <View style={styles.availableSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDot, { backgroundColor: COLORS.butter }]} />
                <Text style={styles.sectionTitle}>
                  Recuerdos disponibles de {pet.name} ({availableMemories.length})
                </Text>
              </View>
              <Text style={styles.sectionHint}>Listos para vincular</Text>
            </View>

            {availableMemories.length === 0 ? (
              <View style={styles.sectionEmpty}>
                <Text style={styles.sectionEmptyQuote}>
                  ¡Todos los recuerdos de {pet.name} ya forman parte de este álbum!
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {availableMemories.map((memory) => {
                  const movesFromAnotherAlbum = Boolean(
                    memory.albumId && memory.albumId !== album.id
                  );

                  return (
                    <View key={memory.id} style={styles.availableCard}>
                      <View style={styles.availableRow}>
                        <View style={styles.cardBody}>
                          <MemoryThumb memory={memory} tone="available" />
                          <View style={styles.cardText}>
                            <Text style={styles.metaText} numberOfLines={1}>
                              {memory.createdAt}
                            </Text>
                            <Text style={styles.availableTitle} numberOfLines={1}>
                              {memory.title}
                            </Text>
                            {memory.description ? (
                              <Text style={styles.availableDescription} numberOfLines={1}>
                                {memory.description}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <Pressable
                          onPress={() => onToggleMemoryInAlbum(memory.id, true)}
                          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
                          accessibilityRole="button"
                          accessibilityLabel={`Agregar ${memory.title} a este álbum`}
                        >
                          <Ionicons name="add" size={14} color={COLORS.parchment} />
                          <Text style={styles.addLabel}>Agregar</Text>
                        </Pressable>
                      </View>

                      {movesFromAnotherAlbum ? (
                        <View style={styles.moveNote}>
                          <Ionicons
                            name="swap-horizontal"
                            size={10}
                            color={alpha(COLORS.ink, 0.55)}
                          />
                          <Text style={styles.moveNoteLabel} numberOfLines={2}>
                            Está en otro álbum · se moverá al agregarlo
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </>
      )}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  /* Album identity strip */
  albumStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
  },
  albumCover: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
  },
  albumStripText: {
    flex: 1,
    gap: 4,
  },
  albumCounterPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.parchment,
  },
  albumCounterLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: COLORS.fucsia,
  },
  albumStripCopy: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    color: INK_WASH.soft,
  },

  /* Sections */
  section: {
    gap: 10,
  },
  availableSection: {
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: INK_WASH.hairline,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.pill,
  },
  sectionTitle: {
    flexShrink: 1,
    fontFamily: FONTS.serif,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: COLORS.ink,
  },
  sectionHint: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: alpha(COLORS.ink, 0.5),
  },
  sectionEmpty: {
    gap: 4,
    padding: 16,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
  },
  sectionEmptyQuote: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    color: alpha(COLORS.ink, 0.7),
    textAlign: 'center',
  },
  sectionEmptyCopy: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    color: alpha(COLORS.ink, 0.5),
    textAlign: 'center',
  },

  /* Cards */
  cardList: {
    gap: 8,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.parchment,
    borderWidth: 1,
    borderColor: alpha(COLORS.fucsia, 0.25),
    ...SHADOWS.card,
  },
  availableCard: {
    gap: 8,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
  },
  thumbTile: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbTileAlbum: {
    backgroundColor: alpha(COLORS.butter, 0.2),
  },
  thumbTileAvailable: {
    backgroundColor: COLORS.parchment,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  inAlbumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    backgroundColor: alpha(COLORS.fucsia, 0.15),
  },
  inAlbumBadgeLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: COLORS.fucsia,
  },
  metaText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 13,
    color: alpha(COLORS.ink, 0.5),
  },
  memberTitle: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.ink,
  },
  availableTitle: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.ink,
  },
  availableDescription: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    color: alpha(COLORS.ink, 0.6),
  },
  moveNote: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.parchment,
  },
  moveNoteLabel: {
    flexShrink: 1,
    fontFamily: FONTS.sans,
    fontSize: 9,
    lineHeight: 12,
    color: alpha(COLORS.ink, 0.55),
  },

  /* Controls */
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
  },
  removeLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: alpha(COLORS.ink, 0.7),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
  },
  addLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.parchment,
  },

  /* Empty pet state */
  emptyPetCard: {
    alignItems: 'center',
    gap: 6,
    padding: 20,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
  },
  emptyPetIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(COLORS.butter, 0.25),
    marginBottom: 2,
  },
  emptyPetTitle: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: COLORS.ink,
    textAlign: 'center',
  },
  emptyPetCopy: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 16,
    color: INK_WASH.soft,
    textAlign: 'center',
  },

  /* Footer */
  footer: {
    gap: 10,
  },
  footerNote: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    color: alpha(COLORS.ink, 0.6),
  },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.dock,
    ...SHADOWS.darkGlow,
  },
  doneButtonPressed: {
    opacity: 0.85,
  },
  doneLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.parchment,
  },

  pressed: {
    opacity: 0.7,
  },
});
