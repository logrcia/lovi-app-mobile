import type { Appointment, Pet } from '../types';
import type { Database } from './db/types';

type DbSpecies = Database['public']['Enums']['pet_species'];
type DbAppointmentType = Database['public']['Enums']['appointment_type'];

/**
 * The database speaks English, the app speaks Spanish. This is the only place the
 * translation happens; no screen should ever see `'dog'`.
 */
export const SPECIES_LABEL = {
  dog: 'perro',
  cat: 'gato',
  rabbit: 'conejo',
  bird: 'ave',
  other: 'otro',
} satisfies Record<DbSpecies, Pet['species']>;

/** The inverse of `SPECIES_LABEL`, used when writing a pet back to Postgres. */
export const SPECIES_DB = {
  perro: 'dog',
  gato: 'cat',
  conejo: 'rabbit',
  ave: 'bird',
  otro: 'other',
} satisfies Record<Pet['species'], DbSpecies>;

export const APPOINTMENT_TYPE_LABEL = {
  vet: 'veterinario',
  grooming: 'peluquería',
  vaccination: 'vacunación',
} satisfies Record<DbAppointmentType, Appointment['type']>;

/** The inverse of `APPOINTMENT_TYPE_LABEL`, used when writing an appointment to Postgres. */
export const APPOINTMENT_TYPE_DB = {
  veterinario: 'vet',
  peluquería: 'grooming',
  vacunación: 'vaccination',
} satisfies Record<Appointment['type'], DbAppointmentType>;
