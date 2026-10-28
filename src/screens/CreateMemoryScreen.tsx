import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

import { AspectImage } from '../components/AspectImage';
import { Sticker } from '../components/Sticker';
import type { NewMemoryDraft } from '../lib/repositories/memories';
import {
  alpha,
  COLORS,
  DOCK_CLEARANCE,
  FONTS,
  INK_WASH,
  RADIUS,
  SCREEN_PADDING,
  SHADOWS,
  TEXT,
} from '../theme';
import type { MediaType, Pet } from '../types';

interface CreateMemoryScreenProps {
  pet: Pet;
  availablePets: Pet[];
  onSave: (memory: NewMemoryDraft) => Promise<void>;
  onCancel: () => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface MediaOption {
  type: MediaType;
  label: string;
  icon: IoniconName;
  /** Video and audio need real capture — until then they are visibly unavailable. */
  available: boolean;
}

const MEDIA_OPTIONS: readonly MediaOption[] = [
  { type: 'image', label: 'Foto', icon: 'camera', available: true },
  { type: 'video', label: 'Video', icon: 'videocam', available: false },
  { type: 'audio', label: 'Audio', icon: 'mic', available: false },
  { type: 'text', label: 'Solo texto', icon: 'book', available: true },
];

const FALLBACK_TITLE = 'Recuerdo sin título';

interface PickedMedia {
  uri: string;
  mimeType: string | null;
}

/** The reference's `shadow-xs`, tuned for the parchment inputs. */
const INPUT_SHADOW: ViewStyle = {
  shadowColor: COLORS.ink,
  shadowOpacity: 0.05,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
};

/**
 * "Loviar un recuerdo" — the memory composer.
 * Editorial header, pet selector, media format squircle cards and a live
 * preview of the attached medium, all on the warm cream canvas.
 */
export const CreateMemoryScreen: React.FC<CreateMemoryScreenProps> = ({
  pet,
  availablePets,
  onSave,
  onCancel,
}) => {
  const [selectedPetId, setSelectedPetId] = useState(pet.id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedPetId(pet.id);
  }, [pet.id]);

  const pets = availablePets.length > 0 ? availablePets : [pet];
  const selectedPet = pets.find((candidate) => candidate.id === selectedPetId) ?? pet;
  const trimmedTitle = title.trim();
  const canSave = trimmedTitle.length > 0 && !saving;

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso de fotos', 'Necesitamos permiso para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset) setMedia({ uri: asset.uri, mimeType: asset.mimeType ?? null });
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso de cámara', 'Necesitamos permiso para usar la cámara.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset) setMedia({ uri: asset.uri, mimeType: asset.mimeType ?? null });
  };

  const handleSave = async () => {
    if (saving) return;

    if (mediaType === 'image' && !media) {
      Alert.alert('Falta la foto', 'Elegí una foto para este recuerdo, o cambiá a «Solo texto».');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        petId: selectedPet.id,
        title: trimmedTitle || FALLBACK_TITLE,
        description: description.trim() || undefined,
        mediaType,
        mediaLocalUri: media?.uri,
        mediaMimeType: media?.mimeType ?? null,
      });
    } catch (unknownError) {
      Alert.alert(
        'No pudimos guardar el recuerdo',
        unknownError instanceof Error ? unknownError.message : 'Probá de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header: recipient sticker + exit */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sticker variant="butter" rotation="none">
            Para: {selectedPet.name}
          </Sticker>
          <Text style={styles.headerEyebrow} numberOfLines={1}>
            Nuevo Lovi
          </Text>
        </View>

        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Cancelar y volver"
        >
          <Text style={styles.cancelLabel}>Cancelar</Text>
        </Pressable>
      </View>

      {/* Intro */}
      <View style={styles.intro}>
        <Text style={styles.heading}>Loviar un recuerdo</Text>
        <Text style={styles.introCopy}>
          Guardá un momento especial para atesorar en su diario. Puede ser una anécdota, una foto o
          solo palabras.
        </Text>
      </View>

      <View style={styles.form}>
        {/* Pet selector */}
        {pets.length > 1 ? (
          <View>
            <Text style={styles.label}>Mascota de este recuerdo</Text>
            <View style={styles.petGrid}>
              {pets.map((candidate) => {
                const isSelected = selectedPet.id === candidate.id;

                return (
                  <Pressable
                    key={candidate.id}
                    onPress={() => setSelectedPetId(candidate.id)}
                    style={({ pressed }) => [
                      styles.petCard,
                      isSelected ? styles.petCardSelected : styles.petCardIdle,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Elegir a ${candidate.name}`}
                  >
                    <Image source={candidate.avatar} style={styles.petAvatar} />
                    <View style={styles.petText}>
                      <Text
                        style={[styles.petName, isSelected ? styles.petNameSelected : null]}
                        numberOfLines={1}
                      >
                        {candidate.name}
                      </Text>
                      <Text
                        style={[styles.petMeta, isSelected ? styles.petMetaSelected : null]}
                        numberOfLines={1}
                      >
                        {candidate.species} · {candidate.age}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Media format */}
        <View>
          <Text style={styles.label}>Formato del recuerdo</Text>
          <View style={styles.mediaRow}>
            {MEDIA_OPTIONS.map(({ type, label, icon, available }) => {
              const isSelected = mediaType === type;

              return (
                <Pressable
                  key={type}
                  onPress={() => setMediaType(type)}
                  disabled={!available}
                  style={({ pressed }) => [
                    styles.mediaChip,
                    isSelected ? styles.mediaChipSelected : styles.mediaChipIdle,
                    !available && styles.mediaChipDisabled,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: !available }}
                  accessibilityLabel={
                    available ? `Formato ${label}` : `Formato ${label}, todavía no disponible`
                  }
                >
                  <Ionicons
                    name={icon}
                    size={20}
                    color={isSelected ? COLORS.butter : INK_WASH.medium}
                  />
                  <Text
                    style={[
                      styles.mediaChipLabel,
                      isSelected ? styles.mediaChipLabelSelected : styles.mediaChipLabelIdle,
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.mediaHint}>Video y audio llegan más adelante.</Text>
        </View>

        {/* Medium: the real photo that will be uploaded */}
        {mediaType === 'image' ? (
          <View style={styles.mediaCard}>
            <Text style={styles.mediaCardLabel}>Foto del recuerdo</Text>

            {media ? (
              <>
                <AspectImage
                  source={{ uri: media.uri }}
                  ratio={4 / 3}
                  style={styles.previewFrame}
                  accessibilityLabel="Foto elegida para el recuerdo"
                />

                <View style={styles.mediaActions}>
                  <Text style={styles.previewCaption}>Se sube al guardar el recuerdo.</Text>
                  <Pressable
                    onPress={() => void pickFromLibrary()}
                    accessibilityRole="button"
                    accessibilityLabel="Cambiar foto"
                  >
                    <Text style={styles.linkLabel}>Cambiar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setMedia(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Quitar foto"
                  >
                    <Text style={styles.linkMuted}>Quitar</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable
                onPress={() => void pickFromLibrary()}
                style={({ pressed }) => [styles.photoDrop, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Elegir una foto para el recuerdo"
              >
                <View style={styles.photoDropIcon}>
                  <Ionicons name="camera-outline" size={20} color={COLORS.fucsia} />
                </View>
                <Text style={styles.photoDropTitle}>Elegir una foto</Text>
                <Text style={styles.photoDropHint}>Desde la galería de tu celular</Text>
              </Pressable>
            )}

            <View style={styles.sourceRow}>
              <Pressable
                onPress={() => void pickFromLibrary()}
                style={({ pressed }) => [styles.sourceButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Elegir de la galería"
              >
                <Ionicons name="images-outline" size={13} color={COLORS.ink} />
                <Text style={styles.sourceLabel}>Galería</Text>
              </Pressable>

              <Pressable
                onPress={() => void pickFromCamera()}
                style={({ pressed }) => [styles.sourceButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Sacar una foto"
              >
                <Ionicons name="camera-outline" size={13} color={COLORS.ink} />
                <Text style={styles.sourceLabel}>Cámara</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Text-only callout */}
        {mediaType === 'text' ? (
          <View style={styles.textCallout}>
            <Ionicons name="sparkles" size={16} color={COLORS.fucsia} />
            <Text style={styles.textCalloutCopy}>
              Los Lovis puramente textuales tienen un estilo tipográfico especial con la marca
              editorial «solo palabras».
            </Text>
          </View>
        ) : null}

        {/* Title field (required) */}
        <View>
          <Text style={[styles.label, styles.labelStrong]}>
            Título <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Siesta con sol en el parquet, o carrera loca..."
            placeholderTextColor={INK_WASH.faint}
            style={styles.titleInput}
            selectionColor={COLORS.fucsia}
            accessibilityLabel="Título del recuerdo"
          />
        </View>

        {/* Description field (optional) */}
        <View>
          <Text style={styles.label}>
            Contame más{' '}
            <Text style={styles.optional}>(opcional)</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Escribí los detalles, los gestos graciosos o cómo te hizo sentir ese momento..."
            placeholderTextColor={INK_WASH.faint}
            style={styles.descriptionInput}
            multiline
            textAlignVertical="top"
            selectionColor={COLORS.fucsia}
            accessibilityLabel="Contame más sobre el recuerdo"
          />
        </View>

        {/* CTA */}
        <View style={styles.ctaWrapper}>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.cta,
              !canSave && styles.ctaIdle,
              pressed && canSave && styles.ctaPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Guardar recuerdo para ${selectedPet.name}`}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.ink} />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color={COLORS.ink} />
                <Text style={styles.ctaLabel} numberOfLines={1}>
                  Guardar recuerdo para {selectedPet.name}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: DOCK_CLEARANCE,
    gap: 20,
  },
  pressed: {
    opacity: 0.75,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: INK_WASH.hairline,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  headerEyebrow: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: alpha(COLORS.ink, 0.5),
    flexShrink: 1,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  cancelLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: alpha(COLORS.ink, 0.6),
  },

  /* Intro */
  intro: {
    gap: 4,
  },
  heading: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
    fontWeight: '300',
    color: COLORS.ink,
  },
  introCopy: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 18,
    color: alpha(COLORS.ink, 0.7),
  },

  /* Form shell */
  form: {
    gap: 16,
    paddingTop: 4,
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: alpha(COLORS.ink, 0.7),
    marginBottom: 8,
  },
  labelStrong: {
    color: COLORS.ink,
    marginBottom: 6,
  },
  required: {
    color: COLORS.fucsia,
  },
  optional: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0,
    textTransform: 'lowercase',
    color: alpha(COLORS.ink, 0.4),
  },

  /* Pet selector */
  petGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  petCard: {
    flexBasis: '45%',
    flexGrow: 1,
    maxWidth: '48.6%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 2,
  },
  petCardIdle: {
    backgroundColor: COLORS.parchment,
    borderColor: alpha(COLORS.ink, 0.05),
  },
  petCardSelected: {
    backgroundColor: COLORS.dock,
    borderColor: COLORS.fucsia,
    ...SHADOWS.soft,
  },
  petAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
  },
  petText: {
    flex: 1,
    minWidth: 0,
  },
  petName: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: COLORS.ink,
  },
  petNameSelected: {
    color: COLORS.parchment,
  },
  petMeta: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: alpha(COLORS.ink, 0.5),
  },
  petMetaSelected: {
    color: COLORS.butter,
  },

  /* Media format chips */
  mediaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mediaChip: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: RADIUS.md,
  },
  mediaChipIdle: {
    backgroundColor: COLORS.parchment,
  },
  mediaChipSelected: {
    backgroundColor: COLORS.dock,
    transform: [{ scale: 1.02 }],
    ...SHADOWS.soft,
  },
  mediaChipDisabled: {
    opacity: 0.35,
  },
  mediaChipLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
  },
  mediaChipLabelSelected: {
    color: COLORS.butter,
    fontWeight: '600',
  },
  mediaChipLabelIdle: {
    color: INK_WASH.medium,
  },
  mediaHint: {
    marginTop: 6,
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    color: INK_WASH.faint,
  },
  mediaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  linkLabel: {
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
  photoDrop: {
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
  photoDropIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(COLORS.fucsia, 0.1),
    marginBottom: 4,
  },
  photoDropTitle: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  photoDropHint: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: INK_WASH.faint,
  },
  sourceRow: {
    flexDirection: 'row',
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

  /* Image / video preview */
  mediaCard: {
    backgroundColor: COLORS.parchment,
    borderRadius: RADIUS.xl,
    padding: 12,
    gap: 8,
    ...SHADOWS.card,
  },
  mediaCardLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: alpha(COLORS.ink, 0.6),
  },
  previewFrame: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: alpha(COLORS.ink, 0.05),
  },
  videoBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.navy,
  },
  videoBadgeText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.parchment,
  },
  previewCaption: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    fontStyle: 'italic',
    color: alpha(COLORS.ink, 0.5),
    textAlign: 'center',
  },

  /* Audio preview */
  audioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: COLORS.parchment,
    borderRadius: RADIUS.xl,
    ...SHADOWS.card,
  },
  audioIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dock,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioCopy: {
    flex: 1,
  },
  audioTitle: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: COLORS.ink,
  },
  audioMeta: {
    marginTop: 2,
    fontFamily: FONTS.mono,
    fontSize: 10,
    lineHeight: 14,
    color: alpha(COLORS.ink, 0.5),
  },

  /* Text-only callout */
  textCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
  },
  textCalloutCopy: {
    flex: 1,
    fontFamily: FONTS.serif,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    color: INK_WASH.strong,
  },

  /* Inputs */
  titleInput: {
    backgroundColor: COLORS.parchment,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: alpha(COLORS.ink, 0.06),
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink,
    ...INPUT_SHADOW,
  },
  descriptionInput: {
    backgroundColor: COLORS.parchment,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: alpha(COLORS.ink, 0.06),
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 80,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.ink,
    ...INPUT_SHADOW,
  },

  /* CTA */
  ctaWrapper: {
    paddingTop: 8,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.orange,
    ...SHADOWS.orangeGlow,
  },
  ctaIdle: {
    opacity: 0.4,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaLabel: {
    ...TEXT.eyebrowStrong,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.1,
    color: COLORS.ink,
  },
});
