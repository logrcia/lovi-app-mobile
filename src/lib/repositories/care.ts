import type { Appointment, Vaccine } from '../../types';
import { supabase } from '../db/client';
import { APPOINTMENT_TYPE_DB } from '../labels';

export interface NewVaccineDraft {
  petId: string;
  name: string;
  /** `YYYY-MM-DD`; the caller parses the free-text field from the modal. */
  date: string;
  status: Vaccine['status'];
  notes?: string;
}

export interface NewAppointmentDraft {
  petId: string;
  title: string;
  type: Appointment['type'];
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:mm` */
  time: string;
  location?: string;
}

function readableError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('row-level security')) {
    return 'Ese registro no se puede guardar en esa mascota.';
  }

  return message;
}

/**
 * The badge ("Al día" / "Próxima dosis" / "Para repetir") is derived from `next_due_at` by the
 * read path, never stored. The picked status therefore only decides which date column receives
 * the date: the last applied dose, or the next one.
 */
export async function createVaccine(draft: NewVaccineDraft): Promise<string> {
  const appliedAt = draft.status === 'Al día' ? draft.date : null;
  const nextDueAt = draft.status === 'Al día' ? null : draft.date;

  const { data, error } = await supabase
    .from('vaccines')
    .insert({
      pet_id: draft.petId,
      name: draft.name,
      applied_at: appliedAt,
      next_due_at: nextDueAt,
      notes: draft.notes?.trim() || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(readableError(error.message));

  return data.id;
}

function startsAtIso(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  const valid =
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    Number.isFinite(day) &&
    Number.isFinite(hour) &&
    Number.isFinite(minute);

  if (!valid) {
    throw new Error('Revisá la fecha y la hora del turno.');
  }

  // Built from local components so "16:00" means 16:00 where the owner is, not UTC.
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

export async function createAppointment(draft: NewAppointmentDraft): Promise<string> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      pet_id: draft.petId,
      title: draft.title,
      type: APPOINTMENT_TYPE_DB[draft.type],
      starts_at: startsAtIso(draft.date, draft.time),
      location: draft.location?.trim() || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(readableError(error.message));

  return data.id;
}
