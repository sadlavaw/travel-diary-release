export const REGIONS = [
  'Вінницька', 'Волинська', 'Дніпропетровська', 'Донецька',
  'Житомирська', 'Закарпатська', 'Запорізька', 'Івано-Франківська',
  'Київська', 'Кіровоградська', 'Луганська', 'Львівська',
  'Миколаївська', 'Одеська', 'Полтавська', 'Рівненська',
  'Сумська', 'Тернопільська', 'Харківська', 'Херсонська',
  'Хмельницька', 'Черкаська', 'Чернівецька', 'Чернігівська', 'м. Київ',
]

import { CheckCircle2, CalendarDays, Car, XCircle, Earth, Lock, FileText, ImageIcon, Map, TramFront, Home } from 'lucide-react'

export const TRIP_STATUSES = {
  done:      { label: 'Виконана',       color: 'bg-green-100 text-green-700',  Icon: CheckCircle2 },
  planned:   { label: 'Планується',     color: 'bg-blue-100 text-blue-700',    Icon: CalendarDays },
  active:    { label: 'Зараз в дорозі', color: 'bg-amber-100 text-amber-700',  Icon: Car },
  cancelled: { label: 'Скасована',      color: 'bg-red-100 text-red-600',      Icon: XCircle },
}

export const VISIBILITY = {
  public:  { label: 'Публічна',  Icon: Earth },
  private: { label: 'Тільки я', Icon: Lock },
}

export const BLOCK_TYPES = {
  text:          { label: 'Текст',      Icon: FileText },
  image:         { label: 'Фото',       Icon: ImageIcon },
  map:           { label: 'Карта',      Icon: Map },
  transport:     { label: 'Транспорт',  Icon: TramFront },
  accommodation: { label: 'Житло',      Icon: Home },
  divider:       { label: 'Розділювач', Icon: null },
}

export const SAMPLE_TRIPS = [
  {
    id: '1',
    authorId: 'u1',
    title: 'Карпати: Буковель та Яремче',
    region: 'Івано-Frankівська',
    startDate: '2024-01-15',
    endDate: '2024-01-20',
    status: 'done',
    visibility: 'public',
    description: 'Зимова поїздка в Карпати. Катання на лижах у Буковелі, гарячі джерела, прогулянки вздовж Прута в Яремче.',
    notes: 'Поїзд Київ → Івано-Франківськ, потім маршрутка. Житло — гостьовий будинок «Карпатська хата».',
    route: [
      { name: 'Яремче', lat: 48.4521, lng: 24.5542 },
      { name: 'Буковель', lat: 48.3645, lng: 24.4012 },
    ],
    photos: [
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    ],
    blocks: [
      { id: 'b1', type: 'text', content: 'Зимова поїздка в Карпати розпочалась з нічного поїзда з Києва. Після шести годин їзди прибули до Івано-Франківська — і одразу маршруткою до Яремче.' },
      { id: 'b2', type: 'image', url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', caption: 'Вид на Карпати зранку' },
      { id: 'b3', type: 'text', content: 'Буковель вразив масштабами — понад 60 трас різного рівня складності. Черги на підйомники невеликі в будні.' },
      { id: 'b4', type: 'map', content: '' },
      { id: 'b5', type: 'transport', provider: 'Укрзалізниця', from: 'Київ-Пасажирський', to: 'Івано-Франківськ', date: '2024-01-15', price: '580', link: 'https://booking.uz.gov.ua' },
      { id: 'b6', type: 'accommodation', name: 'Карпатська хата', location: 'Яремче', price: '800', nights: 5, link: '' },
    ],
    transport: [
      { type: 'train', provider: 'Укрзалізниця', from: 'Київ', to: 'Івано-Франківськ', price: 580, date: '2024-01-15', link: '' },
    ],
    accommodation: [
      { name: 'Карпатська хата', location: 'Яремче', price: 800, nights: 5, link: '' },
    ],
    createdAt: '2024-01-22T10:00:00Z',
  },
  {
    id: '2',
    authorId: 'u1',
    title: 'Львів: місто кави та архітектури',
    region: 'Львівська',
    startDate: '2024-03-08',
    endDate: '2024-03-10',
    status: 'done',
    visibility: 'public',
    description: 'Вихідні у Львові. Стара частина міста, кав\'ярні та ринок.',
    notes: 'Must visit: Личаківський цвинтар, Площа Ринок, кав\'ярня «Бачевських».',
    route: [
      { name: 'Площа Ринок', lat: 49.8417, lng: 24.0317 },
      { name: 'Личаківський цвинтар', lat: 49.8289, lng: 24.0658 },
    ],
    photos: [
      'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80',
    ],
    blocks: [
      { id: 'b1', type: 'text', content: 'Львів — місто, яке щоразу відкривається по-новому. Цього разу обрали для поїздки 8 березня — свято і гарна погода.' },
      { id: 'b2', type: 'image', url: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80', caption: 'Площа Ринок увечері' },
    ],
    transport: [],
    accommodation: [],
    createdAt: '2024-03-12T10:00:00Z',
  },
  {
    id: '3',
    authorId: 'u2',
    title: 'Одеса влітку 2024',
    region: 'Одеська',
    startDate: '2024-07-12',
    endDate: '2024-07-17',
    status: 'done',
    visibility: 'public',
    description: 'Море, катакомби і найкраща морська риба.',
    notes: 'Пляж Лузанівка кращий за Аркадію — менше людей.',
    route: [
      { name: 'Потьомкінські сходи', lat: 46.4854, lng: 30.7426 },
      { name: 'Пляж Аркадія', lat: 46.4189, lng: 30.7654 },
    ],
    photos: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    ],
    blocks: [
      { id: 'b1', type: 'text', content: 'Перша відпустка після двох років. Одеса зустріла теплом і сонцем.' },
    ],
    transport: [],
    accommodation: [],
    createdAt: '2024-07-20T10:00:00Z',
  },
  {
    id: '4',
    authorId: 'u3',
    title: 'Чернівці — маленький Відень',
    region: 'Чернівецька',
    startDate: '2024-09-06',
    endDate: '2024-09-08',
    status: 'done',
    visibility: 'public',
    description: 'Осінній уїк-енд. Університет UNESCO, ринок, кав\'ярні.',
    notes: '',
    route: [{ name: 'Чернівецький університет', lat: 48.2921, lng: 25.9318 }],
    photos: ['https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80'],
    blocks: [{ id: 'b1', type: 'text', content: 'Місто неймовірно гарне восени.' }],
    transport: [],
    accommodation: [],
    createdAt: '2024-09-10T10:00:00Z',
  },
  {
    id: '5',
    authorId: 'u2',
    title: 'Зимові Карпати — Різдво 2025',
    region: 'Закарпатська',
    startDate: '2025-01-06',
    endDate: '2025-01-10',
    status: 'planned',
    visibility: 'public',
    description: 'Планую провести Різдво в Карпатах. Мукачево, замок Паланок, термальні купелі.',
    notes: '',
    route: [{ name: 'Мукачево', lat: 48.4411, lng: 22.7210 }],
    photos: [],
    blocks: [{ id: 'b1', type: 'text', content: 'Планую провести Різдво в Закарпатті.' }],
    transport: [],
    accommodation: [],
    createdAt: '2024-11-01T10:00:00Z',
  },
]

export const SAMPLE_USERS = [
  { id: 'u1', name: 'Тімур Тітченко', username: 'timur_t', email: 'timur@example.com', bio: 'Мандрівник по Україні 🇺🇦', avatar: null, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'u2', name: 'Оля Коваль', username: 'olya_koval', email: 'olya@example.com', bio: 'Люблю Карпати і морозиво', avatar: null, createdAt: '2024-02-01T00:00:00Z' },
  { id: 'u3', name: 'Дмитро Бондар', username: 'dmytro_b', email: 'dmytro@example.com', bio: 'Фотограф і мандрівник', avatar: null, createdAt: '2024-03-01T00:00:00Z' },
]

/** id або username (без @), регістр ігнорується */
export function findSampleUserBySlug(slug) {
  if (!slug || typeof slug !== 'string') return null
  const s = slug.trim().toLowerCase()
  return SAMPLE_USERS.find(u => u.id.toLowerCase() === s || u.username.toLowerCase() === s) || null
}

export const SAMPLE_USER = SAMPLE_USERS[0]
