import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddPetModal, type NewPetDraft } from './src/components/AddPetModal';
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
import { signOut } from './src/lib/auth/actions';
import { useSession } from './src/lib/auth/useSession';
import { useLoviData } from './src/lib/hooks/useLoviData';
import { createAlbum, setMemoryAlbum, type NewAlbumDraft } from './src/lib/repositories/albums';
import { createAppointment, createVaccine } from './src/lib/repositories/care';
import { setPetFollowing } from './src/lib/repositories/follows';
import { createMemory, type NewMemoryDraft } from './src/lib/repositories/memories';
import { createPet } from './src/lib/repositories/pets';
import { AuthScreen } from './src/screens/AuthScreen';
import { NoPetsScreen } from './src/screens/NoPetsScreen';
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

/** The vaccine form promises both formats: '15 Nov 2026' and '2026-11-15'. */
function parseVaccineDate(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return parseDesignDate(trimmed);
}

function AppShell({ profileId }: { profileId: string }) {
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
  const [petProfileReturn, setPetProfileReturn] = useState<MainTab>('home');
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);

  // ——— Remote data ——————————————————————————————————————————————
  // Starts from the fixtures so the first frame already has the editorial layout, then
  // swaps everything for what Postgres actually holds.
  const remote = useLoviData(profileId);

  /**
   * The signed-in profile. `CURRENT_USER` is only the pre-load placeholder for the first
   * frame; the moment the profile row arrives it is replaced by the real account.
   */
  const currentUser = remote.data?.currentUser ?? CURRENT_USER;

  useEffect(() => {
    if (remote.status !== 'ready' || !remote.data) return;

    const data = remote.data;
    setPets(data.pets);
    setMemories(data.memories);
    setAlbums(data.albums);
    setVaccines(data.vaccines);
    setAppointments(data.appointments);
    setCalendarEvents(data.calendarEvents);
    setViewedUser(data.currentUser);
    setSelectedPetId((previous) => {
      if (data.pets.some((pet) => pet.id === previous)) return previous;
      // Never default to a pet you do not own: those belong to Explore, not to "mine".
      return data.pets.find((pet) => pet.isMine)?.id ?? previous;
    });
  }, [remote.status, remote.data]);

  useEffect(() => {
    if (remote.status === 'error') {
      console.warn('[lovi] No se pudo leer Supabase:', remote.error);
    }
  }, [remote.status, remote.error]);

  const currentPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) ?? pets.find((pet) => pet.isMine),
    [pets, selectedPetId]
  );

  const myPets = useMemo(() => pets.filter((pet) => pet.isMine), [pets]);
  const followingPets = useMemo(() => pets.filter((pet) => pet.isFollowing), [pets]);

  // The dock reflects where the current screen belongs: a pet profile keeps the tab it was
  // opened from lit, and the composer (reachable from the FAB on any tab) belongs to none.
  // Another owner's profile is not "Mi Perfil" either, so it resolves through the chain:
  // pet profile -> the tab it came from.
  const activeTab: MainTab | null = (() => {
    if (screen === 'createMemory') return null;
    if (screen === 'petProfile') return petProfileReturn;

    if (screen === 'userProfile' && viewedUser.id !== currentUser.id) {
      if (userProfileReturn === 'petProfile') return petProfileReturn;
      if (userProfileReturn === 'createMemory') return null;
      return userProfileReturn;
    }

    return screen;
  })();

  // ——— Navigation actions ————————————————————————————————————————
  const openPetProfile = useCallback(
    (petId: string) => {
      // A pet profile is reachable from any tab. Remember the tab it was opened from so the
      // dock highlight and the back arrow both return there instead of guessing "Mi perfil".
      if (screen !== 'petProfile' && screen !== 'createMemory') {
        setPetProfileReturn(screen);
      }

      setSelectedPetId(petId);
      setScreen('petProfile');
    },
    [screen]
  );

  const openOwnerProfile = useCallback(
    (owner: Pet['owner']) => {
      if (owner.id === currentUser.id) {
        setViewedUser(currentUser);
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
    [screen, currentUser]
  );

  const openOwnProfile = useCallback(() => {
    setViewedUser(currentUser);
    setScreen('userProfile');
  }, [currentUser]);

  const handleNavigate = useCallback(
    (tab: MainTab) => {
      if (tab === 'userProfile') {
        setViewedUser(currentUser);
      }
      setScreen(tab);
    },
    [currentUser]
  );

  const openCreateMemory = useCallback(() => {
    setScreen('createMemory');
  }, []);

  // ——— Mutations ————————————————————————————————————————————————
  const handleFollowToggle = useCallback(
    async (petId: string) => {
      const pet = pets.find((candidate) => candidate.id === petId);
      if (!pet || pet.isMine) return;

      const following = !pet.isFollowing;

      // Optimistic so the button reacts on tap; `refetch` reconciles `followers_count`,
      // which is derived from `pet_follows` and never written by the app.
      setPets((prev) =>
        prev.map((candidate) =>
          candidate.id === petId
            ? {
                ...candidate,
                isFollowing: following,
                followersCount: Math.max(
                  0,
                  candidate.followersCount + (following ? 1 : -1)
                ),
              }
            : candidate
        )
      );

      try {
        await setPetFollowing({ petId, followerId: profileId, following });
      } catch (unknownError) {
        Alert.alert(
          'No pudimos actualizar el seguimiento',
          unknownError instanceof Error ? unknownError.message : 'Probá de nuevo.'
        );
      } finally {
        remote.refetch();
      }
    },
    [pets, profileId, remote.refetch]
  );

  const handleSaveMemory = useCallback(
    async (draft: NewMemoryDraft) => {
      await createMemory(draft);

      setSelectedPetId(draft.petId);
      setScreen('home');
      remote.refetch();
    },
    [remote.refetch]
  );

  const handleAddPet = useCallback(
    async (draft: NewPetDraft) => {
      const petId = await createPet({
        ownerId: currentUser.id,
        name: draft.name,
        species: draft.species,
        birthday: draft.birthday,
        bio: draft.bio,
        avatar: draft.avatarLocalUri
          ? { uri: draft.avatarLocalUri, mimeType: draft.avatarMimeType ?? null }
          : null,
      });

      // Optimistic row so the profile reacts instantly; `refetch` reconciles it with the
      // real Postgres row (including the public avatar URL) a beat later.
      setPets((prev) => [
        ...prev,
        {
          ...draft,
          id: petId,
          followersCount: 0,
          isMine: true,
          owner: {
            id: currentUser.id,
            name: currentUser.name,
            handle: currentUser.handle,
            avatar: currentUser.avatar,
          },
        },
      ]);
      setSelectedPetId(petId);
      setPetProfileReturn('userProfile');
      setScreen('petProfile');
      remote.refetch();
    },
    [currentUser, remote.refetch]
  );

  const handleSaveAppointment = useCallback(
    async (draft: Omit<Appointment, 'id' | 'isUpcoming'>) => {
      await createAppointment({
        petId: draft.petId,
        title: draft.title,
        type: draft.type,
        date: draft.date,
        time: draft.time,
        location: draft.location,
      });

      remote.refetch();
    },
    [remote.refetch]
  );

  const handleSaveVaccine = useCallback(
    async (draft: Omit<Vaccine, 'id'>) => {
      const date = parseVaccineDate(draft.date);

      if (!date) {
        throw new Error('Escribí la fecha como "15 Nov 2026" o 2026-11-15.');
      }

      await createVaccine({
        petId: draft.petId,
        name: draft.name,
        date,
        status: draft.status,
        notes: draft.notes,
      });

      remote.refetch();
    },
    [remote.refetch]
  );

  const handleCreateAlbum = useCallback(
    async (draft: NewAlbumDraft) => {
      await createAlbum(draft);
      remote.refetch();
    },
    [remote.refetch]
  );

  const handleToggleMemoryInAlbum = useCallback(
    async (memoryId: string, addToAlbum: boolean, albumId: string) => {
      await setMemoryAlbum({ memoryId, albumId: addToAlbum ? albumId : null });
      remote.refetch();
    },
    [remote.refetch]
  );

  // ——— Screens ——————————————————————————————————————————————————
  const renderHome = () => (
    <HomeScreen
      pets={pets}
      memories={memories}
      currentUserName={remote.data?.currentUser.name}
      currentUserAvatar={remote.data?.currentUser.avatar}
      onSelectPet={openPetProfile}
      onFollowToggle={handleFollowToggle}
      onOpenCreate={openCreateMemory}
      onOpenUserProfile={openOwnProfile}
    />
  );

  const renderScreen = () => {
    // A brand-new account has no pets yet: those screens have nothing to show and would
    // dereference an undefined pet. Fall back to the feed, which has its own empty state.
    if (screen === 'petProfile' && !currentPet) {
      return <NoPetsScreen onGoToProfile={openOwnProfile} />;
    }

    // Calendar and the composer are always about a pet you own, never one from Explore.
    if ((screen === 'calendar' || screen === 'createMemory') && !currentPet?.isMine) {
      return <NoPetsScreen onGoToProfile={openOwnProfile} />;
    }

    switch (screen) {
      case 'home':
        return renderHome();

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
            pet={currentPet!}
            memories={memories}
            albums={albums}
            vaccines={vaccines}
            appointments={appointments}
            onBack={() => setScreen(petProfileReturn)}
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
            pet={currentPet!}
            events={calendarEvents.filter((event) => event.petId === currentPet?.id)}
          />
        );

      case 'userProfile':
        return (
          <UserProfileScreen
            user={viewedUser}
            pets={pets}
            followingPets={followingPets}
            currentUserId={profileId}
            onSignOut={() => {
              void signOut();
            }}
            onSelectPet={openPetProfile}
            onOpenCreate={openCreateMemory}
            onOpenAddPet={() => setIsAddPetModalOpen(true)}
            onFollowToggle={handleFollowToggle}
            onBack={
              viewedUser.id === currentUser.id
                ? undefined
                : () => setScreen(userProfileReturn)
            }
          />
        );

      case 'createMemory':
        return (
          <CreateMemoryScreen
            pet={currentPet!}
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
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onOpenCreate={openCreateMemory}
      />

      <AddPetModal
        isOpen={isAddPetModalOpen}
        onClose={() => setIsAddPetModalOpen(false)}
        onSavePet={handleAddPet}
      />
    </View>
  );
}

/** Decides whether the login screen or the app shell is mounted. */
function Root() {
  const auth = useSession();

  if (auth.status === 'loading') {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={COLORS.ink} />
      </View>
    );
  }

  if (!auth.session) return <AuthScreen />;

  return <AppShell profileId={auth.session.user.id} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
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
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },
});
