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

import { parseAgeToBirthday } from '../lib/pets/age';
import { alpha, COLORS, FONTS, INK_WASH, RADIUS, SHADOWS } from '../theme';
import type { Pet } from '../types';
import { AppModal } from './AppModal';

/** What the sheet hands over: the display pet plus the local file to upload. */
export interface NewPetDraft extends Omit<Pet, 'id' | 'followersCount' | 'isMine' | 'owner'> {
  /** `YYYY-MM-DD`, already parsed from the age text by the sheet. */
  birthday: string;
  /** Local `file://` uri chosen with the picker; uploaded once the row exists. */
  avatarLocalUri?: string;
  avatarMimeType?: string | null;
}

interface AddPetModalProps {
  isOpen: boolean;
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
    </View>
  );
};

interface PickedPhoto {
  uri: string;
  mimeType: string | null;
}

/**
 * "Agregar nueva mascota" — name, species, age, personality and a photo taken from the
 * device. The photo is uploaded after the row exists; the sheet stays open and reports the
 * error if that fails, so nothing is ever saved half-way.
 */
export const AddPetModal: React.FC<AddPetModalProps> = ({ isOpen, onClose, onSavePet }) => {
  const [name, setName] = React.useState('');
  const [species, setSpecies] = React.useState<Pet['species']>('perro');
  const [age, setAge] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [photo, setPhoto] = React.useState<PickedPhoto | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    setName('');
    setSpecies('perro');
    setAge('');
    setBio('');
    setPhoto(null);
    setSaving(false);
    setErrorMessage(null);
  }, [isOpen]);

  const canSave = name.trim().length > 0 && !saving;

  const acceptAsset = (asset: ImagePicker.ImagePickerAsset | undefined) => {
    if (!asset) return;
    setPhoto({ uri: asset.uri, mimeType: asset.mimeType ?? null });
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
    acceptAsset(result.assets[0]);
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
    acceptAsset(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (saving) return;

    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('El nombre de la mascota es obligatorio.');
      return;
    }

    const birthday = parseAgeToBirthday(age);
    if (!birthday) {
      setErrorMessage('No entendimos la edad. Probá con "4 meses" o "3 años".');
      return;
    }

    if (!photo) {
      setErrorMessage('Elegí una foto para la mascota.');
      return;
    }

    setSaving(true);
    try {
      await onSavePet({
        name: name.trim(),
        species,
        age: age.trim(),
        birthday,
        bio: bio.trim() || 'Compañero/a inseparable de cuatro patas en Lovi.',
        avatar: { uri: photo.uri },
        avatarLocalUri: photo.uri,
        avatarMimeType: photo.mimeType,
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
      eyebrow="bienvenida"
      title="Agregar nueva mascota"
      description="Sumá a un nuevo integrante a tu familia Lovi"
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
            accessibilityLabel="Guardar mascota"
          >
            {saving ? (
              <ActivityIndicator color={COLORS.parchment} />
            ) : (
              <Text style={styles.primaryLabel}>Guardar mascota</Text>
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
        label="Edad"
        required
        value={age}
        onChangeText={(value) => {
          setAge(value);
          if (errorMessage) setErrorMessage(null);
        }}
        placeholder="Ej. 4 meses, 2 años, 7 años..."
        autoCapitalize="none"
      />

      <Field
        label="Personalidad o biografía"
        value={bio}
        onChangeText={setBio}
        placeholder="¿Qué le gusta hacer? ¿Qué manías tiene? (Ej: Ama los paseos al atardecer y esconder medias)..."
        multiline
      />

      <View style={styles.field}>
        <Text style={styles.label}>Foto de perfil *</Text>

        {photo ? (
          <View style={styles.photoRow}>
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} resizeMode="cover" />
            </View>

            <View style={styles.photoActions}>
              <Text style={styles.photoTitle}>Tu foto</Text>
              <Text style={styles.caption}>Se sube al guardar la mascota.</Text>

              <View style={styles.photoLinks}>
                <Pressable
                  onPress={() => void pickFromLibrary()}
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar foto"
                >
                  <Text style={styles.linkLabel}>Cambiar</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPhoto(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar foto"
                >
                  <Text style={styles.linkMuted}>Quitar</Text>
                </Pressable>
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
