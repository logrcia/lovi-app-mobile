import type { ImageSourcePropType } from 'react-native';

/** RN image source: either a bundled asset (require/import) or a remote `{ uri }`. */
export type LoviImage = ImageSourcePropType;

export type MediaType = 'image' | 'video' | 'audio' | 'text';

export interface Pet {
  id: string;
  name: string;
  species: 'perro' | 'gato' | 'conejo' | 'ave' | 'otro';
  age: string;
  followersCount: number;
  bio: string;
  avatar: LoviImage;
  isMine: boolean;
  isFollowing?: boolean;
  owner: {
    id: string;
    name: string;
    handle: string;
    avatar: LoviImage;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar: LoviImage;
  location: string;
  joinedDate: string;
}

export interface LoviMemory {
  id: string;
  petId: string;
  title: string;
  description?: string;
  mediaType: MediaType;
  mediaUrl?: LoviImage;
  audioDuration?: string;
  videoDuration?: string;
  createdAt: string;
  /** "De cuentas que no seguís" — used by the home feed recommendation banner. */
  isRecommendation?: boolean;
  albumId?: string;
}

export interface Album {
  id: string;
  petId: string;
  title: string;
  description?: string;
  coverUrl: LoviImage;
  memoriesCount: number;
}

export interface Vaccine {
  id: string;
  petId: string;
  name: string;
  date: string;
  status: 'Al día' | 'Próxima dosis' | 'Para repetir';
  notes?: string;
}

export interface Appointment {
  id: string;
  petId: string;
  title: string;
  type: 'veterinario' | 'peluquería' | 'vacunación';
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  isUpcoming: boolean;
}

export interface CalendarEvent {
  id: string;
  petId: string;
  type: 'turno' | 'vacuna' | 'recuerdo' | 'cumple';
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  description?: string;
}

/** Screens reachable from the floating dock. */
export type MainTab = 'home' | 'explore' | 'calendar' | 'userProfile';

/** Full navigation surface of the app shell. */
export type ScreenType = MainTab | 'petProfile' | 'createMemory';

export type ScreenState = 'normal' | 'empty' | 'loading' | 'error';
