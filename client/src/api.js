const BASE = (import.meta.env.VITE_API_URL || '') + '/api'

function getToken() {
  return localStorage.getItem('td_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`)
  }
  return data
}

function safeDate(d) {
  if (!d) return null
  const s = typeof d === 'string' ? d : d.toISOString()
  // Беремо тільки YYYY-MM-DD (безпечно для DATE з postgres)
  return s.slice(0, 10)
}

// DB (snake_case) → frontend (camelCase)
export function tripFromDB(t) {
  const regions = t.regions || []
  return {
    id: t.id,
    authorId: t.user_id,
    title: t.title,
    description: t.description,
    coverImage: t.cover_url,
    status: t.status,
    visibility: t.visibility,
    startDate: safeDate(t.start_date),
    endDate: safeDate(t.end_date),
    region: regions[0] || '',
    regions,
    tags: t.tags || [],
    stops: t.stops || [],
    legs: t.legs || [],
    blocks: t.blocks || [],
    days: t.days || [],
    route: t.route || [],
    photos: t.photos || [],
    participants: t.participants || [],
    stravaUrl: t.strava?.url || '',
    stravaTitle: t.strava?.title || '',
    stravaPhoto: t.strava?.photo || '',
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    // поля з public endpoint
    authorName: t.author_name,
    authorUsername: t.author_username,
    authorAvatar: t.author_avatar,
  }
}

// frontend (camelCase) → DB (snake_case)
export function tripToDB(t) {
  return {
    title: t.title,
    description: t.description,
    cover_url: t.coverImage || null,
    status: t.status || 'planned',
    visibility: t.visibility || 'private',
    start_date: t.startDate || null,
    end_date: t.endDate || null,
    regions: t.region ? [t.region] : (t.regions || []),
    tags: t.tags || [],
    stops: t.stops || [],
    legs: t.legs || [],
    blocks: t.blocks || [],
    days: t.days || [],
    route: t.route || [],
    photos: t.photos || [],
    participants: t.participants || [],
    strava: {
      url: t.stravaUrl || '',
      title: t.stravaTitle || '',
      photo: t.stravaPhoto || '',
    },
  }
}

export const api = {
  // Auth
  register: (name, username, email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ name, username, email, password }) }),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request('/auth/me'),

  // Trips
  getTrips: async () => {
    const rows = await request('/trips')
    return rows.map(tripFromDB)
  },

  getPublicTrips: async () => {
    const rows = await request('/trips/public')
    return rows.map(tripFromDB)
  },

  createTrip: async (trip) => {
    const row = await request('/trips', { method: 'POST', body: JSON.stringify(tripToDB(trip)) })
    return tripFromDB(row)
  },

  updateTrip: async (id, updates) => {
    const row = await request(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(tripToDB(updates)) })
    return tripFromDB(row)
  },

  getTrip: async (id) => {
    const row = await request(`/trips/${id}`)
    return tripFromDB(row)
  },

  deleteTrip: (id) =>
    request(`/trips/${id}`, { method: 'DELETE' }),

  // Users
  searchUsers: (q) => request(`/users/search?q=${encodeURIComponent(q)}`),
  getUserById: (id) => request(`/users/${id}`),
  getUserBySlug: (slug) => request(`/users/by-slug/${encodeURIComponent(slug)}`),
  getUserTrips: async (id) => {
    const rows = await request(`/users/${id}/trips`)
    return rows.map(tripFromDB)
  },

  getParticipantTrips: async (id) => {
    const rows = await request(`/users/${id}/participant-trips`)
    return rows.map(tripFromDB)
  },

  // Friends
  getFriends: () => request('/friends'),
  addFriend: (id) => request(`/friends/${id}`, { method: 'POST' }),
  removeFriend: (id) => request(`/friends/${id}`, { method: 'DELETE' }),

  // Profile
  updateProfile: (updates) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(updates) }),
}
