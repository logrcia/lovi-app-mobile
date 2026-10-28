import type {
  Album,
  Appointment,
  CalendarEvent,
  LoviImage,
  LoviMemory,
  Pet,
  UserProfile,
  Vaccine,
} from '../../types';
import { mediaUrl, supabase } from '../db/client';
import {
  type DbAlbum,
  type DbAppointment,
  type DbMemory,
  type DbPet,
  type DbProfile,
  type DbVaccine,
} from '../db/session';
import { APPOINTMENT_TYPE_LABEL, SPECIES_LABEL } from '../labels';

export interface LoviData {
  currentUser: UserProfile;
  pets: Pet[];
  memories: LoviMemory[];
  albums: Album[];
  vaccines: Vaccine[];
  appointments: Appointment[];
  calendarEvents: CalendarEvent[];
}

const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/** 1x1 transparent PNG: what an author without an uploaded avatar looks like. */
const EMPTY_AVATAR: LoviImage = {
  uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
};

const pad = (value: number) => String(value).padStart(2, '0');

function toImage(path: string | null): LoviImage {
  const url = mediaUrl(path);
  return url ? { uri: url } : EMPTY_AVATAR;
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

/** `'2026-11-14'` → `'14 Nov 2026'`, the format the vaccine card already renders. */
function formatLongDate(value: string | null): string {
  if (!value) return 'Sin fecha';
  const date = parseDateOnly(value);
  return `${pad(date.getDate())} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** Age is derived from `birthday`; the database never stores "3 años". */
function formatAge(birthday: string | null): string {
  if (!birthday) return '';
  const born = parseDateOnly(birthday);
  const now = new Date();

  let months =
    (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
  if (now.getDate() < born.getDate()) months -= 1;
  if (months < 0) return '';

  if (months < 12) return months <= 1 ? '1 mes' : `${months} meses`;

  const years = Math.floor(months / 12);
  return years === 1 ? '1 año' : `${years} años`;
}

/** `happened_at` → `'Hoy · 11:42'`, computed at render time instead of stored. */
function formatMemoryStamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const time = `${date.getHours()}:${pad(date.getMinutes())}`;

  if (date.toDateString() === now.toDateString()) return `Hoy · ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Ayer · ${time}`;

  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} · ${time}`;
}

function formatSeconds(seconds: number | null): string | undefined {
  if (seconds === null) return undefined;
  return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
}

/** `'14 Nov 2026'` semantics, derived from `next_due_at`. */
function vaccineStatus(nextDueAt: string | null): Vaccine['status'] {
  if (!nextDueAt) return 'Al día';

  const due = parseDateOnly(nextDueAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return 'Para repetir';
  if (days <= 30) return 'Próxima dosis';
  return 'Al día';
}

function localDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localTimeString(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())} hs`;
}

function toUserProfile(profile: DbProfile | undefined, profileId: string): UserProfile {
  const joined = profile ? new Date(profile.created_at) : new Date();
  return {
    id: profile?.id ?? profileId,
    name: profile?.name ?? 'Vos',
    handle: `@${profile?.handle ?? 'lovi'}`,
    bio: profile?.bio ?? '',
    avatar: toImage(profile?.avatar_path ?? null),
    location: profile?.location ?? '',
    joinedDate: `En Lovi desde ${MONTHS_SHORT[joined.getMonth()]} ${joined.getFullYear()}`,
  };
}

/**
 * Reads the whole public surface in one round trip set and maps it to the shapes the
 * screens already expect. Nothing is stored twice: counts, ages, statuses and the
 * calendar are all derived here from rows.
 */
export async function fetchLoviData(profileId: string): Promise<LoviData> {
  const [petsResult, profilesResult, followsResult, memoriesResult, albumsResult, vaccinesResult, appointmentsResult] =
    await Promise.all([
      supabase.from('pets').select('*').order('name'),
      supabase.from('profiles').select('*'),
      supabase.from('pet_follows').select('follower_id, pet_id'),
      supabase.from('memories').select('*').order('happened_at', { ascending: false }),
      supabase.from('albums').select('*').order('created_at'),
      supabase.from('vaccines').select('*'),
      supabase.from('appointments').select('*').order('starts_at'),
    ]);

  const failure =
    petsResult.error ??
    profilesResult.error ??
    followsResult.error ??
    memoriesResult.error ??
    albumsResult.error ??
    vaccinesResult.error ??
    appointmentsResult.error;

  if (failure) throw new Error(failure.message);

  const pets: DbPet[] = petsResult.data ?? [];
  const profiles: DbProfile[] = profilesResult.data ?? [];
  const follows = followsResult.data ?? [];
  const memories: DbMemory[] = memoriesResult.data ?? [];
  const albums: DbAlbum[] = albumsResult.data ?? [];
  const vaccines: DbVaccine[] = vaccinesResult.data ?? [];
  const appointments: DbAppointment[] = appointmentsResult.data ?? [];

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const followedPetIds = new Set(
    follows.filter((row) => row.follower_id === profileId).map((row) => row.pet_id)
  );
  const followersByPet = new Map<string, number>();
  for (const row of follows) {
    followersByPet.set(row.pet_id, (followersByPet.get(row.pet_id) ?? 0) + 1);
  }

  const toPet = (pet: DbPet): Pet => {
    const owner = profileById.get(pet.owner_id);
    return {
      id: pet.id,
      name: pet.name,
      species: SPECIES_LABEL[pet.species],
      age: formatAge(pet.birthday),
      followersCount: followersByPet.get(pet.id) ?? 0,
      bio: pet.bio,
      avatar: toImage(pet.avatar_path),
      isMine: pet.owner_id === profileId,
      isFollowing: followedPetIds.has(pet.id),
      owner: {
        id: pet.owner_id,
        name: owner?.name ?? 'Cuenta de Lovi',
        handle: `@${owner?.handle ?? 'lovi'}`,
        avatar: toImage(owner?.avatar_path ?? null),
      },
    };
  };

  const mappedPets = pets.map(toPet);
  const petById = new Map(mappedPets.map((pet) => [pet.id, pet]));

  const mappedMemories: LoviMemory[] = memories
    .filter((memory) => petById.has(memory.pet_id))
    .map((memory) => {
      const url = mediaUrl(memory.media_path);
      return {
        id: memory.id,
        petId: memory.pet_id,
        albumId: memory.album_id ?? undefined,
        title: memory.title,
        description: memory.description ?? undefined,
        mediaType: memory.media_type,
        mediaUrl: url ? { uri: url } : undefined,
        audioDuration:
          memory.media_type === 'audio'
            ? formatSeconds(memory.media_duration_seconds)
            : undefined,
        videoDuration:
          memory.media_type === 'video'
            ? formatSeconds(memory.media_duration_seconds)
            : undefined,
        createdAt: formatMemoryStamp(memory.happened_at),
        isRecommendation: !followedPetIds.has(memory.pet_id),
      };
    });

  const memoryById = new Map(memories.map((memory) => [memory.id, memory]));
  const memoryCountByAlbum = new Map<string, number>();
  for (const memory of memories) {
    if (!memory.album_id) continue;
    memoryCountByAlbum.set(memory.album_id, (memoryCountByAlbum.get(memory.album_id) ?? 0) + 1);
  }

  const mappedAlbums: Album[] = albums.map((album) => {
    const cover = album.cover_memory_id
      ? memoryById.get(album.cover_memory_id)
      : memories.find((memory) => memory.album_id === album.id);
    return {
      id: album.id,
      petId: album.pet_id,
      title: album.title,
      description: album.description ?? undefined,
      coverUrl: toImage(cover?.media_path ?? null),
      memoriesCount: memoryCountByAlbum.get(album.id) ?? 0,
    };
  });

  const mappedVaccines: Vaccine[] = vaccines.map((vaccine) => ({
    id: vaccine.id,
    petId: vaccine.pet_id,
    name: vaccine.name,
    date: formatLongDate(vaccine.next_due_at ?? vaccine.applied_at),
    status: vaccineStatus(vaccine.next_due_at),
    notes: vaccine.notes ?? undefined,
  }));

  const mappedAppointments: Appointment[] = appointments.map((appointment) => {
    const startsAt = new Date(appointment.starts_at);
    return {
      id: appointment.id,
      petId: appointment.pet_id,
      title: appointment.title,
      type: APPOINTMENT_TYPE_LABEL[appointment.type],
      date: localDateString(startsAt),
      time: `${pad(startsAt.getHours())}:${pad(startsAt.getMinutes())}`,
      location: appointment.location ?? '',
      isUpcoming: startsAt.getTime() > Date.now(),
    };
  });

  // The calendar is a view, not a table: appointments + due vaccines + birthdays + memories.
  const currentYear = new Date().getFullYear();
  const calendarEvents: CalendarEvent[] = [
    ...appointments.map((appointment) => {
      const startsAt = new Date(appointment.starts_at);
      return {
        id: `cal-turno-${appointment.id}`,
        petId: appointment.pet_id,
        type: 'turno' as const,
        title: appointment.title,
        date: localDateString(startsAt),
        time: localTimeString(startsAt),
        description: appointment.location ?? undefined,
      };
    }),
    ...vaccines
      .filter((vaccine) => vaccine.next_due_at)
      .map((vaccine) => ({
        id: `cal-vacuna-${vaccine.id}`,
        petId: vaccine.pet_id,
        type: 'vacuna' as const,
        title: `Vacuna: ${vaccine.name}`,
        date: vaccine.next_due_at as string,
        time: 'Todo el día',
        description: vaccine.notes ?? undefined,
      })),
    ...pets
      .filter((pet) => pet.birthday)
      .map((pet) => {
        const birthday = parseDateOnly(pet.birthday as string);
        return {
          id: `cal-cumple-${pet.id}`,
          petId: pet.id,
          type: 'cumple' as const,
          title: `¡Cumpleaños de ${pet.name}!`,
          date: `${currentYear}-${pad(birthday.getMonth() + 1)}-${pad(birthday.getDate())}`,
          time: 'Todo el día',
          description: 'Un año más de travesuras',
        };
      }),
    ...memories.map((memory) => {
      const happened = new Date(memory.happened_at);
      return {
        id: `cal-recuerdo-${memory.id}`,
        petId: memory.pet_id,
        type: 'recuerdo' as const,
        title: `Recuerdo: ${memory.title}`,
        date: localDateString(happened),
        time: localTimeString(happened),
        description: memory.description ?? undefined,
      };
    }),
  ];

  return {
    currentUser: toUserProfile(profileById.get(profileId), profileId),
    pets: mappedPets,
    memories: mappedMemories,
    albums: mappedAlbums,
    vaccines: mappedVaccines,
    appointments: mappedAppointments,
    calendarEvents,
  };
}
