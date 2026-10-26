import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AddVaccineModal } from '../components/AddVaccineModal';
import { CreateAlbumModal } from '../components/CreateAlbumModal';
import { LoviCard } from '../components/LoviCard';
import { ManageAlbumMemoriesModal } from '../components/ManageAlbumMemoriesModal';
import { ScheduleAppointmentModal } from '../components/ScheduleAppointmentModal';
import { Sticker } from '../components/Sticker';
import {
  alpha,
  CARD_SURFACE,
  COLORS,
  DOCK_CLEARANCE,
  FONTS,
  INK_WASH,
  RADIUS,
  SCREEN_PADDING,
  SHADOWS,
  TEXT,
} from '../theme';
import type { Album, Appointment, LoviMemory, Pet, Vaccine } from '../types';

interface PetProfileScreenProps {
  pet: Pet;
  memories: LoviMemory[];
  albums: Album[];
  vaccines: Vaccine[];
  appointments: Appointment[];
  isOwnerView: boolean;
  onToggleOwnerView: () => void;
  onFollowToggle: (petId: string) => void;
  onOpenCreate: () => void;
  onOpenCalendar: () => void;
  onSelectPet: (petId: string) => void;
  onOpenOwnerProfile: (owner: Pet['owner']) => void;
  onSaveAppointment: (appointment: Omit<Appointment, 'id' | 'isUpcoming'>) => void;
  onSaveVaccine: (vaccine: Omit<Vaccine, 'id'>) => void;
  onCreateAlbum: (album: Omit<Album, 'id' | 'memoriesCount'>) => void;
  onToggleMemoryInAlbum: (memoryId: string, addToAlbum: boolean, albumId: string) => void;
}

type TabKey = 'recuerdos' | 'albumes' | 'vacunas' | 'turnos';

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/** `shadow-2xs` / `shadow-xs` from the reference — barely there, warm ink. */
const MICRO_SHADOW: ViewStyle = {
  shadowColor: COLORS.ink,
  shadowOpacity: 0.04,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
};

/** `0 16px 36px -6px rgba(40,43,10,0.08)` on the hero photo frame. */
const PHOTO_SHADOW: ViewStyle = {
  shadowColor: COLORS.ink,
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 3,
};

const LOCK_ON_INK = alpha(COLORS.ink, 0.6);
const LOCK_ON_FUCSIA = alpha(COLORS.parchment, 0.7);

export const PetProfileScreen: React.FC<PetProfileScreenProps> = ({
  pet,
  memories,
  albums,
  vaccines,
  appointments,
  isOwnerView,
  onToggleOwnerView,
  onFollowToggle,
  onOpenCreate,
  onOpenCalendar,
  onSelectPet,
  onOpenOwnerProfile,
  onSaveAppointment,
  onSaveVaccine,
  onCreateAlbum,
  onToggleMemoryInAlbum,
}) => {
  const [activeTab, setActiveTab] = React.useState<TabKey>('recuerdos');

  // One dedicated flag per modal — a vaccine action never opens the appointment sheet (and vice versa).
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = React.useState(false);
  const [isVaccineModalOpen, setIsVaccineModalOpen] = React.useState(false);
  const [isManageMemoriesModalOpen, setIsManageMemoriesModalOpen] = React.useState(false);
  const [isCreateAlbumModalOpen, setIsCreateAlbumModalOpen] = React.useState(false);

  const [selectedAlbumId, setSelectedAlbumId] = React.useState<string | null>(null);

  const petMemories = memories.filter((m) => m.petId === pet.id);
  const petAlbums = albums.filter((a) => a.petId === pet.id);
  const petVaccines = vaccines.filter((v) => v.petId === pet.id);
  const petAppointments = appointments.filter((a) => a.petId === pet.id && a.isUpcoming);
  const isActualOwner = pet.isMine && isOwnerView;

  const activeAlbum = selectedAlbumId ? albums.find((a) => a.id === selectedAlbumId) ?? null : null;
  const activeAlbumMemories = activeAlbum
    ? memories.filter((m) => m.albumId === activeAlbum.id)
    : [];

  const selectTab = (tab: TabKey) => {
    setActiveTab(tab);
    setSelectedAlbumId(null);
  };

  // Private tabs disappear for visitors — never leave a private panel mounted after the
  // owner switches to the public view.
  React.useEffect(() => {
    if (!isActualOwner && (activeTab === 'vacunas' || activeTab === 'turnos')) {
      setActiveTab('recuerdos');
      setSelectedAlbumId(null);
    }
  }, [isActualOwner, activeTab]);

  const renderAlbumMemories = () => {
    if (activeAlbumMemories.length === 0) {
      return (
        <View style={[styles.card, styles.emptyCardSmall, styles.albumEmptySpacing]}>
          <Ionicons name="folder-open" size={40} color={alpha(COLORS.fucsia, 0.5)} />
          <Text style={styles.emptySerifSmall}>Este álbum todavía no tiene recuerdos guardados.</Text>
          {isActualOwner ? (
            <Pressable
              onPress={() => setIsManageMemoriesModalOpen(true)}
              style={({ pressed }) => [styles.fucsiaSolidPill, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Agregar recuerdos ya creados al álbum"
            >
              <Text style={styles.fucsiaSolidPillLabel}>Agregar recuerdos ya creados</Text>
            </Pressable>
          ) : null}
        </View>
      );
    }

    return (
      <View style={styles.listGap16}>
        {activeAlbumMemories.map((memory) => (
          <LoviCard
            key={memory.id}
            memory={memory}
            pet={pet}
            onPetClick={onSelectPet}
            onFollowToggle={onFollowToggle}
          />
        ))}
      </View>
    );
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SCREEN_PADDING,
          paddingTop: 12,
          paddingBottom: DOCK_CLEARANCE,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy switcher */}
        <View style={styles.privacySwitcher}>
          <View style={styles.privacyLabel}>
            <Ionicons name="person-circle" size={16} color={COLORS.navy} />
            <Text style={styles.privacyText}>
              Modo:{' '}
              <Text style={styles.privacyMode}>
                {isActualOwner ? 'Dueño (Privado + Social)' : 'Visitante (Público)'}
              </Text>
            </Text>
          </View>

          <Pressable
            onPress={onToggleOwnerView}
            style={({ pressed }) => [styles.privacyButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Ver como ${isActualOwner ? 'Visitante' : 'Dueño'}`}
          >
            <Text style={styles.privacyButtonLabel}>
              Ver como {isActualOwner ? 'Visitante' : 'Dueño'}
            </Text>
          </Pressable>
        </View>

        {/* Profile header */}
        <View style={styles.hero}>
          <View style={styles.photoWrap}>
            <View style={styles.photoFrame}>
              <Image source={pet.avatar} style={styles.photo} resizeMode="cover" accessibilityLabel={pet.name} />
            </View>

            <View style={styles.heroStickerLeft}>
              <Sticker variant="butter">{pet.species}</Sticker>
            </View>

            {pet.isMine ? (
              <View style={styles.heroStickerRight}>
                <Sticker variant="fucsia">tu mascota</Sticker>
              </View>
            ) : null}
          </View>

          <View style={styles.identity}>
            <Text style={styles.petName}>{pet.name}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{pet.age}</Text>
              <Text style={styles.metaText}>·</Text>
              <Text style={styles.metaFollowers}>{pet.followersCount} seguidores</Text>
            </View>

            <Text style={styles.bio}>{pet.bio}</Text>
          </View>

          <View style={styles.heroActions}>
            <Pressable
              onPress={() => onOpenOwnerProfile(pet.owner)}
              style={({ pressed }) => [styles.ownerPill, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${pet.owner.name}`}
            >
              <Image source={pet.owner.avatar} style={styles.ownerAvatar} />
              <Text style={styles.ownerLabel}>
                su dueño <Text style={styles.ownerName}>{pet.owner.name}</Text>
              </Text>
              <Ionicons name="chevron-forward" size={14} color={INK_WASH.faint} />
            </Pressable>

            {!pet.isMine ? (
              <Pressable
                onPress={() => onFollowToggle(pet.id)}
                style={({ pressed }) => [
                  styles.followButton,
                  pet.isFollowing ? styles.followingButton : styles.notFollowingButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${pet.isFollowing ? 'Dejar de seguir' : 'Seguir'} a ${pet.name}`}
              >
                <Text
                  style={[
                    styles.followLabel,
                    pet.isFollowing ? styles.followingLabel : styles.notFollowingLabel,
                  ]}
                >
                  {pet.isFollowing ? 'Siguiendo a ' + pet.name : 'Seguir a ' + pet.name}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarContent}
          >
            <Pressable
              onPress={() => selectTab('recuerdos')}
              style={({ pressed }) => [
                styles.tab,
                activeTab === 'recuerdos' && styles.tabActiveDark,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === 'recuerdos' }}
            >
              <Text style={[styles.tabLabel, activeTab === 'recuerdos' && styles.tabLabelOnDark]}>
                Recuerdos ({petMemories.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => selectTab('albumes')}
              style={({ pressed }) => [
                styles.tab,
                activeTab === 'albumes' && styles.tabActiveDark,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === 'albumes' }}
            >
              <Text style={[styles.tabLabel, activeTab === 'albumes' && styles.tabLabelOnDark]}>
                Álbumes ({petAlbums.length})
              </Text>
            </Pressable>

            {isActualOwner ? (
              <>
                <Pressable
                  onPress={() => selectTab('vacunas')}
                  style={({ pressed }) => [
                    styles.tab,
                    styles.tabWithIcon,
                    activeTab === 'vacunas' && styles.tabActiveOrange,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeTab === 'vacunas' }}
                >
                  <Ionicons name="lock-closed" size={12} color={LOCK_ON_INK} />
                  <Text style={[styles.tabLabel, activeTab === 'vacunas' && styles.tabLabelOnOrange]}>
                    Vacunas ({petVaccines.length})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => selectTab('turnos')}
                  style={({ pressed }) => [
                    styles.tab,
                    styles.tabWithIcon,
                    activeTab === 'turnos' && styles.tabActiveFucsia,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeTab === 'turnos' }}
                >
                  <Ionicons name="lock-closed" size={12} color={LOCK_ON_FUCSIA} />
                  <Text style={[styles.tabLabel, activeTab === 'turnos' && styles.tabLabelOnFucsia]}>
                    Turnos ({petAppointments.length})
                  </Text>
                </Pressable>
              </>
            ) : null}
          </ScrollView>
        </View>

        {/* RECUERDOS */}
        {activeTab === 'recuerdos' ? (
          <View style={styles.listGap16}>
            {petMemories.length === 0 ? (
              <View style={[styles.card, styles.emptyCard]}>
                <Ionicons name="book" size={32} color={INK_WASH.faint} />
                <Text style={styles.emptySerif}>
                  Todavía no hay recuerdos registrados para {pet.name}.
                </Text>
                {isActualOwner ? (
                  <Pressable
                    onPress={onOpenCreate}
                    style={({ pressed }) => [styles.orangeSolidPill, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Guardar el primer Lovi"
                  >
                    <Text style={styles.orangeSolidPillLabelUpper}>Guardar el primer Lovi</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              petMemories.map((memory) => (
                <LoviCard
                  key={memory.id}
                  memory={memory}
                  pet={pet}
                  onPetClick={onSelectPet}
                  onFollowToggle={onFollowToggle}
                />
              ))
            )}
          </View>
        ) : null}

        {/* ÁLBUMES */}
        {activeTab === 'albumes' ? (
          activeAlbum ? (
            <View style={styles.listGap16}>
              <View style={styles.detailBar}>
                <Pressable
                  onPress={() => setSelectedAlbumId(null)}
                  style={({ pressed }) => [styles.backPill, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Volver a álbumes de ${pet.name}`}
                >
                  <Ionicons name="chevron-back" size={14} color={INK_WASH.medium} />
                  <Text style={styles.backLabel}>Volver a álbumes de {pet.name}</Text>
                </Pressable>

                {isActualOwner ? (
                  <Pressable
                    onPress={() => setIsManageMemoriesModalOpen(true)}
                    style={({ pressed }) => [styles.addMemoriesPill, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Agregar recuerdos al álbum"
                  >
                    <Ionicons name="add" size={14} color={COLORS.parchment} />
                    <Text style={styles.addMemoriesLabel}>Agregar recuerdos al álbum</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.bannerCard}>
                <View style={styles.bannerCoverWrap}>
                  <Image
                    source={activeAlbum.coverUrl}
                    style={styles.bannerCover}
                    resizeMode="cover"
                    accessibilityLabel={activeAlbum.title}
                  />
                  <View style={styles.bannerSticker}>
                    <Sticker variant="fucsia" textStyle={styles.stickerSmall}>
                      álbum de {pet.name}
                    </Sticker>
                  </View>
                </View>

                <View>
                  <View style={styles.bannerTitleRow}>
                    <Text style={styles.bannerTitle} numberOfLines={2}>
                      {activeAlbum.title}
                    </Text>
                    <View style={styles.countPillFucsia}>
                      <Text style={styles.countPillFucsiaLabel}>
                        {activeAlbumMemories.length} recuerdos
                      </Text>
                    </View>
                  </View>

                  {activeAlbum.description ? (
                    <Text style={styles.bannerDescription}>{activeAlbum.description}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.memoriesSection}>
                <View style={styles.memoriesHeader}>
                  <Text style={styles.memoriesTitle}>Recuerdos en esta colección</Text>

                  {isActualOwner ? (
                    <Pressable
                      onPress={() => setIsManageMemoriesModalOpen(true)}
                      style={({ pressed }) => [styles.manageLink, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Administrar recuerdos del álbum (${activeAlbumMemories.length})`}
                    >
                      <Ionicons name="options" size={12} color={COLORS.fucsia} />
                      <Text style={styles.manageLinkLabel}>
                        Administrar ({activeAlbumMemories.length})
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {renderAlbumMemories()}
              </View>
            </View>
          ) : (
            <View style={styles.listGap14}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>Álbumes de {pet.name}</Text>
                  <Text style={styles.sectionCaption}>
                    Colecciones temáticas y momentos favoritos
                  </Text>
                </View>

                {isActualOwner ? (
                  <Pressable
                    onPress={() => setIsCreateAlbumModalOpen(true)}
                    style={({ pressed }) => [styles.newAlbumPill, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Nuevo álbum"
                  >
                    <Ionicons name="add" size={14} color={COLORS.butter} />
                    <Text style={styles.newAlbumLabel}>Nuevo álbum</Text>
                  </Pressable>
                ) : null}
              </View>

              {petAlbums.length === 0 ? (
                <View style={[styles.card, styles.emptyCardSmall, styles.albumEmptySpacing]}>
                  <Ionicons name="folder-open" size={40} color={INK_WASH.faint} />
                  <Text style={styles.emptySerif}>
                    {pet.name} todavía no tiene álbumes creados.
                  </Text>
                  {isActualOwner ? (
                    <Pressable
                      onPress={() => setIsCreateAlbumModalOpen(true)}
                      style={({ pressed }) => [styles.fucsiaSolidPill, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Crear primer álbum"
                    >
                      <Text style={styles.fucsiaSolidPillLabel}>Crear primer álbum</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <View style={styles.albumsGrid}>
                  {petAlbums.map((album) => {
                    const countInThisAlbum = memories.filter((m) => m.albumId === album.id).length;

                    return (
                      <Pressable
                        key={album.id}
                        onPress={() => setSelectedAlbumId(album.id)}
                        style={({ pressed }) => [styles.albumCard, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`Abrir álbum ${album.title}`}
                      >
                        <View style={styles.albumCoverWrap}>
                          <Image
                            source={album.coverUrl}
                            style={styles.albumCover}
                            resizeMode="cover"
                          />
                          <View style={styles.albumCoverSticker}>
                            <Sticker variant="butter" textStyle={styles.stickerSmall}>
                              Álbum
                            </Sticker>
                          </View>
                        </View>

                        <Text style={styles.albumTitle} numberOfLines={1}>
                          {album.title}
                        </Text>
                        <Text style={styles.albumCount}>
                          {countInThisAlbum} {countInThisAlbum === 1 ? 'recuerdo' : 'recuerdos'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )
        ) : null}

        {/* VACUNAS */}
        {activeTab === 'vacunas' && isActualOwner ? (
          <View style={styles.listGap14}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Libreta sanitaria de {pet.name}</Text>
                <Text style={styles.sectionCaption}>
                  Control de dosis, revacunaciones y certificados
                </Text>
              </View>

              <View style={styles.privacyPillNavy}>
                <Text style={styles.privacyPillNavyLabel}>Privado del dueño</Text>
              </View>
            </View>

            {isActualOwner ? (
              <Pressable
                onPress={() => setIsVaccineModalOpen(true)}
                style={({ pressed }) => [styles.wideButtonOrange, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Registrar nueva vacuna"
              >
                <Ionicons name="medical" size={16} color={COLORS.ink} />
                <Text style={styles.wideButtonLabel}>Registrar nueva vacuna</Text>
              </Pressable>
            ) : null}

            {petVaccines.length > 0 ? (
              <View style={styles.vaccineList}>
                {petVaccines.map((vaccine, index) => (
                  <View
                    key={vaccine.id}
                    style={[styles.vaccineRow, index === 0 && styles.rowWithoutDivider]}
                  >
                    <View style={styles.vaccineLeft}>
                      <View style={styles.vaccineIcon}>
                        <Ionicons name="medical" size={20} color={COLORS.orange} />
                      </View>

                      <View style={styles.vaccineText}>
                        <Text style={styles.vaccineName} numberOfLines={2}>
                          {vaccine.name}
                        </Text>
                        <Text style={styles.vaccineMeta} numberOfLines={2}>
                          {vaccine.date}
                          {vaccine.notes ? ` · ${vaccine.notes}` : ''}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        vaccine.status === 'Al día'
                          ? styles.statusPillDay
                          : vaccine.status === 'Próxima dosis'
                            ? styles.statusPillNext
                            : styles.statusPillRepeat,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusLabel,
                          vaccine.status === 'Para repetir' && styles.statusLabelOnFucsia,
                        ]}
                      >
                        {vaccine.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* TURNOS */}
        {activeTab === 'turnos' && isActualOwner ? (
          <View style={styles.listGap16}>
            {isActualOwner ? (
              <Pressable
                onPress={() => setIsAppointmentModalOpen(true)}
                style={({ pressed }) => [styles.wideButtonFucsia, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Agendar nuevo turno"
              >
                <Ionicons name="calendar" size={16} color={COLORS.parchment} />
                <Text style={[styles.wideButtonLabel, styles.wideButtonLabelOnFucsia]}>
                  Agendar nuevo turno
                </Text>
              </Pressable>
            ) : null}

            <View style={styles.appointmentsBlock}>
              <View style={styles.appointmentsHeader}>
                <Text style={styles.appointmentsTitle}>Próximos turnos agendados</Text>
                <Text style={styles.appointmentsCount}>{petAppointments.length} citas</Text>
              </View>

              {petAppointments.length === 0 ? (
                <View style={[styles.card, styles.emptyCardSmall]}>
                  <Ionicons name="calendar" size={32} color={INK_WASH.faint} />
                  <Text style={styles.emptySerifSmall}>
                    No tenés turnos pendientes para {pet.name}.
                  </Text>
                  {isActualOwner ? (
                    <Pressable
                      onPress={() => setIsAppointmentModalOpen(true)}
                      style={({ pressed }) => [styles.fucsiaCompactPill, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Agendar primer turno"
                    >
                      <Text style={styles.fucsiaSolidPillLabel}>Agendar primer turno</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <View style={styles.appointmentsList}>
                  {petAppointments.map((appointment) => {
                    const dateParts = appointment.date.split('-');
                    const monthIdx = parseInt(dateParts[1], 10) - 1;
                    const monthLabel = MONTHS[monthIdx] || 'CITA';
                    const dayLabel = dateParts[2] || '—';

                    return (
                      <View key={appointment.id} style={styles.appointmentCard}>
                        <View style={styles.appointmentLeft}>
                          <View style={styles.dateBadge}>
                            <Text style={styles.dateMonth}>{monthLabel}</Text>
                            <Text style={styles.dateDay}>{dayLabel}</Text>
                          </View>

                          <View style={styles.appointmentText}>
                            <View style={styles.appointmentTitleRow}>
                              <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                              <View style={styles.typePill}>
                                <Text style={styles.typeLabel}>{appointment.type}</Text>
                              </View>
                            </View>

                            <Text style={styles.appointmentMeta}>
                              {appointment.location} · {appointment.time} hs
                            </Text>
                          </View>
                        </View>

                        <Ionicons name="chevron-forward" size={16} color={alpha(COLORS.ink, 0.3)} />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.calendarPillWrap}>
              <Pressable
                onPress={onOpenCalendar}
                style={({ pressed }) => [styles.calendarPill, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Ver calendario completo de ${pet.name}`}
              >
                <Ionicons name="calendar" size={16} color={COLORS.ink} />
                <Text style={styles.calendarPillLabel}>
                  Ver calendario completo de {pet.name}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Modal 1 — strictly appointment scheduling */}
      <ScheduleAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        pet={pet}
        onSaveAppointment={onSaveAppointment}
      />

      {/* Modal 2 — strictly vaccine registration */}
      <AddVaccineModal
        isOpen={isVaccineModalOpen}
        onClose={() => setIsVaccineModalOpen(false)}
        pet={pet}
        onSaveVaccine={onSaveVaccine}
      />

      {/* Modal 3 — manage already-created memories inside the open album */}
      {activeAlbum !== null ? (
        <ManageAlbumMemoriesModal
          isOpen={isManageMemoriesModalOpen}
          onClose={() => setIsManageMemoriesModalOpen(false)}
          album={activeAlbum}
          pet={pet}
          allPetMemories={petMemories}
          onToggleMemoryInAlbum={(memoryId: string, addToAlbum: boolean) =>
            onToggleMemoryInAlbum(memoryId, addToAlbum, activeAlbum.id)
          }
        />
      ) : null}

      {/* Modal 4 — create a new album for this pet */}
      <CreateAlbumModal
        isOpen={isCreateAlbumModalOpen}
        onClose={() => setIsCreateAlbumModalOpen(false)}
        pet={pet}
        onCreateAlbum={onCreateAlbum}
      />
    </>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },

  /* Privacy switcher */
  privacySwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: alpha(COLORS.navy, 0.1),
  },
  privacyLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  privacyText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    color: COLORS.navy,
    flexShrink: 1,
  },
  privacyMode: {
    fontWeight: '700',
  },
  privacyButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.parchment,
    ...MICRO_SHADOW,
  },
  privacyButtonLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: COLORS.ink,
  },

  /* Hero */
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  photoWrap: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  photoFrame: {
    padding: 8,
    backgroundColor: COLORS.parchment,
    borderRadius: RADIUS.xxxl,
    ...PHOTO_SHADOW,
  },
  photo: {
    width: 160,
    height: 160,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.cream,
  },
  heroStickerLeft: {
    position: 'absolute',
    bottom: -8,
    left: -8,
  },
  heroStickerRight: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  identity: {
    alignItems: 'center',
    gap: 4,
  },
  petName: {
    ...TEXT.display,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  metaText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
    color: INK_WASH.medium,
  },
  metaFollowers: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: COLORS.ink,
  },
  bio: {
    ...TEXT.body,
    fontSize: 12,
    lineHeight: 19,
    color: alpha(COLORS.ink, 0.85),
    textAlign: 'center',
    paddingTop: 6,
    paddingHorizontal: 16,
    maxWidth: 384,
  },
  heroActions: {
    paddingTop: 8,
    alignItems: 'center',
    gap: 10,
  },
  ownerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.parchment,
    ...MICRO_SHADOW,
  },
  ownerAvatar: {
    width: 16,
    height: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
  },
  ownerLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    color: INK_WASH.medium,
  },
  ownerName: {
    fontWeight: '600',
    color: COLORS.ink,
  },
  followButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  notFollowingButton: {
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
  },
  followingButton: {
    backgroundColor: COLORS.parchment,
    ...MICRO_SHADOW,
  },
  followLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  notFollowingLabel: {
    color: COLORS.parchment,
  },
  followingLabel: {
    color: alpha(COLORS.ink, 0.8),
  },

  /* Tab bar */
  tabBar: {
    backgroundColor: COLORS.parchment,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
    padding: 4,
    ...MICRO_SHADOW,
  },
  tabBarContent: {
    alignItems: 'center',
    gap: 6,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  tabWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabActiveDark: {
    backgroundColor: COLORS.ink,
    ...MICRO_SHADOW,
  },
  tabActiveOrange: {
    backgroundColor: COLORS.orange,
    ...MICRO_SHADOW,
  },
  tabActiveFucsia: {
    backgroundColor: COLORS.fucsia,
    ...MICRO_SHADOW,
  },
  tabLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: INK_WASH.medium,
  },
  tabLabelOnDark: {
    color: COLORS.parchment,
    fontWeight: '600',
  },
  tabLabelOnOrange: {
    color: COLORS.ink,
    fontWeight: '600',
  },
  tabLabelOnFucsia: {
    color: COLORS.parchment,
    fontWeight: '600',
  },

  /* Shared surfaces */
  card: {
    ...CARD_SURFACE,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyCardSmall: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  albumEmptySpacing: {
    marginVertical: 8,
    padding: 32,
    gap: 12,
  },
  emptySerif: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    lineHeight: 22,
    fontStyle: 'italic',
    color: COLORS.ink,
    textAlign: 'center',
  },
  emptySerifSmall: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    color: COLORS.ink,
    textAlign: 'center',
  },
  listGap14: {
    gap: 14,
  },
  listGap16: {
    gap: 16,
  },
  rowWithoutDivider: {
    borderTopWidth: 0,
  },
  stickerSmall: {
    fontSize: 9,
    lineHeight: 12,
  },

  /* Solid pills */
  orangeSolidPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.orange,
    ...SHADOWS.orangeGlow,
  },
  orangeSolidPillLabelUpper: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.ink,
  },
  fucsiaSolidPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
  },
  fucsiaCompactPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
  },
  fucsiaSolidPillLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.parchment,
  },

  /* Album detail */
  detailBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.parchment,
    ...MICRO_SHADOW,
  },
  backLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: INK_WASH.medium,
  },
  addMemoriesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
  },
  addMemoriesLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.parchment,
  },
  bannerCard: {
    ...CARD_SURFACE,
    borderRadius: RADIUS.xxl,
    padding: 16,
    gap: 12,
  },
  bannerCoverWrap: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: alpha(COLORS.ink, 0.05),
  },
  bannerCover: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  bannerSticker: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  bannerTitle: {
    ...TEXT.title,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    flexShrink: 1,
  },
  countPillFucsia: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: alpha(COLORS.fucsia, 0.1),
  },
  countPillFucsiaLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: COLORS.fucsia,
  },
  bannerDescription: {
    ...TEXT.body,
    fontSize: 12,
    lineHeight: 18,
    color: alpha(COLORS.ink, 0.75),
    marginTop: 4,
  },
  memoriesSection: {
    gap: 12,
    paddingTop: 4,
  },
  memoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: alpha(COLORS.ink, 0.06),
    paddingBottom: 6,
  },
  memoriesTitle: {
    ...TEXT.subtitle,
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
  },
  manageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manageLinkLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.fucsia,
  },

  /* Album grid */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 4,
  },
  sectionHeaderText: {
    flexShrink: 1,
    gap: 2,
  },
  sectionTitle: {
    ...TEXT.subtitle,
    fontSize: 16,
    lineHeight: 21,
  },
  sectionCaption: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 15,
    color: alpha(COLORS.ink, 0.6),
  },
  newAlbumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.dock,
    ...SHADOWS.darkGlow,
  },
  newAlbumLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.parchment,
  },
  albumsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  albumCard: {
    width: '48%',
    ...CARD_SURFACE,
    padding: 12,
  },
  albumCoverWrap: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: alpha(COLORS.ink, 0.05),
  },
  albumCover: {
    width: '100%',
    aspectRatio: 1,
  },
  albumCoverSticker: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  albumTitle: {
    ...TEXT.subtitle,
    fontSize: 13,
    lineHeight: 18,
  },
  albumCount: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: alpha(COLORS.ink, 0.5),
    marginTop: 2,
  },

  /* Vacunas */
  privacyPillNavy: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: alpha(COLORS.navy, 0.1),
  },
  privacyPillNavyLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: COLORS.navy,
  },
  wideButtonOrange: {
    width: '100%',
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.orangeGlow,
  },
  wideButtonFucsia: {
    width: '100%',
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.fucsia,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.fucsiaGlow,
  },
  wideButtonLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.ink,
  },
  wideButtonLabelOnFucsia: {
    color: COLORS.parchment,
  },
  vaccineList: {
    ...CARD_SURFACE,
    overflow: 'hidden',
  },
  vaccineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: alpha(COLORS.ink, 0.06),
  },
  vaccineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  vaccineIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: alpha(COLORS.orange, 0.2),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  vaccineText: {
    flexShrink: 1,
    gap: 1,
  },
  vaccineName: {
    ...TEXT.subtitle,
    fontSize: 13,
    lineHeight: 18,
  },
  vaccineMeta: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    color: alpha(COLORS.ink, 0.55),
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    flexShrink: 0,
  },
  statusPillDay: {
    backgroundColor: alpha(COLORS.ink, 0.08),
  },
  statusPillNext: {
    backgroundColor: alpha(COLORS.orange, 0.25),
  },
  statusPillRepeat: {
    backgroundColor: COLORS.fucsia,
  },
  statusLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: COLORS.ink,
  },
  statusLabelOnFucsia: {
    color: COLORS.parchment,
  },

  /* Turnos */
  appointmentsBlock: {
    gap: 10,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  appointmentsTitle: {
    ...TEXT.subtitle,
    fontSize: 13,
    lineHeight: 18,
  },
  appointmentsCount: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: alpha(COLORS.ink, 0.5),
  },
  appointmentsList: {
    gap: 10,
  },
  appointmentCard: {
    ...CARD_SURFACE,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexShrink: 1,
  },
  dateBadge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.fucsia,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...SHADOWS.fucsiaGlow,
  },
  dateMonth: {
    fontFamily: FONTS.sans,
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: COLORS.parchment,
    opacity: 0.9,
  },
  dateDay: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
    color: COLORS.parchment,
  },
  appointmentText: {
    flexShrink: 1,
    gap: 2,
  },
  appointmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentTitle: {
    ...TEXT.subtitle,
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cream,
    flexShrink: 0,
  },
  typeLabel: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: alpha(COLORS.ink, 0.6),
  },
  appointmentMeta: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    color: alpha(COLORS.ink, 0.6),
  },
  calendarPillWrap: {
    paddingTop: 8,
  },
  calendarPill: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.parchment,
    ...MICRO_SHADOW,
  },
  calendarPillLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.ink,
  },
});
