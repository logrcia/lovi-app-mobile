import type { Database } from './types';

/**
 * Row types straight from the generated schema. Kept here so repositories and mappers
 * never reach into `Database['public']['Tables'][...]` by hand.
 */
export type DbPet = Database['public']['Tables']['pets']['Row'];
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbPetFollow = Database['public']['Tables']['pet_follows']['Row'];
export type DbMemory = Database['public']['Tables']['memories']['Row'];
export type DbAlbum = Database['public']['Tables']['albums']['Row'];
export type DbVaccine = Database['public']['Tables']['vaccines']['Row'];
export type DbAppointment = Database['public']['Tables']['appointments']['Row'];
