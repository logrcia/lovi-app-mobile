import React, { useState } from "react";
import {
  StatusBar,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";

const PALETTE = {
  orange: "#F39D23",
  fucsia: "#D51993",
  cream: "#F9F2E4",
  ink: "#282B0A",
  butter: "#F5D244",
  navy: "#294EA7",
  parchment: "#FFFBF0",
};

const CURRENT_MOCK_USER_ID = "user-abril";
const PAGE_SIZE = 6;

type MockPet = {
  id: string;
  ownerId: string;
  name: string;
  especie: string;
  followerCount: number;
  description: string;
  ageLabel: string;
};

type MockLovi = {
  id: string;
  petId: string;
  title: string;
  description: string | null;
  createdAt: string;
  media: Array<{ id: string; type: string; url: string }>;
};

type MockUser = {
  id: string;
  nombre: string;
};

const MOCK_PETS: MockPet[] = [
  { id: "pet-vitto", ownerId: CURRENT_MOCK_USER_ID, name: "Vitto", especie: "perro", followerCount: 242, description: "Golden retriever, guardián de la casa.", ageLabel: "3 años" },
  { id: "pet-luna", ownerId: CURRENT_MOCK_USER_ID, name: "Luna", especie: "gata", followerCount: 80, description: "Negra, chiquita y bicolor.", ageLabel: "3 años" },
  { id: "pet-milo", ownerId: CURRENT_MOCK_USER_ID, name: "Milo", especie: "gato", followerCount: 125, description: "Atajante, el más grande de los tres.", ageLabel: "6 años" },
  { id: "pet-mora", ownerId: "user-lola", name: "Mora", especie: "perro", followerCount: 318, description: "Border collie medio desastrada.", ageLabel: "6 años" },
  { id: "pet-coco", ownerId: "user-lola", name: "Coco", especie: "gata", followerCount: 47, description: "Café con patas blancas.", ageLabel: "3 años" },
  { id: "pet-nina", ownerId: "user-sol", name: "Nina", especie: "coneja", followerCount: 89, description: "Blanca con una oreja caída.", ageLabel: "3 años" },
  { id: "pet-pipi", ownerId: "user-sol", name: "Pipi", especie: "perro", followerCount: 12, description: "El más pequeño y ruidoso.", ageLabel: "2 años" },
  { id: "pet-roco", ownerId: "user-sol", name: "Roco", especie: "loro", followerCount: 203, description: "Habla poco pero lo que dice se escucha.", ageLabel: "8 años" },
];

const MOCK_USERS: Record<string, MockUser> = {
  "user-abril": { id: "user-abril", nombre: "Abril" },
  "user-lola": { id: "user-lola", nombre: "Lola" },
  "user-sol": { id: "user-sol", nombre: "Sol" },
};

const INITIAL_LOVIS: MockLovi[] = [
  { id: "lovi-01", petId: "pet-vitto", title: "El primer día en el jardín", description: "Lo sacamos por la mañana temprano, con el pasto todavía frío.", createdAt: "2026-09-30T09:12:00.000Z", media: [] },
  { id: "lovi-02", petId: "pet-milo", title: "Se quedó dormido en el sillón", description: "Lo encontré en EXACTAMENTE el cuadrado de sol que le toca.", createdAt: "2026-09-28T16:40:00.000Z", media: [] },
  { id: "lovi-03", petId: "pet-luna", title: "La caja nueva", description: "Llegó de la tienda y en diez minutos ya era suya.", createdAt: "2026-09-27T11:05:00.000Z", media: [] },
  { id: "lovi-04", petId: "pet-vitto", title: "Nadar es su segundo nombre", description: "El charco de pileta ya tiene dueño y no piensa compartirlo.", createdAt: "2026-09-25T18:22:00.000Z", media: [] },
  { id: "lovi-05", petId: "pet-milo", title: "Un thinking de seasons", description: "No sé qué estaba pensando.", createdAt: "2026-09-24T20:15:00.000Z", media: [] },
  { id: "lovi-06", petId: "pet-luna", title: "Se subió al estante más alto", description: "No sé cómo llegó ahí.", createdAt: "2026-09-22T13:30:00.000Z", media: [] },
  { id: "lovi-07", petId: "pet-mora", title: "Corriendo en círculos", description: "Antes de dormir, siempre.", createdAt: "2026-09-29T21:50:00.000Z", media: [] },
  { id: "lovi-08", petId: "pet-coco", title: "Posición oficial: hombros", description: "La encontré así cuando llegué.", createdAt: "2026-09-26T19:10:00.000Z", media: [] },
  { id: "lovi-09", petId: "pet-nina", title: "Su primer huerto", description: "Le plantamos lechuga y en una semana ya estaba limpio.", createdAt: "2026-09-28T08:44:00.000Z", media: [] },
  { id: "lovi-10", petId: "pet-roco", title: "Dijo 'chau' y era para mí", description: "Le doy chai, dice.", createdAt: "2026-09-23T15:00:00.000Z", media: [] },
  { id: "lovi-22", petId: "pet-chispa", title: "Estante alto, conquista total", description: "Llegó arriba de un salto.", createdAt: "2026-09-30T11:30:00.000Z", media: [] },
  { id: "lovi-23", petId: "pet-teo", title: "Se acomodó en diez segundos", description: "Llegó, se dio vuelta dos veces y se durmió.", createdAt: "2026-09-27T15:20:00.000Z", media: [] },
  { id: "lovi-24", petId: "pet-nube", title: "Bocatel y sol, combo perfecto", description: "El plan de la tarde de todos los veranos.", createdAt: "2026-09-24T16:45:00.000Z", media: [] },
  { id: "lovi-25", petId: "pet-pipi", title: "Puppy finds the toilet", description: "Bebió del agua del inodoro.", createdAt: "2026-09-21T09:05:00.000Z", media: [] },
];

const FOLLOWED_PET_IDS = ["pet-mora", "pet-nina", "pet-roco"];

const MOCK_ALBUMS: Array<{ id: string; petId: string; title: string; cover: string; loviCount: number; createdAt: string }> = [
  { id: "album-01", petId: "pet-vitto", title: "Cachorro", cover: "", loviCount: 3, createdAt: "2025-08-10T10:00:00.000Z" },
  { id: "album-02", petId: "pet-vitto", title: "Verano en la costa", cover: "", loviCount: 2, createdAt: "2026-01-15T10:00:00.000Z" },
  { id: "album-03", petId: "pet-luna", title: "La colección de cajas", cover: "", loviCount: 2, createdAt: "2025-11-02T10:00:00.000Z" },
  { id: "album-04", petId: "pet-milo", title: "Temporada de atajadas", cover: "", loviCount: 1, createdAt: "2024-05-20T10:00:00.000Z" },
];

const MOCK_VACCINES: Array<{ id: string; petId: string; name: string; appliedAt: string; nextDueAt: string | null; notes: string | null }> = [
  { id: "vac-1", petId: "pet-vitto", name: "Antirrábica", appliedAt: "2026-03-14", nextDueAt: "2027-03-14", notes: "La espero parada, sin moverse." },
  { id: "vac-2", petId: "pet-vitto", name: "Quíntuple", appliedAt: "2026-03-14", nextDueAt: "2027-03-14", notes: "Refuerzo anual." },
  { id: "vac-3", petId: "pet-milo", name: "Antirrábica", appliedAt: "2025-11-22", nextDueAt: "2026-11-22", notes: null },
  { id: "vac-4", petId: "pet-luna", name: "Triple felina", appliedAt: "2025-01-08", nextDueAt: "2026-01-08", notes: "Vencida. Pendiente de agendar." },
  { id: "vac-5", petId: "pet-mora", name: "Parvovirus", appliedAt: "2026-06-02", nextDueAt: "2027-06-02", notes: null },
];

const MOCK_APPOINTMENTS: Array<{ id: string; petId: string; title: string; at: string; kind: string; notes: string | null }> = [
  { id: "apt-1", petId: "pet-vitto", title: "Control anual", at: "2026-10-06T15:30:00.000Z", kind: "veterinario", notes: "Vacuna al día y control de peso." },
  { id: "apt-2", petId: "pet-luna", title: "Corte de uñas", at: "2026-10-09T11:00:00.000Z", kind: "peluquería", notes: null },
  { id: "apt-3", petId: "pet-milo", title: "Vacunación anual", at: "2026-11-22T17:00:00.000Z", kind: "vacunación", notes: null },
  { id: "apt-4", petId: "pet-mora", title: "Fisioterapia", at: "2026-10-12T10:00:00.000Z", kind: "veterinario", notes: "Sesión 4 de 8." },
  { id: "apt-5", petId: "pet-nina", title: "Control de peso", at: "2026-09-20T16:00:00.000Z", kind: "veterinario", notes: null },
];

function isOwnPet(ownerId: string) { return ownerId === CURRENT_MOCK_USER_ID; }
function isFollowed(petId: string) { return FOLLOWED_PET_IDS.includes(petId); }
function petName(petId: string) { const p = MOCK_PETS.find((x) => x.id === petId); return p ? p.name : petId; }
function petEspecie(petId: string) { const p = MOCK_PETS.find((x) => x.id === petId); return p ? p.especie : ""; }
function petFollowerCount(petId: string) { const p = MOCK_PETS.find((x) => x.id === petId); return p ? p.followerCount : 0; }
function ownerName(petId: string) { const p = MOCK_PETS.find((x) => x.id === petId); if (!p) return ""; const u = MOCK_USERS[p.ownerId]; return u ? u.nombre : ""; }
function petColor(seed: string): string {
  const keys = ["orange", "fucsia", "cream", "ink", "butter", "navy", "parchment"];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return PALETTE[keys[Math.abs(h) % keys.length] as keyof typeof PALETTE];
}
function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
function formatFullDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

type Screen = "home" | "explore" | "pet-detail" | "create-lovi" | "user-profile" | "pet-albums" | "pet-vaccines" | "pet-appointments" | "pet-calendar";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<Screen>("explore");
  const [lovis, setLovis] = useState<MockLovi[]>(INITIAL_LOVIS);

  const ownLovis = lovis.filter((l) => isOwnPet(l.petId));
  const followedLovis = lovis.filter((l) => !isOwnPet(l.petId) && isFollowed(l.petId));
  const recommendedLovis = lovis.filter((l) => !isOwnPet(l.petId) && !isFollowed(l.petId));

  const feed = [...ownLovis, ...followedLovis].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recommended = recommendedLovis.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const merged: Array<{ kind: "feed" | "rec"; lovi: MockLovi }> = [];
  let f = 0;
  let r = 0;
  while (f < feed.length || r < recommended.length) {
    for (let i = 0; i < PAGE_SIZE / 2 && f < feed.length; i++) merged.push({ kind: "feed", lovi: feed[f++] });
    if (r < recommended.length) merged.push({ kind: "rec", lovi: recommended[r++] });
  }

  const createLovi = (newLovi: MockLovi) => {
    setLovis((prev) => [newLovi, ...prev]);
    setScreen("pet-detail");
    setSelectedPetId(newLovi.petId);
  };

  const setScreenWithReturn = (s: Screen, returnTo?: Screen) => {
    setScreen(s);
    if (returnTo) setReturnTo(returnTo);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {screen === "home" ? <HomeScreen merged={merged} setScreen={setScreenWithReturn} setSelectedPetId={setSelectedPetId} /> : null}
      {screen === "explore" ? <ExploreScreen setScreen={setScreenWithReturn} setSelectedPetId={setSelectedPetId} /> : null}
      {screen === "pet-detail" && selectedPetId ? <PetDetailScreen petId={selectedPetId} setScreen={setScreenWithReturn} setCreateFormVisible={() => {}} lovis={lovis} setLovis={setLovis} returnTo={returnTo} /> : null}
      {screen === "create-lovi" && selectedPetId ? <CreateLoviScreen petId={selectedPetId} setScreen={setScreenWithReturn} setCreateFormVisible={() => {}} onCreate={createLovi} /> : null}
      {screen === "user-profile" ? <UserProfileScreen setScreen={setScreenWithReturn} setSelectedPetId={setSelectedPetId} /> : null}
      {screen === "pet-albums" && selectedPetId ? <PetAlbumsScreen petId={selectedPetId} setScreen={setScreenWithReturn} /> : null}
      {screen === "pet-vaccines" && selectedPetId ? <PetVaccinesScreen petId={selectedPetId} setScreen={setScreenWithReturn} /> : null}
      {screen === "pet-appointments" && selectedPetId ? <PetAppointmentsScreen petId={selectedPetId} setScreen={setScreenWithReturn} /> : null}
      {screen === "pet-calendar" && selectedPetId ? <PetCalendarScreen petId={selectedPetId} setScreen={setScreenWithReturn} /> : null}

      {screen !== "pet-detail" && screen !== "create-lovi" && screen !== "user-profile" && screen !== "pet-albums" && screen !== "pet-vaccines" && screen !== "pet-appointments" && screen !== "pet-calendar" && (
        <View style={styles.tabBar}>
          <TouchableTab active={screen === "home"} label="Home" onPress={() => setScreen("home")} />
          <TouchableTab active={screen === "explore"} label="Explorar" onPress={() => setScreen("explore")} />
          <TouchableTab active={String(screen) === "user-profile"} label="Mi perfil" onPress={() => setScreen("user-profile")} />
        </View>
      )}
    </View>
  );
}

function TouchableTab({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function PetAvatar({ petId, size = 44 }: { petId: string; size?: number }) {
  const color = petColor(petId);
  const initial = (petName(petId).trim()[0] ?? "?").toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, backgroundColor: color, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.35, fontWeight: "bold", color: PALETTE.ink }]}>{initial}</Text>
    </View>
  );
}

function FeedCard({ item }: { item: { kind: "feed" | "rec"; lovi: MockLovi; tilt?: number } }) {
  const lovi = item.lovi;
  const isRec = item.kind === "rec";
  const pName = petName(lovi.petId);
  const pEsp = petEspecie(lovi.petId);
  const pFc = petFollowerCount(lovi.petId);
  const oName = ownerName(lovi.petId);

  return (
    <View style={[styles.card, item.tilt === 1 && styles.tiltRight, item.tilt === -1 && styles.tiltLeft]}>
      <View style={styles.cardHeader}>
        <View style={styles.petRow}>
          <View style={[styles.avatar, { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: PALETTE.ink }]}>
            <Text style={[styles.avatarText, { fontSize: 15, fontWeight: "bold", color: PALETTE.ink }]}>{pName.trim()[0]?.toUpperCase()}</Text>
          </View>
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{pName}</Text>
            <Text style={styles.petSpecies}>{pEsp} · {pFc} seg.</Text>
          </View>
        </View>
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>{formatShortDate(lovi.createdAt)}</Text>
          {isRec && (
            <View style={styles.recBadge}>
              <Text style={styles.recText}>De cuentas que no seguís</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.ownerRow}>
        <View style={styles.ownerLinkRow}>
          <View style={[styles.avatar, { width: 24, height: 24, backgroundColor: petColor(ownerName(lovi.petId) ? "user" : "user") }]}>
            <Text style={[styles.avatarText, { fontSize: 9, fontWeight: "bold", color: PALETTE.ink }]}>{(oName.trim()[0] ?? "?").toUpperCase()}</Text>
          </View>
          <Text style={styles.ownerName}>{oName}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {lovi.media.length === 0 && <Text style={styles.textOnly}>solo palabras</Text>}
        <Text style={styles.cardTitle}>{lovi.title}</Text>
        {lovi.description && <Text style={styles.description}>{lovi.description}</Text>}
      </View>
    </View>
  );
}

function HomeScreen({ merged, setScreen, setSelectedPetId }: { merged: Array<{ kind: "feed" | "rec"; lovi: MockLovi }>; setScreen: (s: Screen, returnTo?: Screen) => void; setSelectedPetId: (id: string | null) => void }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  const shown = merged.slice(0, visible);
  const hasMore = visible < merged.length;

  const ownPets = MOCK_PETS.filter((p) => p.ownerId === CURRENT_MOCK_USER_ID);

  return (
    <View style={[styles.container, { paddingTop: 56 }]}>
      <View style={styles.header}>
        <Text style={styles.profileSticker}>tu diario social</Text>
        <Text style={styles.title}>
          Hola, <Text style={styles.titleName}>Abril</Text>
        </Text>
        <Text style={styles.subtitle}>
          Los recuerdos de tus mascotas y de las que seguís, mezclados en una
          sola línea de tiempo.
        </Text>
      </View>

      <View style={styles.petsSection}>
        <Text style={styles.petsSectionTitle}>Tus mascotas</Text>
        <FlatList
          data={ownPets}
          renderItem={({ item }) => (
            <PetRow pet={item} onToggleFollow={() => {}} onPressPet={(id) => { setSelectedPetId(id); setScreen("pet-detail", "user-profile"); }} isOwnPet />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ownPetsListContent}
          horizontal
        />
      </View>

      {shown.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Todavía no hay nada en tu feed</Text>
          <Text style={styles.emptyDesc}>
            Seguí una mascota desde Explorar y sus recuerdos van a aparecer
            acá, mezclados con los tuyos.
          </Text>
        </View>
      ) : (
        <FlatList
          data={shown}
          renderItem={({ item }) => <FeedCard item={item} />}
          keyExtractor={(item) => item.lovi.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.loadMoreContainer}>
                <Text style={styles.loadMoreText}>bajá para seguir loviando…</Text>
              </View>
            ) : (
              <View style={styles.endContainer}>
                <Text style={styles.endText}>llegaste al final · por ahora</Text>
              </View>
            )
          }
          onEndReached={() => {
            if (hasMore) {
              setVisible((v) => Math.min(v + PAGE_SIZE, merged.length));
            }
          }}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

function ExploreScreen({
  setScreen,
  setSelectedPetId,
}: {
  setScreen: (s: Screen, returnTo?: Screen) => void;
  setSelectedPetId: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");

  const discoverable = MOCK_PETS.filter((p) => p.ownerId !== CURRENT_MOCK_USER_ID);
  const normalized = query.toLowerCase().trim();
  const results = discoverable.filter(
    (p) => !isFollowed(p.id) && petName(p.id).toLowerCase().includes(normalized),
  );

  return (
    <View style={[styles.container, { paddingTop: 56 }]}>
      <View style={styles.header}>
        <Text style={styles.profileSticker}>descubrir</Text>
        <Text style={styles.title}>Explorar mascotas</Text>
        <Text style={styles.subtitle}>
          Cada mascota es una entidad con sus propios seguidores. Seguí solo
          las que te interesen: las demás no aparecen en tu Home.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar mascota por nombre…"
            value={query}
            onChangeText={setQuery}
          />
        </View>
        {normalized !== "" && results.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setQuery("")}>
            <Text style={styles.clearText}>Limpiar búsqueda</Text>
          </TouchableOpacity>
        )}
      </View>

      {normalized !== "" && results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No se encontró ninguna mascota con ese nombre</Text>
          <Text style={styles.emptyDesc}>Probá con otro nombre o revisá cómo escribiste.</Text>
          <TouchableOpacity style={styles.clearButton} onPress={() => setQuery("")}>
            <Text style={styles.clearText}>Limpiar búsqueda</Text>
          </TouchableOpacity>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Ya seguís a todas las mascotas</Text>
          <Text style={styles.emptyDesc}>Tu Home tiene todo el contenido disponible del prototipo.</Text>
        </View>
      ) : (
        <>
          <View style={styles.countContainer}>
            <Text style={styles.countText}>{results.length} para descubrir</Text>
          </View>
          <FlatList
            data={results}
            renderItem={({ item }) => (
              <PetRow pet={item} onToggleFollow={() => {}} onPressPet={(id) => { setSelectedPetId(id); setScreen("pet-detail", "explore"); }} />
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}
    </View>
  );
}

function PetRow({ pet, onToggleFollow, onPressPet, isOwnPet }: { pet: MockPet; onToggleFollow: (id: string) => void; onPressPet: (id: string, returnTo?: string) => void; isOwnPet?: boolean }) {
  const isFollowedLocal = isFollowed(pet.id);
  const pName = petName(pet.id);
  const pEsp = petEspecie(pet.id);
  const pFc = petFollowerCount(pet.id);
  const oName = ownerName(pet.id);

  return (
    <View style={styles.rowContainer}>
      <View style={styles.rowContent}>
        <View style={styles.rowLeft}>
          <TouchableOpacity onPress={() => onPressPet(pet.id, "explore")}>
            <PetAvatar petId={pet.id} size={56} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onPressPet(pet.id, "explore")}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{pName}</Text>
              <Text style={styles.rowEspecie}>{pEsp} · {pFc} seg.</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.rowRight}>
          <TouchableOpacity onPress={() => onPressPet(pet.id, "explore")}>
            <Text style={styles.ownerName}>{oName}</Text>
          </TouchableOpacity>
          {isOwnPet ? (
            <View style={[styles.followButton, styles.followButtonOwn]}>
              <Text style={styles.followButtonText}>Tu mascota</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.followButton, isFollowedLocal ? styles.followButtonFollowing : styles.followButtonFollow]}
              onPress={() => onToggleFollow(pet.id)}
            >
              <Text style={styles.followButtonText}>{isFollowedLocal ? "Siguiendo" : "Seguir"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {pet.description && <Text style={styles.rowDescription}>{pet.description}</Text>}
    </View>
  );
}

function PetDetailScreen({
  petId,
  setScreen,
  setCreateFormVisible,
  lovis,
  setLovis,
  returnTo,
}: {
  petId: string;
  setScreen: (s: Screen, returnTo?: Screen) => void;
  setCreateFormVisible: (v: boolean) => void;
  lovis: MockLovi[];
  setLovis: (v: MockLovi[]) => void;
  returnTo: Screen;
}) {
  const pet = MOCK_PETS.find((p) => p.id === petId);
  if (!pet) return null;

  const petLovis = lovis.filter((l) => l.petId === petId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const isOwner = pet.ownerId === CURRENT_MOCK_USER_ID;
  const isFollowedLocal = isFollowed(petId);
  const owner = MOCK_USERS[pet.ownerId];

  return (
    <View style={[styles.container, { paddingTop: 56 }]}>
      <View style={styles.backContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setScreen(returnTo)}>
          <Text style={styles.backText}>← volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.profileRow}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarBig, { backgroundColor: petColor(petId), borderRadius: 22, borderWidth: 2, borderColor: PALETTE.ink }]}>
              <Text style={[styles.avatarBigText, { fontSize: 36, fontWeight: "bold", color: PALETTE.ink }]}>{pet.name.trim()[0]?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.profileInfoWrapper}>
            <View style={styles.profileBadges}>
              <View style={[styles.profileSticker, { backgroundColor: petColor(petId) }]}>
                <Text style={styles.stickerText}>{pet.especie}</Text>
              </View>
              {isOwner && (
                <View style={[styles.profileSticker, { backgroundColor: PALETTE.orange }]}>
                  <Text style={styles.stickerText}>Tu mascota</Text>
                </View>
              )}
            </View>

            <Text style={styles.profileName}>{pet.name}</Text>

            <Text style={styles.profileAge}>
              {pet.ageLabel} · {pet.followerCount} {pet.followerCount === 1 ? "seguidor" : "seguidores"}
            </Text>

            <Text style={styles.profileDesc}>{pet.description}</Text>

            <View style={styles.followButtonRow}>
              {isOwner ? null : (
                <TouchableOpacity
                  style={[styles.followButton, isFollowedLocal ? styles.followButtonFollowing : styles.followButtonFollow]}
                  onPress={() => {}}
                >
                  <Text style={styles.followButtonText}>{isFollowedLocal ? "Siguiendo" : "Seguir"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.ownerRowProfile}>
        <Text style={styles.ownerLabel}>su dueño</Text>
        <View style={styles.ownerLinkRow}>
          <View style={[styles.avatar, { width: 24, height: 24, backgroundColor: petColor(owner ? owner.nombre : "user") }]}>
            <Text style={[styles.avatarText, { fontSize: 9, fontWeight: "bold", color: PALETTE.ink }]}>{(owner ? owner.nombre : "D").trim()[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.ownerNameProfile}>{owner ? owner.nombre : "Desconocido"}</Text>
        </View>
      </View>

      <View style={styles.sectionsNav}>
        <View style={[styles.sectionChip, { backgroundColor: PALETTE.orange }]} onPress={() => setScreen("pet-albums", "pet-detail")}>
          <Text style={styles.sectionChipText}>Álbumes · {MOCK_ALBUMS.filter(a => a.petId === petId).length}</Text>
        </View>
        <View style={[styles.sectionChip, { backgroundColor: PALETTE.butter }]} onPress={() => setScreen("pet-vaccines", "pet-detail")}>
          <Text style={styles.sectionChipText}>Vacunas · {MOCK_VACCINES.filter(v => v.petId === petId).length}</Text>
        </View>
        <View style={[styles.sectionChip, { backgroundColor: PALETTE.fucsia }]} onPress={() => setScreen("pet-appointments", "pet-detail")}>
          <Text style={styles.sectionChipText}>Turnos · {MOCK_APPOINTMENTS.filter(a => a.petId === petId).length}</Text>
        </View>
        <View style={[styles.sectionChip, { backgroundColor: PALETTE.navy }]} onPress={() => setScreen("pet-calendar", "pet-detail")}>
          <Text style={styles.sectionChipText}>Calendario</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recuerdos</Text>
        {isOwner && (
          <TouchableOpacity style={styles.createButton} onPress={() => { setScreen("create-lovi"); }}>
            <Text style={styles.createButtonText}>Crear recuerdo</Text>
          </TouchableOpacity>
        )}
      </View>

      {petLovis.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Esta mascota todavía no tiene recuerdos en el prototipo.</Text>
        </View>
      ) : (
        <FlatList
          data={petLovis}
          renderItem={({ item, index }) => (
            <PetDetailLoviCard lovi={item} tilt={index % 2 === 0 ? 1 : -1} />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

function CreateLoviScreen({
  petId: initialPetId,
  setScreen,
  setCreateFormVisible,
  onCreate,
}: {
  petId: string;
  setScreen: (s: Screen) => void;
  setCreateFormVisible: (v: boolean) => void;
  onCreate: (lovi: MockLovi) => void;
}) {
  const [petId, setPetId] = useState<string>(initialPetId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaKind, setMediaKind] = useState<"image" | "video" | "audio" | null>(null);

  const ownPets = MOCK_PETS.filter((p) => p.ownerId === CURRENT_MOCK_USER_ID);

  const saveLovi = () => {
    if (!title.trim()) return;
    const newLovi: MockLovi = {
      id: `lovi-local-${Date.now()}`,
      petId,
      title: title.trim(),
      description: description.trim() || null,
      createdAt: new Date().toISOString(),
      media: mediaKind ? [{ id: "m-1", type: mediaKind, url: "" }] : [],
    };
    onCreate(newLovi);
  };

  return (
    <View style={[styles.container, { paddingTop: 56 }]}>
      <View style={styles.backContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setScreen("pet-detail")}>
          <Text style={styles.backText}>← volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Nuevo recuerdo</Text>

        <View style={styles.formField}>
          <Text style={styles.formFieldLabel}>Mascota</Text>
          {ownPets.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.petChoice, petId === p.id && styles.petChoiceSelected]}
              onPress={() => setPetId(p.id)}
            >
              <View style={[styles.avatar, { width: 36, height: 36, backgroundColor: petColor(p.id) }]}>
                <Text style={[styles.avatarText, { fontSize: 14, fontWeight: "bold", color: PALETTE.ink }]}>{p.name.trim()[0]?.toUpperCase()}</Text>
              </View>
              <Text style={styles.petChoiceName}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formField}>
          <Text style={styles.formFieldLabel}>Título</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Título del recuerdo"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.formFieldLabel}>Descripción</Text>
          <TextInput
            style={[styles.formInput, { height: 80, textAlignVertical: "top" }]}
            placeholder="¿Qué pasó?"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.formFieldLabel}>Tipo de medio</Text>
          <View style={styles.mediaKindRow}>
            {["image", "video", "audio", null].map((k) => (
              <TouchableOpacity
                key={k || "none"}
                style={[styles.mediaKindChip, mediaKind === k && styles.mediaKindChipSelected]}
                onPress={() => setMediaKind(k as "image" | "video" | "audio" | null)}
              >
                <Text style={[styles.mediaKindChipText, mediaKind === k && styles.mediaKindChipTextSelected]}>
                  {k === "image" ? "Foto" : k === "video" ? "Video" : k === "audio" ? "Audio" : "Solo texto"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setScreen("pet-detail")}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={saveLovi}>
            <Text style={styles.saveButtonText}>Crear recuerdo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function UserProfileScreen({ setScreen, setSelectedPetId }: { setScreen: (s: Screen, returnTo?: Screen) => void; setSelectedPetId: (id: string | null) => void }) {
  const ownPets = MOCK_PETS.filter((p) => p.ownerId === CURRENT_MOCK_USER_ID);
  const totalLovis = INITIAL_LOVIS.filter((l) => ownPets.some((p) => p.id === l.petId)).length;

  return (
    <View style={[styles.container, { paddingTop: 56 }]}>
      <View style={styles.backContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setScreen("home")}>
          <Text style={styles.backText}>← volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.profileRow}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarBig, { backgroundColor: petColor("user-abril") }]}>
              <Text style={[styles.avatarBigText, { fontSize: 48, fontWeight: "bold", color: PALETTE.ink }]}>A</Text>
            </View>
          </View>
          <View style={styles.profileInfoWrapper}>
            <Text style={styles.profileName}>Abril</Text>
            <Text style={styles.profileAge}>
              {ownPets.length} mascota{ownPets.length !== 1 ? "s" : ""} · {totalLovis} recuerdo{totalLovis !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.profileDesc}>Tu perfil de Lovi. Todas tus mascotas y recuerdos en un solo lugar.</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionsNav}>
        <View style={[styles.sectionChip, { backgroundColor: PALETTE.orange }]}>
          <Text style={styles.sectionChipText}>Tus mascotas · {ownPets.length}</Text>
        </View>
        <View style={[styles.sectionChip, { backgroundColor: PALETTE.butter }]}>
          <Text style={styles.sectionChipText}>Tus recuerdos · {totalLovis}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tus mascotas</Text>
      </View>

      {ownPets.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No tienes mascotas todavía</Text>
          <Text style={styles.emptyDesc}>Agregá tu primera mascota desde el Home.</Text>
        </View>
      ) : (
        <FlatList
          data={ownPets}
          renderItem={({ item }) => (
            <PetRow pet={item} onToggleFollow={() => {}} onPressPet={(id) => { setSelectedPetId(id); setScreen("pet-detail", "user-profile"); }} isOwnPet />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

function PetDetailLoviCard({ lovi, tilt }: { lovi: MockLovi; tilt: number }) {
  return (
    <View style={[styles.petDetailLoviCard, tilt === 1 && { transform: [{ rotate: "0.4deg" }] }, tilt === -1 && { transform: [{ rotate: "-0.4deg" }] }]}>
      <Text style={styles.petDetailLoviTitle}>{lovi.title}</Text>
      {lovi.description && <Text style={styles.petDetailLoviDesc}>{lovi.description}</Text>}
      <Text style={styles.petDetailLoviDate}>{formatShortDate(lovi.createdAt)}</Text>
    </View>
  );
}

function PetAlbumsScreen({ petId, setScreen }: { petId: string; setScreen: (s: Screen, returnTo?: Screen) => void }) {
  const pet = MOCK_PETS.find((p) => p.id === petId);
  const petAlbums = MOCK_ALBUMS.filter((a) => a.petId === petId);
  if (!pet) return null;

  return (
    <View style={[styles.container, { paddingTop: 56 }]}>
      <View style={styles.backContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setScreen("pet-detail", "pet-detail")}>
          <Text style={styles.backText}>← volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.profileRow}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarBig, { backgroundColor: petColor(petId) }]}>
              <Text style={[styles.avatarBigText, { fontSize: 48, fontWeight: "bold", color: PALETTE.ink }]}>{pet.name.trim()[0]?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.profileInfoWrapper}>
            <Text style={styles.profileName}>{pet.name}</Text>
            <Text style={styles.profileEspecie}>{pet.especie}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionsNav}>
        <View style={[styles.sectionChip, { backgroundColor: PALETTE.orange }]} style={{ flex: 1 }}>
          <Text style={styles.sectionChipText}>Álbumes · {petAlbums.length}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Álbumes</Text>
      </View>

      {petAlbums.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Esta mascota no tiene álbumes todavía</Text>
        </View>
      ) : (
        <FlatList
          data={petAlbums}
          renderItem={({ item }) => (
            <View style={styles.albumCard}>
              <View style={styles.albumCover}>
                <View style={[styles.avatarBig, { backgroundColor: petColor(item.title) }]}>
                  <Text style={[styles.avatarBigText, { fontSize: 36, fontWeight: "bold", color: PALETTE.ink }]}>{item.title.trim()[0]?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.albumTitle}>{item.title}</Text>
              <Text style={styles.albumCount}>{item.loviCount} recuerdo{item.loviCount !== 1 ? "s" : ""}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
        />
      )}
    </View>
  );
}

function PetVaccinesScreen({ petId, setScreen }: { petId: string; setScreen: (s: Screen, returnTo?: Screen) => void }) {
  const pet = MOCK_PETS.find((p) => p.id === petId);
  const petVaccines = MOCK_VACCINES.filter((v) => v.petId === petId);
  if (!pet) return null;

  return (
    <View style={[styles.container, { paddingTop: 56 }]}>
      <View style={styles.backContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setScreen("pet-detail", "pet-detail")}>
          <Text style={styles.backText}>← volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.profileRow}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarBig, { backgroundColor: petColor(petId) }]}>
              <Text style={[styles.avatarBigText, { fontSize: 48, fontWeight: "bold", color: PALETTE.ink }]}>{pet.name.trim()[0]?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.profileInfoWrapper}>
            <Text style={styles.profileName}>{pet.name}</Text>
            <Text style={styles.profileEspecie}>{pet.especie}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionsNav}>
        <View style={[styles.sectionChip, { backgroundColor: PALETTE.butter }]} style={{ flex: 1 }}>
          <Text style={styles.sectionChipText}>Vacunas · {petVaccines.length}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vacunas</Text>
      </View>

      {petVaccines.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Esta mascota no tiene vacunas registradas</Text>
        </View>
      ) : (
        <FlatList
          data={petVaccines}
          renderItem={({ item }) => {
            const isOverdue = item.nextDueAt && new Date(item.nextDueAt) < new Date();
            const isExpiring = item.nextDueAt && new Date(item.nextDueAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            return (
              <View style={styles.vaccineCard}>
                <View style={styles.vaccineHeader}>
                  <Text style={styles.vaccineName}>{item.name}</Text>
                  <View style={[styles.vaccineStatus, isOverdue ? styles.vaccineOverdue : isExpiring ? styles.vaccineExpiring : styles.vaccineOk]}>
                    <Text style={styles.vaccineStatusText}>
                      {isOverdue ? "Para repetir" : isExpiring ? "Próxima dosis" : "Al día"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.vaccineDetail}>
                  Aplicada: {formatFullDate(item.appliedAt)}
                  {item.nextDueAt ? ` · Próxima: ${formatFullDate(item.nextDueAt)}` : ""}
                </Text>
                {item.notes && <Text style={styles.vaccineNotes}>{item.notes}</Text>}
              </View>
            );
          }}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}

function PetAppointmentsScreen({ petId, setScreen }: { petId: string; setScreen: (s: Screen, returnTo?: Screen) => void }) {
  const pet = MOCK_PETS.find((p) => p.id === petId);
  const petAppointments = MOCK_APPOINTMENTS.filter((a) => a.petId === petId);
  if (!pet) return null;

  const now = new Date();
  const upcoming = petAppointments.filter((a) => new Date(a.at) >= now).sort((a, b) => new Date(a.at) - new Date(b.at));
  const past = petAppointments.filter((a) => new Date(a.at) < now).sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <View style={[styles.container, { paddingTop: 56 }]}>
      <View style={styles.backContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setScreen("pet-detail", "pet-detail")}>
          <Text style={styles.backText}>← volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.profileRow}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarBig, { backgroundColor: petColor(petId) }]}>
              <Text style={[styles.avatarBigText, { fontSize: 48, fontWeight: "bold", color: PALETTE.ink }]}>{pet.name.trim()[0]?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.profileInfoWrapper}>
            <Text style={styles.profileName}>{pet.name}</Text>
            <Text style={styles.profileEspecie}>{pet.especie}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionsNav}>
        <View style={[styles.sectionChip, { backgroundColor: PALETTE.fucsia }]} style={{ flex: 1 }}>
          <Text style={styles.sectionChipText}>Turnos · {petAppointments.length}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Turnos</Text>
      </View>

      {petAppointments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Esta mascota no tiene turnos registrados</Text>
        </View>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <Text style={styles.sectionSubtitle}>Próximos</Text>
              <FlatList
                data={upcoming}
                renderItem={({ item }) => (
                  <View style={styles.appointmentCard}>
                    <View style={styles.appointmentDay}>
                      <Text style={styles.appointmentDayNumber}>{new Date(item.at).getDate()}</Text>
                      <Text style={styles.appointmentDayName}>{new Date(item.at).toLocaleDateString("es-AR", { weekday: "short", month: "short" }).toUpperCase()}</Text>
                    </View>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentTitle}>{item.title}</Text>
                      <Text style={styles.appointmentDetail}>{formatFullDate(item.at)} · {formatTime(item.at)}</Text>
                      <Text style={styles.appointmentKind}>{item.kind}</Text>
                      {item.notes && <Text style={styles.appointmentNotes}>{item.notes}</Text>}
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.id}
              />
            </>
          )}
          {past.length > 0 && (
            <>
              <Text style={styles.sectionSubtitle}>Anteriores</Text>
              <FlatList
                data={past}
                renderItem={({ item }) => (
                  <View style={[styles.appointmentCard, styles.pastAppointment]}>
                    <View style={styles.appointmentDay}>
                      <Text style={styles.appointmentDayNumber}>{new Date(item.at).getDate()}</Text>
                      <Text style={styles.appointmentDayName}>{new Date(item.at).toLocaleDateString("es-AR", { weekday: "short", month: "short" }).toUpperCase()}</Text>
                    </View>
                    <View style={styles.appointmentInfo}>
                      <Text style={[styles.appointmentTitle, styles.pastTitle]}>{item.title}</Text>
                      <Text style={styles.appointmentDetail}>{formatFullDate(item.at)} · {formatTime(item.at)}</Text>
                      <Text style={[styles.appointmentKind, styles.pastKind]}>{item.kind}</Text>
                      {item.notes && <Text style={[styles.appointmentNotes, styles.pastNotes]}>{item.notes}</Text>}
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.id}
              />
            </>
          )}
        </>
      )}
    </View>
  );
}

function PetCalendarScreen({ petId, setScreen }: { petId: string; setScreen: (s: Screen, returnTo?: Screen) => void }) {
  const pet = MOCK_PETS.find((p) => p.id === petId);
  if (!pet) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const eventsByDay: Record<string, Array<{ kind: string; label: string; color: string }>> = {};

  const addEvent = (date: Date, kind: string, label: string, color: string) => {
    const key = date.toISOString().split("T")[0];
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push({ kind, label, color });
  };

  INITIAL_LOVIS.forEach((l) => {
    if (l.petId === petId) addEvent(new Date(l.createdAt), "lovi", l.title, PALETTE.butter);
  });
  MOCK_VACCINES.forEach((v) => {
    if (v.petId !== petId) return;
    if (v.nextDueAt) addEvent(new Date(v.nextDueAt), "vaccine", v.name, PALETTE.navy);
    addEvent(new Date(v.appliedAt), "vaccine", `${v.name} (aplicada)`, PALETTE.orange);
  });
  MOCK_APPOINTMENTS.forEach((a) => {
    if (a.petId !== petId) return;
    addEvent(new Date(a.at), "appointment", a.title, PALETTE.fucsia);
  });

  const daysInMonth = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1);

  return (
    <View style={[styles.container, { paddingTop: 56 }]}>
      <View style={styles.backContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setScreen("pet-detail", "pet-detail")}>
          <Text style={styles.backText}>← volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.profileRow}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarBig, { backgroundColor: petColor(petId) }]}>
              <Text style={[styles.avatarBigText, { fontSize: 48, fontWeight: "bold", color: PALETTE.ink }]}>{pet.name.trim()[0]?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.profileInfoWrapper}>
            <Text style={styles.profileName}>{pet.name}</Text>
            <Text style={styles.profileEspecie}>{pet.especie}</Text>
          </View>
        </View>
      </View>

      <View style={styles.calendarHeader}>
        <View style={styles.calendarMonthYear}>
          <Text style={styles.calendarMonthYearText}>
            {now.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
          </Text>
        </View>
      </View>

      <View style={styles.calendarWeekHeader}>
        {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map((d) => (
          <Text key={d} style={styles.calendarDayHeader}>{d}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.calendarEmptyDay} />
        ))}
        {daysInMonth.map((day) => {
          const dateStr = new Date(year, month, day).toISOString().split("T")[0];
          const events = eventsByDay[dateStr] || [];
          const today = now.getDate() === day && now.getMonth() === month && now.getFullYear() === year;
          return (
            <View key={day} style={[styles.calendarDay, today && styles.calendarToday]}>
              <Text style={[styles.calendarDayNumber, today && styles.calendarTodayNumber]}>{day}</Text>
              {events.length > 0 && (
                <View style={styles.calendarDayEvents}>
                  {events.map((e, i) => (
                    <View key={i} style={[styles.calendarDayEvent, { backgroundColor: e.color }]}>
                      <Text style={styles.calendarDayEventText}>{e.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.calendarLegend}>
        <View style={[styles.legendItem, { backgroundColor: PALETTE.butter }]}>
          <Text style={styles.legendText}>Recuerdos</Text>
        </View>
        <View style={[styles.legendItem, { backgroundColor: PALETTE.navy }]}>
          <Text style={styles.legendText}>Vacunas</Text>
        </View>
        <View style={[styles.legendItem, { backgroundColor: PALETTE.fucsia }]}>
          <Text style={styles.legendText}>Turnos</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.cream },
  tabBar: {
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    borderTopWidth: 1,
    borderTopColor: `${PALETTE.ink}20`,
    backgroundColor: PALETTE.cream,
  },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabButtonActive: { borderTopWidth: 3, borderTopColor: PALETTE.fucsia },
  tabLabel: { fontSize: 12, fontWeight: "bold", color: `${PALETTE.ink}60` },
  tabLabelActive: { color: PALETTE.fucsia },

  backContainer: {
    position: "absolute",
    left: 16,
    top: 56,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.fucsia,
  },
  backText: { fontSize: 16, color: PALETTE.fucsia, fontWeight: "bold" },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: PALETTE.cream,
  },
  profileSticker: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: PALETTE.orange,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: { fontSize: 24, fontWeight: "bold", color: PALETTE.ink, lineHeight: 30 },
  titleName: { fontStyle: "italic", color: PALETTE.fucsia },
  subtitle: { fontSize: 14, lineHeight: 20, color: `${PALETTE.ink}70`, marginTop: 6 },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  emptyTitle: { fontSize: 22, fontWeight: "bold", color: PALETTE.ink, textAlign: "center" },
  emptyDesc: { fontSize: 14, lineHeight: 20, color: `${PALETTE.ink}70`, textAlign: "center", marginTop: 8 },

  card: {
    backgroundColor: PALETTE.parchment,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: PALETTE.parchment,
    borderBottomWidth: 2,
    borderBottomColor: PALETTE.ink,
  },
  petRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: PALETTE.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { textAlign: "center" },
  petInfo: { flex: 1 },
  petName: { fontSize: 16, fontWeight: "bold", color: PALETTE.ink },
  petSpecies: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: `${PALETTE.ink}88`,
  },
  dateBadge: { alignItems: "flex-end", gap: 6 },
  dateText: { fontSize: 10, fontStyle: "italic", color: `${PALETTE.ink}99` },
  recBadge: { backgroundColor: PALETTE.fucsia, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  recText: { fontSize: 10, fontWeight: "bold", color: PALETTE.cream, textTransform: "uppercase" },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: `${PALETTE.cream}80`,
    borderBottomWidth: 2,
    borderBottomColor: `${PALETTE.ink}1a`,
  },
  ownerName: { fontSize: 11, fontWeight: "bold", textTransform: "uppercase", color: `${PALETTE.ink}70` },
  body: { padding: 16 },
  textOnly: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: `${PALETTE.ink}45`,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 20, fontWeight: "bold", color: PALETTE.ink, marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 20, color: `${PALETTE.ink}80` },
  listContent: { paddingBottom: 20 },
  loadMoreContainer: { alignItems: "center", paddingVertical: 24, gap: 8 },
  loadMoreText: { fontSize: 14, fontStyle: "italic", color: `${PALETTE.ink}50` },
  endContainer: { alignItems: "center", paddingVertical: 30 },
  endText: { fontSize: 14, fontStyle: "italic", color: `${PALETTE.ink}45`, textAlign: "center" },

  searchContainer: { paddingHorizontal: 16, backgroundColor: PALETTE.cream },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PALETTE.parchment,
    borderWidth: 1,
    borderColor: `${PALETTE.ink}20`,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: PALETTE.ink, fontSize: 15 },
  clearButton: { alignSelf: "flex-end", marginTop: 6, marginRight: 4 },
  clearText: { fontSize: 12, color: PALETTE.fucsia, fontWeight: "bold" },
  countContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  countText: { fontSize: 12, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, color: `${PALETTE.ink}50` },

  rowContainer: {
    backgroundColor: PALETTE.parchment,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rowContent: { padding: 14 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 17, fontWeight: "bold", color: PALETTE.ink },
  rowEspecie: { fontSize: 11, fontWeight: "bold", textTransform: "uppercase", color: `${PALETTE.ink}88` },
  rowRight: { alignItems: "flex-end", gap: 8 },
  rowOwner: { fontSize: 11, fontWeight: "bold", textTransform: "uppercase", color: `${PALETTE.ink}70`, textAlign: "right", marginBottom: 6 },
  followButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 2, borderColor: PALETTE.ink },
  followButtonFollow: { backgroundColor: PALETTE.fucsia },
  followButtonFollowing: { backgroundColor: PALETTE.cream },
  followButtonText: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", color: PALETTE.ink },
  rowDescription: { fontSize: 13, lineHeight: 18, color: `${PALETTE.ink}80`, marginTop: 6 },

  petsSection: { marginBottom: 20 },
  petsSectionTitle: { fontSize: 16, fontWeight: "bold", color: PALETTE.ink, marginHorizontal: 16, marginBottom: 10 },
  ownPetsListContent: { paddingHorizontal: 16, paddingBottom: 10 },

  followButtonOwn: {
    backgroundColor: PALETTE.cream,
    borderColor: `${PALETTE.ink}80`,
  },

  profileHeader: {
    paddingHorizontal: 16,
    paddingTop: 100,
    backgroundColor: PALETTE.cream,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    backgroundColor: PALETTE.parchment,
    borderBottomWidth: 2,
    borderBottomColor: PALETTE.ink,
  },
  avatarWrapper: { alignItems: "center" },
  profileInfoWrapper: { flex: 1 },
  profileBadges: { flexDirection: "row", gap: 6, marginBottom: 6 },
  sticker: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  stickerText: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", color: PALETTE.ink },
  profileName: { fontSize: 32, fontWeight: "bold", color: PALETTE.ink, marginBottom: 4 },
  profileAge: { fontSize: 14, fontWeight: "bold", color: `${PALETTE.ink}70`, marginBottom: 8 },
  profileDesc: { fontSize: 14, lineHeight: 20, color: `${PALETTE.ink}80`, marginBottom: 12 },
  followButtonRow: { flexDirection: "row", gap: 8 },
  ownerRowProfile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: `${PALETTE.cream}80`,
    borderTopWidth: 2,
    borderTopColor: `${PALETTE.ink}1a`,
    borderBottomWidth: 2,
    borderBottomColor: `${PALETTE.ink}1a`,
  },
  ownerLabel: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", color: `${PALETTE.ink}50` },
  ownerLinkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ownerNameProfile: { fontSize: 13, fontWeight: "bold", color: `${PALETTE.ink}80` },
  sectionsNav: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: PALETTE.cream,
  },
  sectionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sectionChipText: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", color: PALETTE.ink },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: PALETTE.cream,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: PALETTE.ink },
  createButton: { backgroundColor: PALETTE.orange, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  createButtonText: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", color: PALETTE.ink },
  formContainer: { padding: 16 },
  formTitle: { fontSize: 24, fontWeight: "bold", color: PALETTE.ink, marginBottom: 20 },
  formField: { marginBottom: 16 },
  formFieldLabel: { fontSize: 12, fontWeight: "bold", textTransform: "uppercase", color: `${PALETTE.ink}70`, marginBottom: 8 },
  formInput: {
    backgroundColor: PALETTE.parchment,
    borderWidth: 1,
    borderColor: PALETTE.ink,
    borderRadius: 8,
    padding: 12,
    color: PALETTE.ink,
    fontSize: 16,
  },
  petChoice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${PALETTE.ink}30`,
    marginBottom: 8,
  },
  petChoiceSelected: {
    borderColor: PALETTE.fucsia,
    backgroundColor: `${PALETTE.fucsia}20`,
  },
  petChoiceName: { fontSize: 15, fontWeight: "bold", color: PALETTE.ink },
  mediaKindRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  mediaKindChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${PALETTE.ink}30`,
  },
  mediaKindChipSelected: {
    borderColor: PALETTE.fucsia,
    backgroundColor: `${PALETTE.fucsia}20`,
  },
  mediaKindChipText: { fontSize: 13, color: `${PALETTE.ink}70` },
  mediaKindChipTextSelected: { color: PALETTE.fucsia, fontWeight: "bold" },
  formActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  cancelButton: { padding: 12 },
  cancelButtonText: { fontSize: 15, color: `${PALETTE.ink}70` },
  saveButton: { padding: 12 },
  saveButtonText: { fontSize: 15, fontWeight: "bold", color: PALETTE.fucsia },

  petDetailLoviCard: {
    backgroundColor: PALETTE.parchment,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  petDetailLoviTitle: { fontSize: 20, fontWeight: "bold", color: PALETTE.ink, marginBottom: 6 },
  petDetailLoviDesc: { fontSize: 14, lineHeight: 20, color: `${PALETTE.ink}80`, marginBottom: 8 },
  petDetailLoviDate: { fontSize: 11, fontStyle: "italic", color: `${PALETTE.ink}70`, alignSelf: "flex-end" },

  avatarBig: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: PALETTE.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBigText: { textAlign: "center" },
  tiltRight: { transform: [{ rotate: "0.4deg" }] },
  tiltLeft: { transform: [{ rotate: "-0.4deg" }] },

  albumCard: {
    backgroundColor: PALETTE.parchment,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  albumCover: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: PALETTE.ink,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: PALETTE.ink,
    marginTop: 8,
    marginHorizontal: 8,
  },
  albumCount: {
    fontSize: 12,
    fontWeight: "bold",
    color: `${PALETTE.ink}70`,
    marginHorizontal: 8,
    marginBottom: 8,
  },

  vaccineCard: {
    backgroundColor: PALETTE.parchment,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vaccineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: "bold",
    color: PALETTE.ink,
  },
  vaccineStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vaccineOverdue: {
    backgroundColor: PALETTE.fucsia,
  },
  vaccineExpiring: {
    backgroundColor: PALETTE.orange,
  },
  vaccineOk: {
    backgroundColor: PALETTE.butter,
  },
  vaccineStatusText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: PALETTE.ink,
  },
  vaccineDetail: {
    fontSize: 14,
    color: `${PALETTE.ink}80`,
    marginBottom: 8,
  },
  vaccineNotes: {
    fontSize: 13,
    fontStyle: "italic",
    color: `${PALETTE.ink}70`,
  },

  appointmentCard: {
    backgroundColor: PALETTE.parchment,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appointmentDay: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PALETTE.fucsia,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  appointmentDayNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: PALETTE.cream,
  },
  appointmentDayName: {
    fontSize: 10,
    fontWeight: "bold",
    color: PALETTE.cream,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: PALETTE.ink,
  },
  appointmentDetail: {
    fontSize: 14,
    color: `${PALETTE.ink}80`,
    marginBottom: 4,
  },
  appointmentKind: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: `${PALETTE.ink}50`,
  },
  appointmentNotes: {
    fontSize: 13,
    fontStyle: "italic",
    color: `${PALETTE.ink}70`,
    marginTop: 4,
  },
  pastAppointment: {
    opacity: 0.6,
  },
  pastTitle: {
    color: `${PALETTE.ink}60`,
  },
  pastKind: {
    color: `${PALETTE.ink}50`,
  },
  pastNotes: {
    color: `${PALETTE.ink}50`,
  },

  calendarHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: PALETTE.cream,
  },
  calendarMonthYear: {
    flexDirection: "row",
    alignItems: "center",
  },
  calendarMonthYearText: {
    fontSize: 18,
    fontWeight: "bold",
    color: PALETTE.ink,
  },
  calendarWeekHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  calendarDayHeader: {
    width: 40,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    color: `${PALETTE.ink}70`,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  calendarEmptyDay: {
    width: 40,
    height: 40,
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
  },
  calendarToday: {
    backgroundColor: PALETTE.fucsia,
  },
  calendarDayNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: PALETTE.ink,
  },
  calendarTodayNumber: {
    color: PALETTE.cream,
  },
  calendarDayEvents: {
    marginTop: 4,
  },
  calendarDayEvent: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginVertical: 1,
  },
  calendarDayEventText: {
    fontSize: 10,
    color: PALETTE.ink,
  },
  calendarLegend: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "bold",
    color: PALETTE.ink,
  },
});
