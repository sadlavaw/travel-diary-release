/**
 * Trip itinerary model (Polar-style planner):
 * - stops[]: ordered places { id, name, lat, lng, nights, dayOffset?, notes, photos[] }
 * - legs[]: travel between consecutive stops { id, fromIndex, toIndex, mode, durationMinutes, userEdited?, ticketPrice?, trainComfort? }
 * Legacy trips may only have route[] / days[]; normalizeTrip() seeds stops from route when empty.
 */

/** Train comfort / class (UA rail); only used when mode === 'train'. */
export const TRAIN_COMFORT_OPTIONS = [
  { id: 'intercity', label: 'Інтерсіті' },
  { id: 'platskart', label: 'Плацкарт' },
  { id: 'kupe', label: 'Купе' },
]

export const TRANSPORT_MODES = [
  { id: 'plane', label: 'Літак', kmh: 650 },
  { id: 'train', label: 'Поїзд', kmh: 85 },
  { id: 'bus', label: 'Автобус', kmh: 55 },
  { id: 'car', label: 'Авто', kmh: 70 },
  { id: 'ferry', label: 'Пором', kmh: 35 },
  { id: 'walk', label: 'Пішки', kmh: 5 },
  { id: 'bike', label: 'Велосипед', kmh: 18 },
  { id: 'other', label: 'Інше', kmh: 50 },
]

export function modeSpeedKmh(modeId) {
  return TRANSPORT_MODES.find(m => m.id === modeId)?.kmh ?? 50
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Straight-line heuristic: duration from distance and typical speed (minutes, rounded). */
export function estimateLegMinutes(fromStop, toStop, mode) {
  if (!fromStop || !toStop) return 60
  const lat1 = fromStop.lat, lng1 = fromStop.lng, lat2 = toStop.lat, lng2 = toStop.lng
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 60
  const km = haversineKm(lat1, lng1, lat2, lng2)
  const speed = modeSpeedKmh(mode)
  if (speed <= 0) return 60
  const hours = km / speed
  return Math.max(15, Math.round(hours * 60))
}

export function formatDurationMinutes(totalMin) {
  if (totalMin == null || Number.isNaN(totalMin)) return '—'
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h <= 0) return `${m} хв`
  if (m === 0) return `${h} год`
  return `${h} год ${m} хв`
}

export function parseDurationText(text) {
  if (!text || typeof text !== 'string') return null
  const t = text.trim().toLowerCase()
  let minutes = 0
  const hMatch = t.match(/(\d+)\s*(год|h|hr|г)/)
  const mMatch = t.match(/(\d+)\s*(хв|min|м|m)(?!\w)/)
  if (hMatch) minutes += parseInt(hMatch[1], 10) * 60
  if (mMatch) minutes += parseInt(mMatch[1], 10)
  if (!hMatch && !mMatch) {
    const onlyNum = t.match(/^\d+$/)
    if (onlyNum) minutes = parseInt(onlyNum[0], 10) * 60
  }
  return minutes > 0 ? minutes : null
}

let idSeq = 0
function nid(prefix) {
  idSeq += 1
  return `${prefix}_${Date.now()}_${idSeq}`
}

export function createEmptyStop(overrides = {}) {
  return {
    id: nid('stop'),
    name: '',
    lat: null,
    lng: null,
    nights: 1,
    dayOffset: 0,
    notes: '',
    photos: [],
    ...overrides,
  }
}

export function createLeg(fromIndex, toIndex, overrides = {}) {
  return {
    id: nid('leg'),
    fromIndex,
    toIndex,
    mode: 'car',
    durationMinutes: 60,
    userEdited: false,
    ticketPrice: null,
    trainComfort: null,
    ...overrides,
  }
}

/** Rebuild legs array to match stop count (n-1 legs). Preserves matching legs by fromIndex when possible. */
export function reconcileLegs(stops, prevLegs = []) {
  const n = stops.length
  if (n < 2) return []
  const next = []
  for (let i = 0; i < n - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    const prev = prevLegs.find(l => l.fromIndex === i && l.toIndex === i + 1)
    if (prev) {
      const mode = prev.mode || 'car'
      const durationMinutes = prev.userEdited
        ? Math.max(1, Number(prev.durationMinutes) || 60)
        : estimateLegMinutes(a, b, mode)
      const ticketRaw = prev.ticketPrice
      const ticketPrice =
        ticketRaw === '' || ticketRaw === null || ticketRaw === undefined
          ? null
          : Math.max(0, Number(ticketRaw))
      let trainComfort = prev.trainComfort ?? null
      if (!TRAIN_COMFORT_OPTIONS.some(o => o.id === trainComfort)) trainComfort = null
      next.push({
        ...prev,
        fromIndex: i,
        toIndex: i + 1,
        mode,
        durationMinutes,
        ticketPrice: Number.isFinite(ticketPrice) ? ticketPrice : null,
        trainComfort,
      })
    } else {
      const est = estimateLegMinutes(a, b, 'car')
      next.push(createLeg(i, i + 1, { mode: 'car', durationMinutes: est, userEdited: false }))
    }
  }
  return next
}

/** Seed stops from legacy route points (name + coords). Stable ids so normalizeTrip stays deterministic. */
export function routeToStops(route) {
  if (!Array.isArray(route) || route.length === 0) return []
  return route.map((p, idx) => {
    const lat = p.lat != null ? Number(p.lat) : ''
    const lng = p.lng != null ? Number(p.lng) : ''
    const stableId = `rt_${idx}_${lat}_${lng}`
    return createEmptyStop({
      id: stableId,
      name: p.name || `Зупинка ${idx + 1}`,
      lat: p.lat,
      lng: p.lng,
      nights: 1,
      dayOffset: idx,
      notes: '',
      photos: [],
    })
  })
}

/**
 * Ensure trip has stops[] / legs[]; migrate from route when planner never used.
 * Does not strip legacy days[].
 */
export function normalizeTrip(trip) {
  if (!trip || typeof trip !== 'object') return trip
  let stops = Array.isArray(trip.stops)
    ? trip.stops.map(s => ({
        ...createEmptyStop(),
        ...s,
        id: typeof s.id === 'string' && s.id ? s.id : nid('stop'),
        photos: Array.isArray(s.photos) ? s.photos : [],
        nights: Math.max(0, Number(s.nights) || 0),
        dayOffset: s.dayOffset != null ? Math.max(0, Number(s.dayOffset) || 0) : 0,
      }))
    : []

  if (stops.length === 0 && Array.isArray(trip.route) && trip.route.length > 0) {
    stops = routeToStops(trip.route)
  }

  const prevLegs = Array.isArray(trip.legs) ? trip.legs : []
  const legs = reconcileLegs(stops, prevLegs)

  const route =
    stops.length > 0
      ? stopsToRoute(stops)
      : Array.isArray(trip.route)
        ? trip.route
        : []

  return { ...trip, stops, legs, route }
}

export function trainComfortLabel(id) {
  if (!id) return ''
  return TRAIN_COMFORT_OPTIONS.find(o => o.id === id)?.label ?? ''
}

/**
 * Підраховує повний бюджет подорожі з усіх джерел:
 * - TripPlanner: activities[].price, accommodation pricePerNight×nights
 * - BlockEditor: transport block.price, accommodation block.price×block.nights
 * - PolarPlanner: legs[].ticketPrice
 */
export function calcTripBudget(trip) {
  if (!trip) return 0
  let total = 0

  for (const day of trip.days || []) {
    for (const a of day.activities || []) {
      if (a.type === 'accommodation' && a.pricePerNight && a.nights) {
        total += parseFloat(a.pricePerNight) * parseFloat(a.nights)
      } else {
        total += parseFloat(a.price) || 0
      }
    }
  }

  for (const block of trip.blocks || []) {
    if (block.type === 'transport') {
      total += parseFloat(block.price) || 0
    } else if (block.type === 'accommodation') {
      const price = parseFloat(block.price) || 0
      const nights = parseFloat(block.nights) || 1
      if (price > 0) total += price * nights
    }
  }

  for (const leg of trip.legs || []) {
    total += parseFloat(leg.ticketPrice) || 0
  }

  return Math.round(total)
}

/** Частка бюджету для одного учасника (рівний поділ). */
export function calcPersonalBudget(trip) {
  const total = calcTripBudget(trip)
  if (!total) return 0
  const people = 1 + (trip.participants?.length || 0)
  return Math.round(total / people)
}

/** Map stops to route points for MapPicker / legacy map blocks. */
export function stopsToRoute(stops) {
  return (stops || [])
    .filter(s => s.lat != null && s.lng != null)
    .map(s => ({ name: s.name || 'Зупинка', lat: s.lat, lng: s.lng }))
}
