import React, { useCallback, useMemo, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddPetModal } from './src/components/AddPetModal';
import { BottomTabBar } from './src/components/BottomTabBar';
import {
  CURRENT_USER,
  INITIAL_ALBUMS,
  INITIAL_APPOINTMENTS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_MEMORIES,
  INITIAL_PETS,
  INITIAL_VACCINES,
} from './src/data/mockData';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { CreateMemoryScreen } from './src/screens/CreateMemoryScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PetProfileScreen } from './src/screens/PetProfileScreen';
import { UserProfileScreen } from './src/screens/UserProfileScreen';
import { COLORS } from './src/theme';
import type {
  Album,
  Appointment,
  CalendarEvent,
  LoviMemory,
  MainTab,
  Pet,
  ScreenType,
  UserProfile,
  Vaccine,
} from './src/types';

/** The design is anchored to 22 October 2026 ("hoy" in the reference). */
const DESIGN_TODAY = '2026-10-22';

const MONTHS_ES: Record<string, number> = {
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
};

/** Parses the '14 Nov 2026' format used by the vaccine form into YYYY-MM-DD. */
function parseDesignDate(input: string): string | null {
  const match = input.trim().match(/^(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]{3,})\.?\s+(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = MONTHS_ES[match[2].slice(0, 3).toLowerCase()];
  if (month === undefined || day < 1 || day > 31) return null;

  return `${match[3]}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function AppShell() {
  const insets = useSafeAreaInsets();

  // Data
  const [pets, setPets] = useState<Pet[]>(INITIAL_PETS);
  const [memories, setMemories] = useState<LoviMemory[]>(INITIAL_MEMORIES);
  const [albums, setAlbums] = useState<Album[]>(INITIAL_ALBUMS);
  const [vaccines, setVaccines] = useState<Vaccine[]>(INITIAL_VACCINES);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);

  // Navigation
  const [screen, setScreen] = useState<ScreenType>('home');
  const [selectedPetId, setSelectedPetId] = useState<string>(INITIAL_PETS[0].id);
  const [viewedUser, setViewedUser] = useState<UserProfile>(CURRENT_USER);
  const [userProfileReturn, setUserProfileReturn] = useState<ScreenType>('petProfile');
  const [isOwnerView, setIsOwnerView] = useState(true);
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);

  const currentPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) ?? pets[0],
    [pets, selectedPetId]
  );

  const myPets = useMemo(() => pets.filter((pet) => pet.isMine), [pets]);

  // ——— Navigation actions ————————————————————————————————————————
  const openPetProfile = useCallback((petId: string) => {
    setSelectedPetId(petId);
    setScreen('petProfile');
  }, []);

  const openOwnerProfile = useCallback(
    (owner: Pet['owner']) => {
      if (owner.id === CURRENT_USER.id) {
        setViewedUser(CURRENT_USER);
      } else {
        setViewedUser({
          id: owner.id,
          name: owner.name,
          handle: owner.handle,
          avatar: owner.avatar,
          bio: 'Cuidando y documentando los momentos de sus mascotas en Lovi.',
          location: 'Buenos Aires',
          joinedDate: 'En Lovi desde 2026',
        });
      }
      setUserProfileReturn(screen === 'userProfile' ? 'home' : screen);
      setScreen('userProfile');
    },
    [screen]
  );

  const openOwnProfile = useCallback(() => {
    setViewedUser(CURRENT_USER);
    setScreen('userProfile');
  }, []);

  const handleNavigate = useCallback((tab: MainTab) => {
    if (tab === 'userProfile') {
      setViewedUser(CURRENT_USER);
    }
    setScreen(tab);
  }, []);

  const openCreateMemory = useCallback(() => {
    setScreen('createMemory');
  }, []);

  // ——— Mutations ————————————————————————————————————————————————
  const handleFollowToggle = useCallback((petId: string) => {
    setPets((prev) =>
      prev.map((pet) => {
        if (pet.id !== petId) return pet;
        const nextFollowing = !pet.isFollowing;
        return {
          ...pet,
          isFollowing: nextFollowing,
          followersCount: Math.max(0, pet.followersCount + (nextFollowing ? 1 : -1)),
        };
      })
    );
  }, []);

  const handleSaveMemory = useCallback((draft: Partial<LoviMemory>) => {
    const memory: LoviMemory = {
      id: `lovi-${Date.now()}`,
      petId: draft.petId ?? currentPet.id,
      title: draft.title?.trim() || 'Recuerdo sin título',
      description: draft.description,
      mediaType: draft.mediaType ?? 'text',
      mediaUrl: draft.mediaUrl,
      audioDuration: draft.audioDuration,
      videoDuration: draft.videoDuration,
      createdAt: 'Recién · Hoy',
      isRecommendation: false,
    };

    setMemories((prev) => [memory, ...prev]);
    setCalendarEvents((prev) => [
      {
        id: `cal-mem-${Date.now()}`,
        petId: memory.petId,
        type: 'recuerdo',
        title: `Recuerdo: ${memory.title}`,
        date: DESIGN_TODAY,
        time: 'Recién',
        description: memory.description || 'Lovi guardado con cariño',
      },
      ...prev,
    ]);

    setSelectedPetId(memory.petId);
    setScreen('home');
  }, [currentPet.id]);

  const handleAddPet = useCallback(
    (draft: Omit<Pet, 'id' | 'followersCount' | 'isMine' | 'owner'>) => {
      const newPet: Pet = {
        ...draft,
        id: `pet-${Date.now()}`,
        followersCount: 0,
        isMine: true,
        owner: {
          id: CURRENT_USER.id,
          name: CURRENT_USER.name,
          handle: CURRENT_USER.handle,
          avatar: CURRENT_USER.avatar,
        },
      };

      setPets((prev) => [...prev, newPet]);
      setSelectedPetId(newPet.id);
      setScreen('petProfile');
    },
    []
  );

  const handleSaveAppointment = useCallback((draft: Omit<Appointment, 'id' | 'isUpcoming'>) => {
    setAppointments((prev) => [
      { ...draft, id: `app-${Date.now()}`, isUpcoming: true },
      ...prev,
    ]);

    setCalendarEvents((prev) => [
      {
        id: `cal-app-${Date.now()}`,
        petId: draft.petId,
        type: 'turno',
        title: draft.title,
        date: draft.date,
        time: `${draft.time} hs`,
        description: draft.location,
      },
      ...prev,
    ]);
  }, []);

  const handleSaveVaccine = useCallback((draft: Omit<Vaccine, 'id'>) => {
    setVaccines((prev) => [{ ...draft, id: `vac-${Date.now()}` }, ...prev]);

    const date = parseDesignDate(draft.date);
    if (!date) return;

    setCalendarEvents((prev) => [
      {
        id: `cal-vac-${Date.now()}`,
        petId: draft.petId,
        type: 'vacuna',
        title: `Vacuna: ${draft.name}`,
        date,
        time: '10:00 hs',
        description: draft.notes || 'Dosis programada en libreta sanitaria',
      },
      ...prev,
    ]);
  }, []);

  const handleCreateAlbum = useCallback((draft: Omit<Album, 'id' | 'memoriesCount'>) => {
    setAlbums((prev) => [...prev, { ...draft, id: `album-${Date.now()}`, memoriesCount: 0 }]);
  }, []);

  const handleToggleMemoryInAlbum = useCallback(
    (memoryId: string, addToAlbum: boolean, albumId: string) => {
      setMemories((prev) =>
        prev.map((memory) =>
          memory.id === memoryId
            ? { ...memory, albumId: addToAlbum ? albumId : undefined }
            : memory
        )
      );

      setAlbums((prev) =>
        prev.map((album) =>
          album.id === albumId
            ? {
                ...album,
                memoriesCount: addToAlbum
                  ? album.memoriesCount + 1
                  : Math.max(0, album.memoriesCount - 1),
              }
            : album
        )
      );
    },
    []
  );

  // ——— Screens ——————————————————————————————————————————————————
  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            pets={pets}
            memories={memories}
            onSelectPet={openPetProfile}
            onFollowToggle={handleFollowToggle}
            onOpenCreate={openCreateMemory}
            onOpenUserProfile={openOwnProfile}
          />
        );

      case 'explore':
        return (
          <ExploreScreen
            pets={pets}
            onSelectPet={openPetProfile}
            onFollowToggle={handleFollowToggle}
          />
        );

      case 'petProfile':
        return (
          <PetProfileScreen
            pet={currentPet}
            memories={memories}
            albums={albums}
            vaccines={vaccines}
            appointments={appointments}
            isOwnerView={isOwnerView}
            onToggleOwnerView={() => setIsOwnerView((prev) => !prev)}
            onFollowToggle={handleFollowToggle}
            onOpenCreate={openCreateMemory}
            onOpenCalendar={() => setScreen('calendar')}
            onSelectPet={openPetProfile}
            onOpenOwnerProfile={openOwnerProfile}
            onSaveAppointment={handleSaveAppointment}
            onSaveVaccine={handleSaveVaccine}
            onCreateAlbum={handleCreateAlbum}
            onToggleMemoryInAlbum={handleToggleMemoryInAlbum}
          />
        );

      case 'calendar':
        return (
          <CalendarScreen
            pet={currentPet}
            events={calendarEvents.filter((event) => event.petId === currentPet.id)}
          />
        );

      case 'userProfile':
        return (
          <UserProfileScreen
            user={viewedUser}
            pets={pets}
            onSelectPet={openPetProfile}
            onOpenCreate={openCreateMemory}
            onOpenAddPet={() => setIsAddPetModalOpen(true)}
            onFollowToggle={handleFollowToggle}
            onBack={
              viewedUser.id === CURRENT_USER.id
                ? undefined
                : () => setScreen(userProfileReturn)
            }
          />
        );

      case 'createMemory':
        return (
          <CreateMemoryScreen
            pet={currentPet}
            availablePets={myPets}
            onSave={handleSaveMemory}
            onCancel={() => setScreen('home')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.content, { paddingTop: insets.top }]}>{renderScreen()}</View>

      <BottomTabBar
        currentScreen={screen}
        onNavigate={handleNavigate}
        onOpenCreate={openCreateMemory}
      />

      <AddPetModal
        isOpen={isAddPetModalOpen}
        onClose={() => setIsAddPetModalOpen(false)}
        onSavePet={(pet) => {
          setIsAddPetModalOpen(false);
          handleAddPet(pet);
        }}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  content: {
    flex: 1,
  },
});
