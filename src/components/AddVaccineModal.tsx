import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { alpha, COLORS, FONTS, INK_WASH, RADIUS, SHADOWS } from '../theme';
import type { Pet, Vaccine } from '../types';
import { AppModal } from './AppModal';

interface AddVaccineModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet;
  onSaveVaccine: (vaccine: Omit<Vaccine, 'id'>) => void;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type VaccineStatus = Vaccine['status'];

const STATUSES: ReadonlyArray<VaccineStatus> = ['Al día', 'Próxima dosis', 'Para repetir'];

const STATUS_ACTIVE: Record<
  VaccineStatus,
  { backgroundColor: string; color: string; shadow: ViewStyle }
> = {
  'Al día': { backgroundColor: COLORS.ink, color: COLORS.parchment, shadow: SHADOWS.card },
  'Próxima dosis': { backgroundColor: COLORS.orange, color: COLORS.ink, shadow: SHADOWS.orangeGlow },
  'Para repetir': { backgroundColor: COLORS.fucsia, color: COLORS.parchment, shadow: SHADOWS.fucsiaGlow },
};

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  icon?: IconName;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

/** Label (optionally icon-prefixed) + input with its own focus state. */
const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  icon,
  autoCapitalize = 'sentences',
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
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
};

/**
 * "Registrar nueva vacuna" — strictly vaccine data (name, dose date, status, batch notes).
 * No appointment fields live here: those belong to the scheduling modal.
 */
export const AddVaccineModal: React.FC<AddVaccineModalProps> = ({
  isOpen,
  onClose,
  pet,
  onSaveVaccine,
}) => {
  const [name, setName] = React.useState('');
  const [date, setDate] = React.useState('15 Nov 2026');
  const [status, setStatus] = React.useState<VaccineStatus>('Próxima dosis');
  const [notes, setNotes] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    setName('');
    setDate('15 Nov 2026');
    setStatus('Próxima dosis');
    setNotes('');
    setErrorMessage(null);
  }, [isOpen]);

  const canSave = name.trim().length > 0;

  const handleSubmit = () => {
    if (!name.trim()) {
      setErrorMessage('El nombre de la vacuna es obligatorio.');
      return;
    }

    onSaveVaccine({
      petId: pet.id,
      name: name.trim(),
      date: date.trim() || 'Próximamente',
      status,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <AppModal
      visible={isOpen}
      onClose={onClose}
      eyebrow="libreta sanitaria"
      title="Registrar nueva vacuna"
      description={`Para ${pet.name} · Libreta de vacunación`}
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
            accessibilityLabel="Guardar vacuna"
          >
            <Ionicons name="medical" size={15} color={COLORS.ink} />
            <Text style={styles.primaryLabel}>Guardar vacuna</Text>
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
        label="Nombre de la vacuna"
        required
        icon="medical"
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (errorMessage) setErrorMessage(null);
        }}
        placeholder="Ej. Antirrábica, Séxtuple, Triple Felina, KC..."
        autoCapitalize="words"
      />

      <Field
        label="Fecha de aplicación o dosis"
        icon="calendar"
        value={date}
        onChangeText={setDate}
        placeholder="Ej. 15 Nov 2026 o 2026-11-15"
        autoCapitalize="none"
      />

      <View style={styles.field}>
        <Text style={styles.label}>Estado de la dosis</Text>

        <View style={styles.segmented}>
          {STATUSES.map((option) => {
            const active = option === status;
            const activeStyle = STATUS_ACTIVE[option];

            return (
              <Pressable
                key={option}
                onPress={() => setStatus(option)}
                style={({ pressed }) => [
                  styles.segment,
                  active && {
                    backgroundColor: activeStyle.backgroundColor,
                    ...activeStyle.shadow,
                  },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    active && { color: activeStyle.color },
                  ]}
                  numberOfLines={1}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.caption}>
          {status === 'Al día'
            ? 'Dosis aplicada y vigente.'
            : status === 'Próxima dosis'
              ? 'Recordatorio de la próxima aplicación.'
              : 'Dosis a repetir o vencida.'}
        </Text>
      </View>

      <Field
        label="Notas o lote veterinario (opcional)"
        icon="document-text"
        value={notes}
        onChangeText={setNotes}
        placeholder="Ej. Lote 8941 - Laboratorio Zoetis, Dr. Aranda"
        autoCapitalize="sentences"
      />
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
  caption: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    color: INK_WASH.faint,
    marginTop: 2,
  },

  /* Status segmented control */
  segmented: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  segment: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },
  segmentLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: INK_WASH.medium,
    textAlign: 'center',
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
    backgroundColor: COLORS.orange,
    ...SHADOWS.orangeGlow,
  },
  primaryDisabled: {
    opacity: 0.45,
  },
  primaryLabel: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: COLORS.ink,
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
