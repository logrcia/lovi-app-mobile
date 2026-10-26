import React from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import cocoPark from '../../assets/images/coco_park_run_1792712089196.jpg';
import lunaNap from '../../assets/images/luna_cat_nap_1792712089280.jpg';
import miloPortrait from '../../assets/images/milo_dog_portrait_1792712088048.jpg';
import oliverWindow from '../../assets/images/oliver_cat_window_1792712089510.jpg';

import { alpha, COLORS, FONTS, INK_WASH, RADIUS, SHADOWS } from '../theme';
import type { LoviImage, Pet } from '../types';
import { AppModal } from './AppModal';

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePet: (pet: Omit<Pet, 'id' | 'followersCount' | 'isMine' | 'owner'>) => void;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const SPECIES: ReadonlyArray<Pet['species']> = ['perro', 'gato', 'conejo', 'ave', 'otro'];

/** The bundled photos double as the avatar gallery — no remote URLs, no string sources. */
const PRESET_AVATARS: ReadonlyArray<{ photo: LoviImage; label: string }> = [
  { photo: miloPortrait, label: 'Golden / Perro' },
  { photo: cocoPark, label: 'Cachorro / Parque' },
  { photo: lunaNap, label: 'Gato siesta' },
  { photo: oliverWindow, label: 'Gato ventana' },
];

/** Pre-selects a bundled photo that matches the chosen species. */
const defaultAvatarIndex = (species: Pet['species']): number => (species === 'gato' ? 2 : 0);

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

/**
 * "Agregar nueva mascota" — name, species, age, personality and a bundled avatar gallery.
 * Every field resets when the sheet reopens.
 */
export const AddPetModal: React.FC<AddPetModalProps> = ({ isOpen, onClose, onSavePet }) => {
  const [name, setName] = React.useState('');
  const [species, setSpecies] = React.useState<Pet['species']>('perro');
  const [age, setAge] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [avatarIndex, setAvatarIndex] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    setName('');
    setSpecies('perro');
    setAge('');
    setBio('');
    setAvatarIndex(defaultAvatarIndex('perro'));
    setErrorMessage(null);
  }, [isOpen]);

  const canSave = name.trim().length > 0;

  const selectSpecies = (next: Pet['species']) => {
    setSpecies(next);
    setAvatarIndex(defaultAvatarIndex(next));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setErrorMessage('El nombre de la mascota es obligatorio.');
      return;
    }

    if (!age.trim()) {
      setErrorMessage('La edad de la mascota es obligatoria (ej: "2 meses", "3 años").');
      return;
    }

    const avatar = PRESET_AVATARS[avatarIndex]?.photo ?? PRESET_AVATARS[0].photo;

    onSavePet({
      name: name.trim(),
      species,
      age: age.trim(),
      bio: bio.trim() || 'Compañero/a inseparable de cuatro patas en Lovi.',
      avatar,
    });

    onClose();
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
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.primary,
              !canSave && styles.primaryDisabled,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Guardar mascota"
          >
            <Text style={styles.primaryLabel}>Guardar mascota</Text>
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
                onPress={() => selectSpecies(option)}
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
        <Text style={styles.label}>Foto de perfil</Text>

        <View style={styles.avatarRow}>
          {PRESET_AVATARS.map((item, index) => {
            const selected = index === avatarIndex;

            return (
              <Pressable
                key={item.label}
                onPress={() => setAvatarIndex(index)}
                style={({ pressed }) => [
                  styles.avatarCell,
                  selected && styles.avatarCellSelected,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={item.label}
              >
                <Image source={item.photo} style={styles.avatarImage} resizeMode="cover" />

                {selected ? (
                  <View style={styles.avatarOverlay}>
                    <View style={styles.avatarCheck}>
                      <Ionicons name="checkmark" size={12} color={COLORS.parchment} />
                    </View>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.caption}>{PRESET_AVATARS[avatarIndex]?.label}</Text>
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

  /* Avatar gallery */
  avatarRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  avatarCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.cream,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCellSelected: {
    borderColor: COLORS.fucsia,
    transform: [{ scale: 1.03 }],
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: alpha(COLORS.fucsia, 0.2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCheck: {
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
