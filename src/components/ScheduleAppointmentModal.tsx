import React from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { alpha, COLORS, FONTS, INK_WASH, RADIUS, SHADOWS } from '../theme';
import type { Appointment, Pet } from '../types';
import { AppModal } from './AppModal';

interface ScheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet;
  onSaveAppointment: (appointment: Omit<Appointment, 'id' | 'isUpcoming'>) => Promise<void>;
}

type AppointmentType = Appointment['type'];
type FocusedField = 'title' | 'date' | 'time' | 'location' | null;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_OPTIONS: ReadonlyArray<{ value: AppointmentType; label: string; icon: IconName }> = [
  { value: 'veterinario', label: 'Consulta', icon: 'medkit' },
  { value: 'peluquería', label: 'Peluquería', icon: 'cut' },
  { value: 'vacunación', label: 'Chequeo', icon: 'sparkles' },
];

const DEFAULT_DATE = '2026-10-30';
const DEFAULT_TIME = '16:00';
const DEFAULT_LOCATION = 'Clínica Veterinaria San Roque';
const FALLBACK_LOCATION = 'Consultorio veterinario';

const digitsOnly = (value: string): string => value.replace(/[^0-9]/g, '');

/** Deterministic mask: 8 digits become YYYY-MM-DD, never opens a native picker. */
const maskDate = (value: string): string => {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

/** Deterministic mask: 4 digits become HH:MM. */
const maskTime = (value: string): string => {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
  );
};

const isValidTime = (value: string): boolean => {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

/**
 * Appointment-only scheduling sheet (turnos). Registering other health data
 * lives in its own modal, so this form stays focused on date, time and place.
 */
export const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({
  isOpen,
  onClose,
  pet,
  onSaveAppointment,
}) => {
  const [title, setTitle] = React.useState('');
  const [type, setType] = React.useState<AppointmentType>('veterinario');
  const [date, setDate] = React.useState(DEFAULT_DATE);
  const [time, setTime] = React.useState(DEFAULT_TIME);
  const [location, setLocation] = React.useState(DEFAULT_LOCATION);
  const [focusedField, setFocusedField] = React.useState<FocusedField>(null);
  const [saving, setSaving] = React.useState(false);

  // Reopening never shows values left over from a previous draft.
  React.useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setType('veterinario');
    setDate(DEFAULT_DATE);
    setTime(DEFAULT_TIME);
    setLocation(DEFAULT_LOCATION);
    setFocusedField(null);
    setSaving(false);
  }, [isOpen]);

  const canSave = title.trim().length > 0 && isValidDate(date) && isValidTime(time) && !saving;

  const handleSubmit = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      await onSaveAppointment({
        petId: pet.id,
        title: title.trim(),
        type,
        date,
        time,
        location: location.trim() || FALLBACK_LOCATION,
      });
      onClose();
    } catch (unknownError) {
      Alert.alert(
        'No pudimos agendar el turno',
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
      eyebrow="agenda"
      title="Agendar nuevo turno"
      description={`Para ${pet.name} · Cuidado privado del dueño`}
      accent={COLORS.fucsia}
      footer={
        <View style={styles.footer}>
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.primaryCta,
              !canSave && styles.ctaIdle,
              pressed && canSave && styles.ctaPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
            accessibilityLabel="Confirmar turno"
          >
            <Text style={styles.primaryCtaLabel}>Confirmar turno</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelPressed]}
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
          >
            <Text style={styles.cancelLabel}>Cancelar</Text>
          </Pressable>
        </View>
      }
    >
      {/* Tipo de turno */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Tipo de turno</Text>
        <View style={styles.segmentedRow}>
          {TYPE_OPTIONS.map((option) => {
            const isSelected = type === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setType(option.value)}
                style={({ pressed }) => [
                  styles.segment,
                  isSelected ? styles.segmentSelected : styles.segmentIdle,
                  pressed && !isSelected && styles.segmentPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Tipo de turno: ${option.label}`}
              >
                <Ionicons
                  name={option.icon}
                  size={13}
                  color={isSelected ? COLORS.parchment : alpha(COLORS.ink, 0.7)}
                />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  style={[styles.segmentLabel, isSelected && styles.segmentLabelSelected]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Motivo / Título */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Motivo o título del turno <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          onFocus={() => setFocusedField('title')}
          onBlur={() => setFocusedField(null)}
          placeholder="Ej. Chequeo de peso y oídos, Baño terapéutico..."
          placeholderTextColor={INK_WASH.faint}
          style={[styles.input, focusedField === 'title' && styles.inputFocused]}
          selectionColor={COLORS.fucsia}
          autoCorrect={false}
          accessibilityLabel="Motivo o título del turno"
        />
      </View>

      {/* Fecha y Hora */}
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeColumn}>
          <View style={styles.labelRow}>
            <Ionicons name="calendar" size={12} color={COLORS.fucsia} />
            <Text style={styles.label}>
              Fecha <Text style={styles.required}>*</Text>
            </Text>
          </View>
          <TextInput
            value={date}
            onChangeText={(value) => setDate(maskDate(value))}
            onFocus={() => setFocusedField('date')}
            onBlur={() => setFocusedField(null)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={INK_WASH.faint}
            style={[
              styles.input,
              styles.inputCompact,
              focusedField === 'date' && styles.inputFocused,
            ]}
            selectionColor={COLORS.fucsia}
            keyboardType="number-pad"
            maxLength={10}
            accessibilityLabel="Fecha del turno en formato año mes día"
          />
          <Text style={styles.helper}>Formato YYYY-MM-DD</Text>
        </View>

        <View style={styles.dateTimeColumn}>
          <View style={styles.labelRow}>
            <Ionicons name="time" size={12} color={COLORS.fucsia} />
            <Text style={styles.label}>
              Hora <Text style={styles.required}>*</Text>
            </Text>
          </View>
          <TextInput
            value={time}
            onChangeText={(value) => setTime(maskTime(value))}
            onFocus={() => setFocusedField('time')}
            onBlur={() => setFocusedField(null)}
            placeholder="HH:MM"
            placeholderTextColor={INK_WASH.faint}
            style={[
              styles.input,
              styles.inputCompact,
              focusedField === 'time' && styles.inputFocused,
            ]}
            selectionColor={COLORS.fucsia}
            keyboardType="number-pad"
            maxLength={5}
            accessibilityLabel="Hora del turno en formato hora minuto"
          />
          <Text style={styles.helper}>Formato HH:MM</Text>
        </View>
      </View>

      {/* Ubicación / Consultorio */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Ionicons name="location" size={12} color={COLORS.fucsia} />
          <Text style={styles.label}>Lugar / Consultorio veterinario</Text>
        </View>
        <TextInput
          value={location}
          onChangeText={setLocation}
          onFocus={() => setFocusedField('location')}
          onBlur={() => setFocusedField(null)}
          placeholder="Ej. Veterinaria San Roque (Dr. Aranda)"
          placeholderTextColor={INK_WASH.faint}
          style={[styles.input, focusedField === 'location' && styles.inputFocused]}
          selectionColor={COLORS.fucsia}
          autoCorrect={false}
          accessibilityLabel="Lugar o consultorio del turno"
        />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  fieldGroup: {
    gap: 6,
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
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: alpha(COLORS.ink, 0.7),
  },
  required: {
    color: COLORS.fucsia,
  },

  /* Segmented type selector */
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: RADIUS.md,
  },
  segmentIdle: {
    backgroundColor: COLORS.cream,
  },
  segmentSelected: {
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
  },
  segmentPressed: {
    backgroundColor: alpha(COLORS.butter, 0.2),
  },
  segmentLabel: {
    flexShrink: 1,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: alpha(COLORS.ink, 0.7),
  },
  segmentLabelSelected: {
    color: COLORS.parchment,
  },

  /* Inputs */
  input: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink,
  },
  inputCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputFocused: {
    borderColor: alpha(COLORS.fucsia, 0.4),
  },
  helper: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 13,
    color: INK_WASH.faint,
  },

  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeColumn: {
    flex: 1,
    gap: 6,
  },

  /* Footer */
  footer: {
    gap: 4,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
  },
  ctaIdle: {
    opacity: 0.45,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  primaryCtaLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.parchment,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  cancelPressed: {
    backgroundColor: COLORS.cream,
  },
  cancelLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: alpha(COLORS.ink, 0.7),
  },
});
