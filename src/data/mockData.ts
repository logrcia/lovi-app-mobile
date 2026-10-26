import miloPortrait from '../../assets/images/milo_dog_portrait_1792712088048.jpg';
import lunaNap from '../../assets/images/luna_cat_nap_1792712089280.jpg';
import cocoPark from '../../assets/images/coco_park_run_1792712089196.jpg';
import oliverWindow from '../../assets/images/oliver_cat_window_1792712089510.jpg';

import type {
  Album,
  Appointment,
  CalendarEvent,
  LoviImage,
  LoviMemory,
  Pet,
  UserProfile,
  Vaccine,
} from '../types';

const remote = (uri: string): LoviImage => ({ uri });

const ABRIL_AVATAR = remote(
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80'
);
const SOFIA_AVATAR = remote(
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
);
const MATEO_AVATAR = remote(
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
);
const LUCAS_AVATAR = remote(
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
);

export const CURRENT_USER: UserProfile = {
  id: 'user-abril',
  name: 'Abril Morales',
  handle: '@abril_m',
  bio: 'Arquitecta de día, archivista devota de Milo y Bimba de noche. Guardando cada siesta, salto y rayito de sol.',
  avatar: ABRIL_AVATAR,
  location: 'Buenos Aires',
  joinedDate: 'En Lovi desde Mayo 2026',
};

export const INITIAL_PETS: Pet[] = [
  {
    id: 'pet-milo',
    name: 'Milo',
    species: 'perro',
    age: '3 años',
    followersCount: 148,
    bio: 'Coleccionista de ramas caídas, experto en siestas al sol de las 11 y guardián devoto del sillón grande.',
    avatar: miloPortrait,
    isMine: true,
    owner: {
      id: 'user-abril',
      name: 'Abril Morales',
      handle: '@abril_m',
      avatar: ABRIL_AVATAR,
    },
  },
  {
    id: 'pet-bimba',
    name: 'Bimba',
    species: 'gato',
    age: '1 año',
    followersCount: 96,
    bio: 'Cazadora de reflejos dorados y reina indiscutida del alféizar de la cocina. Maúlla en tono de pregunta.',
    avatar: lunaNap,
    isMine: true,
    owner: {
      id: 'user-abril',
      name: 'Abril Morales',
      handle: '@abril_m',
      avatar: ABRIL_AVATAR,
    },
  },
  {
    id: 'pet-luna',
    name: 'Luna',
    species: 'gato',
    age: '2 años',
    followersCount: 312,
    bio: 'Dormilona profesional en mantas de lino. Aparece únicamente cuando escucha la lata de atún.',
    avatar: lunaNap,
    isMine: false,
    isFollowing: true,
    owner: {
      id: 'user-sofia',
      name: 'Sofía Valenzuela',
      handle: '@sofi_v',
      avatar: SOFIA_AVATAR,
    },
  },
  {
    id: 'pet-coco',
    name: 'Coco',
    species: 'perro',
    age: '1 año',
    followersCount: 94,
    bio: 'Un torbellino con patas cortas. Ama el viento en la cara y saltar montañitas de hojas secas.',
    avatar: cocoPark,
    isMine: false,
    isFollowing: false,
    owner: {
      id: 'user-mateo',
      name: 'Mateo Rossi',
      handle: '@mateo_r',
      avatar: MATEO_AVATAR,
    },
  },
  {
    id: 'pet-oliver',
    name: 'Oliver',
    species: 'gato',
    age: '4 años',
    followersCount: 520,
    bio: 'Filósofo de ventana. Observa gorriones con ojos serios desde la biblioteca de roble.',
    avatar: oliverWindow,
    isMine: false,
    isFollowing: false,
    owner: {
      id: 'user-lucas',
      name: 'Lucas Benítez',
      handle: '@lucas_b',
      avatar: LUCAS_AVATAR,
    },
  },
];

export const INITIAL_MEMORIES: LoviMemory[] = [
  {
    id: 'lovi-1',
    petId: 'pet-milo',
    title: 'La siesta dorada sobre el parquet de roble',
    description:
      'Encontró el único parche de sol que entra a las once y apoyó el hocico como si el mundo fuera un lugar perfecto.',
    mediaType: 'image',
    mediaUrl: miloPortrait,
    createdAt: 'Hoy · 11:42',
    isRecommendation: false,
    albumId: 'album-siestas',
  },
  {
    id: 'lovi-2',
    petId: 'pet-luna',
    title: 'Tres horas buscando el rayito de sol perfecto',
    description:
      'Giró sobre la manta tres veces, suspiró hondo y se quedó ovillada como un pan recién horneado.',
    mediaType: 'image',
    mediaUrl: lunaNap,
    createdAt: 'Ayer · 16:15',
    isRecommendation: false,
    albumId: 'album-luna-rincones',
  },
  {
    id: 'lovi-3',
    petId: 'pet-coco',
    title: 'Primer trote entre las hojas secas de otoño',
    description:
      'Llegamos a la plaza y no paró de correr persiguiendo hojas doradas hasta quedar exhausto con la lengua afuera.',
    mediaType: 'image',
    mediaUrl: cocoPark,
    createdAt: '18 Oct · 17:30',
    isRecommendation: true,
    albumId: 'album-paseos',
  },
  {
    id: 'lovi-4',
    petId: 'pet-milo',
    title: 'Pensamientos de un perro que vio pasar una mariposa amarilla',
    description:
      'Se quedó quince minutos inmóvil mirando hacia el rosal con una oreja arriba y la otra abajo, debatiendo si era amiga o comida.',
    mediaType: 'text',
    createdAt: '15 Oct · 09:20',
    isRecommendation: false,
    albumId: 'album-siestas',
  },
  {
    id: 'lovi-5',
    petId: 'pet-bimba',
    title: 'El coro secreto de los ronroneos de domingo',
    description:
      'Grabamos 40 segundos de su motorcito en marcha mientras le rascaban la coronilla en el sillón.',
    mediaType: 'audio',
    audioDuration: '0:42',
    createdAt: '12 Oct · 14:05',
    isRecommendation: false,
    albumId: 'album-bimba-ventana',
  },
  {
    id: 'lovi-6',
    petId: 'pet-oliver',
    title: 'Meditación profunda mirando las copas de los fresnos',
    description: 'No parpadeó ni una sola vez en dos minutos. Un verdadero monje zen felino.',
    mediaType: 'video',
    videoDuration: '1:15',
    mediaUrl: oliverWindow,
    createdAt: '10 Oct · 18:00',
    isRecommendation: true,
  },
  {
    id: 'lovi-7',
    petId: 'pet-milo',
    title: 'Conquistador de la rama más pesada de la plaza',
    description:
      'Nadie creía que la iba a poder levantar, pero caminó con la cabeza en alto los 300 metros hasta casa.',
    mediaType: 'image',
    mediaUrl: cocoPark,
    createdAt: '08 Oct · 16:20',
    isRecommendation: false,
    albumId: 'album-paseos',
  },
  {
    id: 'lovi-8',
    petId: 'pet-bimba',
    title: 'Descubrimiento del reflejo del reloj en el techo',
    description: 'Tres saltos acrobáticos perfectos tratando de atrapar una luz que no se puede morder.',
    mediaType: 'image',
    mediaUrl: lunaNap,
    createdAt: '05 Oct · 10:15',
    isRecommendation: false,
    albumId: 'album-bimba-ventana',
  },
];

export const INITIAL_ALBUMS: Album[] = [
  {
    id: 'album-siestas',
    petId: 'pet-milo',
    title: 'Siestas y solcitos',
    description:
      'Una oda a cada rayito de sol sobre el parquet de roble y las siestas eternas de las 11.',
    coverUrl: miloPortrait,
    memoriesCount: 8,
  },
  {
    id: 'album-paseos',
    petId: 'pet-milo',
    title: 'Aventuras en el parque',
    description:
      'Ramas gigantes, trotes sobre hojas crujientes de otoño y saludos con otros amigos caninos.',
    coverUrl: cocoPark,
    memoriesCount: 12,
  },
  {
    id: 'album-bimba-ventana',
    petId: 'pet-bimba',
    title: 'Cazadora de reflejos',
    description:
      'Apariciones tras la cortina de lino, siestas en el alféizar y cacería de motas de polvo iluminadas.',
    coverUrl: lunaNap,
    memoriesCount: 6,
  },
  {
    id: 'album-cachorro',
    petId: 'pet-milo',
    title: 'Primeros pasos y travesuras',
    description:
      'Cuando las patitas le quedaban gigantes y masticaba las pantuflas de lana en invierno.',
    coverUrl: remote(
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80'
    ),
    memoriesCount: 15,
  },
];

export const INITIAL_VACCINES: Vaccine[] = [
  {
    id: 'vac-1',
    petId: 'pet-milo',
    name: 'Antirrábica anual',
    date: '14 Nov 2026',
    status: 'Próxima dosis',
    notes: 'Clínica Veterinaria San Roque',
  },
  {
    id: 'vac-2',
    petId: 'pet-milo',
    name: 'Séxtuple canina (refuerzo)',
    date: '04 Jun 2026',
    status: 'Al día',
    notes: 'Lote #88492 — Dr. Aranda',
  },
  {
    id: 'vac-3',
    petId: 'pet-milo',
    name: 'Tos de las perreras',
    date: '15 Ene 2026',
    status: 'Para repetir',
    notes: 'Recomendada antes de temporada de frío',
  },
  {
    id: 'vac-4',
    petId: 'pet-bimba',
    name: 'Triple felina (refuerzo)',
    date: '20 Nov 2026',
    status: 'Próxima dosis',
    notes: 'Vet Palermo',
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-1',
    petId: 'pet-milo',
    title: 'Control clínico anual y desparasitación',
    type: 'veterinario',
    date: '2026-10-28',
    time: '16:30',
    location: 'Vet Palermo (Dr. Aranda)',
    isUpcoming: true,
  },
  {
    id: 'app-2',
    petId: 'pet-milo',
    title: 'Peluquería higiénica y baño terapéutico',
    type: 'peluquería',
    date: '2026-11-05',
    time: '11:00',
    location: 'Patitas Spa',
    isUpcoming: true,
  },
  {
    id: 'app-3',
    petId: 'pet-milo',
    title: 'Vacunación antirrábica',
    type: 'vacunación',
    date: '2026-11-14',
    time: '10:00',
    location: 'Vet Palermo',
    isUpcoming: true,
  },
  {
    id: 'app-4',
    petId: 'pet-bimba',
    title: 'Control de peso y uñas',
    type: 'veterinario',
    date: '2026-11-02',
    time: '09:30',
    location: 'Vet Palermo',
    isUpcoming: true,
  },
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-vac-12',
    petId: 'pet-milo',
    type: 'vacuna',
    title: 'Vacuna Séxtuple (Refuerzo)',
    date: '2026-10-12',
    time: '09:30 hs',
    description: 'Refuerzo anual administrado en Vet Palermo',
  },
  {
    id: 'cal-4',
    petId: 'pet-milo',
    type: 'cumple',
    title: '¡Cumpleaños de Milo! (3 años)',
    date: '2026-10-18',
    time: 'Todo el día',
    description: 'Torta de zanahoria e hígado especial',
  },
  {
    id: 'cal-5',
    petId: 'pet-milo',
    type: 'recuerdo',
    title: 'Recuerdo: La siesta dorada',
    date: '2026-10-22',
    time: '11:42 hs',
    description: 'Lovi guardado sobre el parquet de roble',
  },
  {
    id: 'cal-dual-turno',
    petId: 'pet-milo',
    type: 'turno',
    title: 'Control oftalmológico veterinario',
    date: '2026-10-25',
    time: '10:00 hs',
    description: 'Revisión preventiva de córnea',
  },
  {
    id: 'cal-dual-vacuna',
    petId: 'pet-milo',
    type: 'vacuna',
    title: 'Vacuna Tos de las Perreras (KC)',
    date: '2026-10-25',
    time: '10:30 hs',
    description: 'Aplicación en la misma consulta',
  },
  {
    id: 'cal-1',
    petId: 'pet-milo',
    type: 'turno',
    title: 'Control clínico con Dr. Aranda',
    date: '2026-10-28',
    time: '16:30 hs',
    description: 'Chequeo de peso y oídos en Vet Palermo',
  },
  {
    id: 'cal-recuerdo-28',
    petId: 'pet-milo',
    type: 'recuerdo',
    title: 'Recuerdo: Saltando las hojas secas',
    date: '2026-10-28',
    time: '18:00 hs',
    description: 'Tarde feliz después de la consulta',
  },
  {
    id: 'cal-2',
    petId: 'pet-milo',
    type: 'turno',
    title: 'Peluquería y baño suave',
    date: '2026-11-05',
    time: '11:00 hs',
    description: 'Corte de uñas y cepillado',
  },
  {
    id: 'cal-3',
    petId: 'pet-milo',
    type: 'vacuna',
    title: 'Antirrábica anual',
    date: '2026-11-14',
    time: '10:00 hs',
    description: 'Dosis obligatoria anual',
  },
  {
    id: 'cal-bimba-1',
    petId: 'pet-bimba',
    type: 'vacuna',
    title: 'Triple felina (refuerzo)',
    date: '2026-11-20',
    time: '10:00 hs',
    description: 'Vet Palermo',
  },
  {
    id: 'cal-bimba-2',
    petId: 'pet-bimba',
    type: 'recuerdo',
    title: 'Recuerdo: El coro de ronroneos',
    date: '2026-10-22',
    time: '14:05 hs',
    description: 'Audio guardado en el sillón',
  },
];
