const bcrypt = require('bcryptjs');
const pool = require('./db');

const users = [
  { name: 'Дмитро Коваленко', username: 'dima_koval',  email: 'dima@test.com',  bio: 'Люблю гори та активний відпочинок' },
  { name: 'Роман Шевченко',   username: 'roma_shev',   email: 'roma@test.com',  bio: 'Мандрую Україною вже 5 років' },
  { name: 'Ігор Бондаренко',  username: 'igor_bond',   email: 'igor@test.com',  bio: 'Фотограф і мандрівник' },
  { name: 'Станіслав Мельник',username: 'stas_mel',    email: 'stas@test.com',  bio: null },
  { name: "Дар'я Іваненко",   username: 'dasha_ivan',  email: 'dasha@test.com', bio: 'Шукаю нові враження і смачну їжу' },
  { name: 'Юрій Кравченко',   username: 'yura_krav',   email: 'yura@test.com',  bio: 'Велосипедист, турист, оптиміст' },
  { name: 'Ірина Петренко',   username: 'ira_pet',     email: 'ira@test.com',   bio: 'Обожнюю маленькі містечка України' },
];

const tripsByUser = {
  dima_koval: [
    {
      title: 'Карпатський трекінг',
      description: 'Тиждень у Карпатах: Говерла, Синевир, Буковель. Найкращий відпочинок у житті.',
      status: 'done',
      visibility: 'public',
      start_date: '2025-07-10',
      end_date: '2025-07-17',
      regions: ['Івано-Франківська', 'Закарпатська'],
      tags: ['гори', 'трекінг', 'природа'],
      days: [
        {
          id: 'd1', date: '2025-07-10', label: 'День 1',
          activities: [
            { id: 'a1', type: 'transport', title: 'Поїзд Київ–Івано-Франківськ', time: '08:00', cost: 450, note: 'Плацкарт' },
            { id: 'a2', type: 'accommodation', title: 'Готель «Карпати»', time: '18:00', cost: 800, note: '' },
          ],
        },
        {
          id: 'd2', date: '2025-07-11', label: 'День 2',
          activities: [
            { id: 'a3', type: 'attraction', title: 'Сходження на Говерлу', time: '06:00', cost: 0, note: '2061 м' },
            { id: 'a4', type: 'food', title: 'Обід у гуцульській хаті', time: '14:00', cost: 320, note: '' },
          ],
        },
      ],
      stops: [
        { id: 's1', city: 'Івано-Франківськ', lat: 48.9226, lng: 24.7103, transport: 'train', duration: 1 },
        { id: 's2', city: 'Яремче', lat: 48.4575, lng: 24.5547, transport: 'bus', duration: 3 },
        { id: 's3', city: 'Буковель', lat: 48.3631, lng: 24.4072, transport: 'car', duration: 3 },
      ],
    },
    {
      title: 'Одеса на вихідні',
      description: 'Швидка поїздка до Одеси — море, Привоз, катакомби.',
      status: 'planned',
      visibility: 'public',
      start_date: '2026-06-14',
      end_date: '2026-06-16',
      regions: ['Одеська'],
      tags: ['море', 'місто', 'вихідні'],
      stops: [
        { id: 's1', city: 'Одеса', lat: 46.4825, lng: 30.7233, transport: 'train', duration: 3 },
      ],
    },
  ],
  roma_shev: [
    {
      title: 'Львів — місто кави',
      description: 'Три дні у найкрасивішому місті України. Кава, шоколад, старе місто.',
      status: 'done',
      visibility: 'public',
      start_date: '2025-09-05',
      end_date: '2025-09-07',
      regions: ['Львівська'],
      tags: ['місто', 'кава', 'архітектура', 'культура'],
      days: [
        {
          id: 'd1', date: '2025-09-05', label: 'День 1',
          activities: [
            { id: 'a1', type: 'food', title: 'Кава у «Криївці»', time: '10:00', cost: 150, note: '' },
            { id: 'a2', type: 'attraction', title: 'Площа Ринок', time: '12:00', cost: 0, note: '' },
            { id: 'a3', type: 'food', title: 'Вечеря в ресторані', time: '19:00', cost: 600, note: '' },
          ],
        },
      ],
      stops: [
        { id: 's1', city: 'Львів', lat: 49.8397, lng: 24.0297, transport: 'train', duration: 3 },
      ],
    },
    {
      title: 'Київ — рідне місто',
      description: 'Вихідні у столиці: Андріївський узвіз, ВДНГ, Podil.',
      status: 'done',
      visibility: 'public',
      start_date: '2025-11-01',
      end_date: '2025-11-02',
      regions: ['м. Київ'],
      tags: ['столиця', 'місто', 'культура'],
      stops: [
        { id: 's1', city: 'Київ', lat: 50.4501, lng: 30.5234, transport: 'metro', duration: 2 },
      ],
    },
    {
      title: 'Кам\'янець-Подільський',
      description: 'Середньовічна фортеця, старе місто, каньйон річки Смотрич.',
      status: 'done',
      visibility: 'public',
      start_date: '2025-08-20',
      end_date: '2025-08-22',
      regions: ['Хмельницька'],
      tags: ['фортеця', 'замки', 'природа', 'історія'],
      stops: [
        { id: 's1', city: "Кам'янець-Подільський", lat: 48.6767, lng: 26.5769, transport: 'bus', duration: 3 },
      ],
    },
  ],
  igor_bond: [
    {
      title: 'Чернігів — стародавнє місто',
      description: 'Фотопоїздка до Чернігова: давньоруські пам\'ятки, вал, Єлецький монастир.',
      status: 'done',
      visibility: 'public',
      start_date: '2025-10-10',
      end_date: '2025-10-11',
      regions: ['Чернігівська'],
      tags: ['фото', 'архітектура', 'історія'],
      stops: [
        { id: 's1', city: 'Чернігів', lat: 51.4982, lng: 31.2893, transport: 'bus', duration: 2 },
      ],
    },
  ],
  dasha_ivan: [
    {
      title: 'Закарпаття: замки і вино',
      description: 'Мукачево, Берегово, Ужгород. Замки, вино і дуже смачна їжа.',
      status: 'done',
      visibility: 'public',
      start_date: '2025-06-01',
      end_date: '2025-06-05',
      regions: ['Закарпатська'],
      tags: ['замки', 'вино', 'їжа', 'природа'],
      days: [
        {
          id: 'd1', date: '2025-06-01', label: 'День 1',
          activities: [
            { id: 'a1', type: 'transport', title: 'Переліт до Ужгорода', time: '09:00', cost: 1200, note: '' },
            { id: 'a2', type: 'accommodation', title: 'Апартаменти в центрі', time: '14:00', cost: 950, note: '' },
            { id: 'a3', type: 'food', title: 'Дегустація закарпатських вин', time: '18:00', cost: 400, note: '' },
          ],
        },
        {
          id: 'd2', date: '2025-06-02', label: 'День 2',
          activities: [
            { id: 'a4', type: 'attraction', title: 'Мукачівський замок', time: '10:00', cost: 100, note: '' },
            { id: 'a5', type: 'food', title: 'Бограч у місцевому ресторані', time: '13:00', cost: 280, note: '' },
          ],
        },
      ],
      stops: [
        { id: 's1', city: 'Ужгород', lat: 48.6208, lng: 22.2879, transport: 'plane', duration: 2 },
        { id: 's2', city: 'Мукачево', lat: 48.4413, lng: 22.7169, transport: 'bus', duration: 2 },
        { id: 's3', city: 'Берегово', lat: 48.2063, lng: 22.6418, transport: 'car', duration: 1 },
      ],
    },
    {
      title: 'Вінниця: фонтан і Пирогово',
      description: 'Знаменитий вінницький фонтан та музей-садиба Пирогова.',
      status: 'planned',
      visibility: 'public',
      start_date: '2026-05-30',
      end_date: '2026-06-01',
      regions: ['Вінницька'],
      tags: ['місто', 'музей', 'культура'],
      stops: [
        { id: 's1', city: 'Вінниця', lat: 49.2331, lng: 28.4682, transport: 'bus', duration: 3 },
      ],
    },
  ],
  yura_krav: [
    {
      title: 'Велопоїздка Полтава–Миргород',
      description: '120 км на велосипеді через мальовничу Полтавщину.',
      status: 'done',
      visibility: 'public',
      start_date: '2025-05-15',
      end_date: '2025-05-17',
      regions: ['Полтавська'],
      tags: ['велосипед', 'природа', 'активний відпочинок'],
      stops: [
        { id: 's1', city: 'Полтава', lat: 49.5883, lng: 34.5514, transport: 'bike', duration: 1 },
        { id: 's2', city: 'Миргород', lat: 49.9607, lng: 33.6146, transport: 'bike', duration: 2 },
      ],
    },
    {
      title: 'Харків — мистецтво і місто',
      description: 'Харківський метрополітен, Держпром, ринок Барабашово, галереї.',
      status: 'planned',
      visibility: 'public',
      start_date: '2026-07-04',
      end_date: '2026-07-06',
      regions: ['Харківська'],
      tags: ['місто', 'мистецтво', 'архітектура'],
      stops: [
        { id: 's1', city: 'Харків', lat: 49.9935, lng: 36.2304, transport: 'train', duration: 3 },
      ],
    },
  ],
  ira_pet: [
    {
      title: 'Буковина: Чернівці і навколиці',
      description: 'Університет Федьковича, Хотинська фортеця, дерев\'яні церкви.',
      status: 'done',
      visibility: 'public',
      start_date: '2025-04-18',
      end_date: '2025-04-21',
      regions: ['Чернівецька'],
      tags: ['архітектура', 'фортеця', 'місто'],
      stops: [
        { id: 's1', city: 'Чернівці', lat: 48.2921, lng: 25.9358, transport: 'bus', duration: 3 },
        { id: 's2', city: 'Хотин', lat: 48.5075, lng: 26.4953, transport: 'car', duration: 1 },
      ],
    },
  ],
};

async function seed() {
  const password = await bcrypt.hash('test1234', 10);
  const userIds = {};

  console.log('Створюємо юзерів...');
  for (const u of users) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (existing.rows.length) {
      console.log(`  ${u.username} вже існує, пропускаємо`);
      userIds[u.username] = existing.rows[0].id;
      continue;
    }
    const { rows } = await pool.query(
      'INSERT INTO users (name, username, email, password, bio) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [u.name, u.username, u.email, password, u.bio]
    );
    userIds[u.username] = rows[0].id;
    console.log(`  ✓ ${u.name} (@${u.username})`);
  }

  console.log('\nДодаємо подорожі...');
  for (const [username, trips] of Object.entries(tripsByUser)) {
    const userId = userIds[username];
    if (!userId) continue;
    for (const trip of trips) {
      const { rows } = await pool.query(
        `INSERT INTO trips
          (user_id, title, description, status, visibility, start_date, end_date, regions, tags, stops, legs, blocks, days, route, photos)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING id`,
        [
          userId, trip.title, trip.description, trip.status, trip.visibility,
          trip.start_date || null, trip.end_date || null,
          trip.regions || [], trip.tags || [],
          JSON.stringify(trip.stops || []), JSON.stringify([]),
          JSON.stringify([]), JSON.stringify(trip.days || []),
          JSON.stringify([]), JSON.stringify([]),
        ]
      );
      console.log(`  ✓ [${username}] "${trip.title}"`);
    }
  }

  console.log('\nГотово! Всі юзери мають пароль: test1234');
  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
