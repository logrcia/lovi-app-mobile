import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { NewAlbumDraft } from '../lib/repositories/albums';
import { alpha, COLORS, FONTS, INK_WASH, RADIUS, SHADOWS } from '../theme';
import type { Pet } from '../types';
import { AppModal } from './AppModal';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet;
  onCreateAlbum: (album: NewAlbumDraft) => Promise<void>;
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  autoFocus?: boolean;
}

/** Label + input pair with its own focus tracking (hairline turns fucsia on focus). */
const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  multiline = false,
  autoFocus = false,
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={INK_WASH.faint}
        selectionColor={COLORS.fucsia}
        autoFocus={autoFocus}
        multiline={multiline}
        autoCapitalize="sentences"
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

/**
 * "Nuevo álbum para {pet}" — title and description.
 * The cover is not picked here: `albums.cover_memory_id` points at a memory row, so an empty
 * album has nothing to point at until the first photo is added to it.
 */
export const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({
  isOpen,
  onClose,
  pet,
  onCreateAlbum,
}) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    setTitle('');
    setDescription('');
    setSaving(false);
    setErrorMessage(null);
  }, [isOpen, pet]);

  const canSave = title.trim().length > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      await onCreateAlbum({
        petId: pet.id,
        title: title.trim(),
        description: description.trim() || undefined,
      });

      onClose();
    } catch (unknownError) {
      setErrorMessage(
        unknownError instanceof Error ? unknownError.message : 'Probá de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      visible={isOpen}
      onClose={onClose}
      eyebrow="colección"
      title={`Nuevo álbum para ${pet.name}`}
      description="Agrupá recuerdos de paseos, travesuras o etapas"
      accent={COLORS.butter}
      footer={
        <>
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={saving}
            style={({ pressed }) => [
              styles.primary,
              !canSave && styles.primaryDisabled,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Crear álbum"
          >
            <Ionicons name="folder-open" size={15} color={COLORS.parchment} />
            <Text style={styles.primaryLabel}>Crear álbum</Text>
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
        label="Título del álbum"
        required
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          if (errorMessage) setErrorMessage(null);
        }}
        placeholder="Ej. Vacaciones en la playa, Primer año, Siestas doradas..."
        autoFocus
      />

      <Field
        label="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Contá de qué se trata esta colección..."
        multiline
      />

      <View style={styles.field}>
        <Text style={styles.label}>Portada</Text>

        <Text style={styles.caption}>
          Se toma de la primera foto que agregues al álbum.
        </Text>
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
  label: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: alpha(COLORS.ink, 0.7),
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

  /* Cover picker */
  coverRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  coverCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.cream,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coverCellSelected: {
    borderColor: COLORS.fucsia,
    transform: [{ scale: 1.03 }],
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: alpha(COLORS.fucsia, 0.2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverCheck: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.fucsia,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
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
