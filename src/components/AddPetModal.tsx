import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

import { normalizePickedImage } from '../lib/media/normalizeImage';
import { formatAge, parseBirthday } from '../lib/pets/age';
import { alpha, COLORS, FONTS, INK_WASH, RADIUS, SHADOWS } from '../theme';
import type { LoviImage, Pet } from '../types';
import { AppModal } from './AppModal';

/** What the sheet hands over: the display pet plus the local file to upload. */
export interface NewPetDraft
  extends Omit<Pet, 'id' | 'followersCount' | 'isMine' | 'owner' | 'avatar'> {
  /** `YYYY-MM-DD` typed by the owner. Required: the form will not submit without it. */
  birthday: string;
  /** The pet's current avatar when editing, or the chosen one when creating. */
  avatar?: LoviImage;
  /** Local `file://` uri chosen with the picker; uploaded once the row exists. */
  avatarLocalUri?: string;
  avatarMimeType?: string | null;
}

interface AddPetModalProps {
  isOpen: boolean;
  /** When present the sheet edits that pet instead of creating a new one. */
  pet?: Pet | null;
  onClose: () => void;
  onSavePet: (pet: NewPetDraft) => Promise<void>;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const SPECIES: ReadonlyArray<Pet['species']> = ['perro', 'gato', 'conejo', 'ave', 'otro'];

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  autoFocus?: boolean;
  icon?: IconName;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Small muted line under the input, for guidance the label cannot carry. */
  hint?: string;
}

/** Label + input pair with its own focus tracking, so the hairline turns fucsia on focus. */
const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  multiline = false,
  autoFocus = false,
  icon,
  autoCapitalize = multiline ? 'sentences' : 'words',
  hint,
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        {icon ? <Ionicons name={icon} size={13} color={COLORS.orange} /> : null}
        <Text style={styles.label}>
          {label}
          {required ? ' *' : ''}
        </Text>
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={INK_WASH.faint}
        selectionColor={COLORS.fucsia}
        autoFocus={autoFocus}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          focused && styles.inputFocused,
        ]}
      />

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};

interface PickedPhoto {
  uri: string;
  mimeType: string | null;
}

/**
 * "Agregar nueva mascota" and "Editar mascota" in one sheet: with a `pet` it edits those fields,
 * without one it creates a new pet. The photo is uploaded after the row exists; the sheet stays
 * open and reports the error if that fails, so nothing is ever saved half-way.
 */
export const AddPetModal: React.FC<AddPetModalProps> = ({
  isOpen,
  pet = null,
  onClose,
  onSavePet,
}) => {
  const [name, setName] = React.useState('');
  const [species, setSpecies] = React.useState<Pet['species']>('perro');
  const [birthday, setBirthday] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [photo, setPhoto] = React.useState<PickedPhoto | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const isEditing = Boolean(pet);

  // One effect for both modes: it prefills from the pet being edited, or resets to the blanks
  // that creating needs. `pet` is in the deps because the parent can open the sheet on a
  // different pet without closing it first.
  React.useEffect(() => {
    if (!isOpen) return;

    setName(pet?.name ?? '');
    setSpecies(pet?.species ?? 'perro');
    setBirthday(pet?.birthday ?? '');
    setBio(pet?.bio ?? '');
    setPhoto(null);
    setSaving(false);
    setErrorMessage(null);
  }, [isOpen, pet]);

  const canSave = name.trim().length > 0 && !saving;
  const submitLabel = isEditing ? 'Guardar cambios' : 'Guardar mascota';

  const acceptAsset = async (asset: ImagePicker.ImagePickerAsset | undefined) => {
    if (!asset) return;

    try {
      const normalized = await normalizePickedImage({
        uri: asset.uri,
        mimeType: asset.mimeType ?? null,
      });
      setPhoto(normalized);
    } catch (unknownError) {
      setErrorMessage(
        unknownError instanceof Error ? unknownError.message : 'No pudimos usar esa foto.'
      );
    }
  };

  const pickFromLibrary = async () => {
    setErrorMessage(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('Necesitamos permiso para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;
    await acceptAsset(result.assets[0]);
  };

  const pickFromCamera = async () => {
    setErrorMessage(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('Necesitamos permiso para usar la cámara.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;
    await acceptAsset(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (saving) return;

    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('El nombre de la mascota es obligatorio.');
      return;
    }

    const trimmedBirthday = birthday.trim();

    if (!trimmedBirthday) {
      setErrorMessage('La fecha de nacimiento es obligatoria.');
      return;
    }

    const parsedBirthday = parseBirthday(trimmedBirthday);

    if (!parsedBirthday) {
      setErrorMessage(
        'La fecha de nacimiento tiene que ser una fecha real en formato año-mes-día, por ejemplo 2019-05-14.'
      );
      return;
    }

    // Only creating needs a photo: editing keeps the current avatar unless a new file is picked.
    if (!isEditing && !photo) {
      setErrorMessage('Elegí una foto para la mascota.');
      return;
    }

    setSaving(true);
    try {
      await onSavePet({
        name: name.trim(),
        species,
        age: formatAge(parsedBirthday),
        birthday: parsedBirthday,
        bio: bio.trim() || 'Compañero/a inseparable de cuatro patas en Lovi.',
        avatar: photo ? { uri: photo.uri } : pet?.avatar,
        ...(photo ? { avatarLocalUri: photo.uri, avatarMimeType: photo.mimeType } : {}),
      });
      onClose();
    } catch (unknownError) {
      setErrorMessage(
        unknownError instanceof Error
          ? unknownError.message
          : 'No pudimos guardar la mascota. Probá de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      visible={isOpen}
      onClose={onClose}
      eyebrow={isEditing ? 'editar' : 'bienvenida'}
      title={isEditing ? 'Editar mascota' : 'Agregar nueva mascota'}
      description={
        pet ? `Actualizá los datos de ${pet.name}` : 'Sumá a un nuevo integrante a tu familia Lovi'
      }
      accent={COLORS.butter}
      footer={
        <>
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.primary,
              !canSave && styles.primaryDisabled,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={submitLabel}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.parchment} />
            ) : (
              <Text style={styles.primaryLabel}>{submitLabel}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
          >
            <Text style={styles.secondaryLabel}>Cancelar</Text>
          </Pressable>
        </>
      }
    >
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={COLORS.fucsia} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <Field
        label="Nombre de la mascota"
        required
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (errorMessage) setErrorMessage(null);
        }}
        placeholder="Ej. Bruno, Olivia, Rocco, Kiara..."
        autoFocus
      />

      <View style={styles.field}>
        <Text style={styles.label}>Especie</Text>
        <View style={styles.chipRow}>
          {SPECIES.map((option) => {
            const active = option === species;

            return (
              <Pressable
                key={option}
                onPress={() => setSpecies(option)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Field
        label="Fecha de nacimiento"
        required
        value={birthday}
        onChangeText={(value) => {
          setBirthday(value);
          if (errorMessage) setErrorMessage(null);
        }}
        placeholder="Ej. 2019-05-14"
        autoCapitalize="none"
        hint="Formato año-mes-día, por ejemplo 2019-05-14."
      />

      <Field
        label="Personalidad o biografía"
        value={bio}
        onChangeText={setBio}
        placeholder="¿Qué le gusta hacer? ¿Qué manías tiene? (Ej: Ama los paseos al atardecer y esconder medias)..."
        multiline
      />

      <View style={styles.field}>
        <Text style={styles.label}>{isEditing ? 'Foto de perfil' : 'Foto de perfil *'}</Text>

        {photo || isEditing ? (
          <View style={styles.photoRow}>
            <View style={styles.photoPreviewWrap}>
              <Image
                source={photo ? { uri: photo.uri } : pet?.avatar}
                style={styles.photoPreview}
                resizeMode="cover"
              />
            </View>

            <View style={styles.photoActions}>
              <Text style={styles.photoTitle}>{photo ? 'Tu foto' : 'Foto actual'}</Text>
              <Text style={styles.caption}>
                {photo
                  ? 'Se sube al guardar la mascota.'
                  : 'Elegí una nueva solo si querés reemplazarla.'}
              </Text>

              <View style={styles.photoLinks}>
                <Pressable
                  onPress={() => void pickFromLibrary()}
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar foto"
                >
                  <Text style={styles.linkLabel}>Cambiar</Text>
                </Pressable>
                {!isEditing ? (
                  <Pressable
                    onPress={() => setPhoto(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Quitar foto"
                  >
                    <Text style={styles.linkMuted}>Quitar</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => void pickFromLibrary()}
            style={({ pressed }) => [styles.photoDrop, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Subir una foto de la mascota"
          >
            <View style={styles.photoDropIcon}>
              <Ionicons name="camera-outline" size={20} color={COLORS.fucsia} />
            </View>
            <Text style={styles.photoDropTitle}>Subir una foto</Text>
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
    </AppModal>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },

  /* Field */
  field: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: alpha(COLORS.ink, 0.7),
    flexShrink: 1,
  },
  input: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.ink,
  },
  inputFocused: {
    borderColor: alpha(COLORS.fucsia, 0.4),
  },
  inputMultiline: {
    minHeight: 66,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  hint: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    color: INK_WASH.faint,
    marginTop: 2,
  },
  caption: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    color: INK_WASH.faint,
    marginTop: 2,
  },

  /* Species chips */
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
  },
  chipActive: {
    backgroundColor: COLORS.ink,
    ...SHADOWS.card,
  },
  chipLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: INK_WASH.medium,
    textTransform: 'capitalize',
  },
  chipLabelActive: {
    color: COLORS.parchment,
  },

  /* Photo */
  photoDrop: {
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 18,
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
  photoRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoPreviewWrap: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.fucsia,
    backgroundColor: COLORS.cream,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoActions: {
    flex: 1,
    gap: 2,
  },
  photoTitle: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  photoLinks: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 2,
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
  sourceRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
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

  /* Error */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: alpha(COLORS.fucsia, 0.1),
    borderWidth: 1,
    borderColor: alpha(COLORS.fucsia, 0.2),
  },
  errorText: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.fucsia,
  },

  /* Footer */
  primary: {
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dock,
    ...SHADOWS.darkGlow,
  },
  primaryDisabled: {
    opacity: 0.45,
  },
  primaryLabel: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: COLORS.parchment,
  },
  secondary: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  secondaryLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: INK_WASH.medium,
  },
});
