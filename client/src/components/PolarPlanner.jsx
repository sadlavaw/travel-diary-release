import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import {
  Trash2, ChevronUp, ChevronDown, GripVertical, MapPin, Clock, Train, Globe2, Banknote,
  X, ChevronLeft, ChevronRight, Plane, Bus, Car, Ship, Footprints, Bike, Navigation,
} from 'lucide-react'
import { useNominatimSearch } from '../hooks/useNominatimSearch'
import { toDataUrl } from '../utils/convertImage'
import {
  TRANSPORT_MODES,
  TRAIN_COMFORT_OPTIONS,
  trainComfortLabel,
  estimateLegMinutes,
  formatDurationMinutes,
  parseDurationText,
  reconcileLegs,
  createEmptyStop,
  stopsToRoute,
} from '../utils/tripItinerary'

const MODE_ICONS = {
  plane: Plane,
  train: Train,
  bus:   Bus,
  car:   Car,
  ferry: Ship,
  walk:  Footprints,
  bike:  Bike,
  other: Navigation,
}

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function CityAutocomplete({ onPick, disabled }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [uaBias, setUaBias] = useState(true)
  const [menuPos, setMenuPos] = useState(null)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const menuRef = useRef(null)
  const { results, loading, error } = useNominatimSearch(q, {
    debounceMs: 400,
    countryCodes: uaBias ? 'ua' : null,
  })

  const updateMenuPos = useCallback(() => {
    const el = inputRef.current
    if (!el || !open || q.trim().length < 2) {
      setMenuPos(null)
      return
    }
    const rect = el.getBoundingClientRect()
    const pad = 8
    const maxHeight = Math.min(224, Math.max(96, rect.top - pad * 2))
    setMenuPos({
      left: rect.left,
      width: Math.max(rect.width, 200),
      bottom: window.innerHeight - rect.top + pad,
      maxHeight,
    })
  }, [open, q])

  useLayoutEffect(() => {
    updateMenuPos()
  }, [updateMenuPos, results, loading, error])

  useEffect(() => {
    if (!open) return
    const onViewportChange = () => updateMenuPos()
    window.addEventListener('resize', onViewportChange)
    window.addEventListener('scroll', onViewportChange, true)
    return () => {
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  }, [open, updateMenuPos])

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current?.contains(e.target)) return
      if (menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const pick = (item) => {
    onPick({
      name: item.name.split(',')[0]?.trim() || item.name,
      lat: item.lat,
      lng: item.lng,
    })
    setQ('')
    setOpen(false)
    setMenuPos(null)
  }

  const showDropdown = open && q.trim().length >= 2 && menuPos

  const dropdown = showDropdown && createPortal(
    <div
      ref={menuRef}
      className="fixed z-[200] flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white text-sm shadow-xl ring-1 ring-black/5"
      style={{
        left: menuPos.left,
        width: menuPos.width,
        bottom: menuPos.bottom,
        maxHeight: menuPos.maxHeight,
      }}
    >
      <ul className="min-h-0 flex-1 overflow-auto">
        {error && <li className="px-3 py-2 text-red-600">{error}</li>}
        {!error && results.length === 0 && !loading && (
          <li className="px-3 py-2.5 text-stone-500">Нічого не знайдено</li>
        )}
        {results.map((r, i) => (
          <li key={`${r.placeId ?? i}-${r.lat}`}>
            <button
              type="button"
              className="w-full px-3 py-2.5 text-left text-stone-700 hover:bg-brand-50 flex items-center gap-1.5"
              onClick={() => pick(r)}
            >
              <MapPin size={11} className="shrink-0 text-brand-500" />
              <span className="truncate">{r.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body
  )

  return (
    <div ref={wrapRef} className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Додати зупинку</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            placeholder="Почніть вводити місто…"
            value={q}
            onChange={e => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            className="input-field w-full py-2.5 pr-10 text-sm"
            autoComplete="off"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          )}
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-stone-500">
          <input
            type="checkbox"
            checked={uaBias}
            onChange={e => setUaBias(e.target.checked)}
            className="rounded border-stone-300"
          />
          Лише Україна
        </label>
      </div>
      {dropdown}
      <p className="mt-2 text-[10px] leading-snug text-stone-400">
        Пошук через OpenStreetMap Nominatim. Список відкривається вгору від поля, щоб не перекривати зупинки.
      </p>
    </div>
  )
}

function LegEditor({ leg, fromStop, toStop, onChange, editable }) {
  const mode = leg.mode || 'car'
  const est = estimateLegMinutes(fromStop, toStop, mode)
  const dur = leg.durationMinutes ?? est
  const ticketVal = leg.ticketPrice != null && Number.isFinite(Number(leg.ticketPrice))
    ? String(leg.ticketPrice)
    : ''

  const applyMode = (newMode) => {
    const nextEst = estimateLegMinutes(fromStop, toStop, newMode)
    onChange({
      ...leg,
      mode: newMode,
      durationMinutes: leg.userEdited ? leg.durationMinutes : nextEst,
    })
  }

  const setDuration = (minutes, userEdited) => {
    onChange({
      ...leg,
      durationMinutes: Math.max(1, minutes),
      userEdited,
    })
  }

  const setTicketPrice = (value) => {
    if (value === '' || value == null) {
      onChange({ ...leg, ticketPrice: null })
      return
    }
    const n = parseInt(value, 10)
    onChange({ ...leg, ticketPrice: Number.isFinite(n) && n >= 0 ? n : null })
  }

  const setTrainComfort = (id) => {
    onChange({ ...leg, trainComfort: id || null })
  }

  const hours = Math.floor(dur / 60)
  const mins = dur % 60

  if (!editable) {
    const comfort = mode === 'train' ? trainComfortLabel(leg.trainComfort) : ''
    const ModeIcon = MODE_ICONS[mode] ?? Navigation
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-purple-100/90 bg-gradient-to-r from-purple-50/95 to-white px-4 py-3 text-sm shadow-sm">
        <ModeIcon size={15} className="shrink-0 text-purple-600" />
        <span className="font-medium text-stone-800">
          {TRANSPORT_MODES.find(m => m.id === mode)?.label ?? mode}
        </span>
        {comfort && (
          <>
            <span className="text-stone-300">·</span>
            <span className="text-stone-600">{comfort}</span>
          </>
        )}
        <span className="text-stone-300">·</span>
        <span className="flex items-center gap-1 text-stone-600">
          <Clock size={13} className="shrink-0" /> {formatDurationMinutes(dur)}
        </span>
        {leg.ticketPrice != null && Number.isFinite(Number(leg.ticketPrice)) && (
          <>
            <span className="text-stone-300">·</span>
            <span className="flex items-center gap-1 font-medium text-brand-700">
              <Banknote size={13} className="shrink-0" />
              {Number(leg.ticketPrice)} грн
            </span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl border border-purple-100/90 bg-gradient-to-br from-purple-50/80 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <label className="shrink-0 text-xs font-semibold uppercase tracking-wide text-stone-500">Пересування</label>
        <select
          value={mode}
          onChange={e => applyMode(e.target.value)}
          className="input-field min-w-[120px] flex-1 py-2 text-sm"
        >
          {TRANSPORT_MODES.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>
      {mode === 'train' && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="shrink-0 text-xs font-semibold uppercase tracking-wide text-stone-500">Поїзд</label>
          <select
            value={leg.trainComfort || ''}
            onChange={e => setTrainComfort(e.target.value)}
            className="input-field min-w-[140px] flex-1 py-2 text-sm"
          >
            <option value="">Оберіть тип…</option>
            {TRAIN_COMFORT_OPTIONS.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <span className="mb-0.5 block text-[10px] text-stone-400">Оцінка</span>
          <span className="rounded-lg border border-stone-100 bg-white/90 px-2 py-1.5 text-xs text-stone-500">
            ~{formatDurationMinutes(est)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="mb-0.5 block w-full text-[10px] text-stone-400">Год</span>
          <input
            type="number"
            min={0}
            className="input-field w-14 py-2 text-xs"
            value={hours}
            onChange={e => {
              const h = Math.max(0, parseInt(e.target.value, 10) || 0)
              setDuration(h * 60 + mins, true)
            }}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="mb-0.5 block w-full text-[10px] text-stone-400">Хв</span>
          <input
            type="number"
            min={0}
            max={59}
            className="input-field w-14 py-2 text-xs"
            value={mins}
            onChange={e => {
              const mm = Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0))
              setDuration(hours * 60 + mm, true)
            }}
          />
        </div>
        <input
          type="text"
          placeholder="або «2 год 30 хв»"
          className="input-field min-w-[100px] flex-1 py-2 text-xs"
          onBlur={e => {
            const parsed = parseDurationText(e.target.value)
            if (parsed) setDuration(parsed, true)
          }}
        />
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
          onClick={() => {
            const nextEst = estimateLegMinutes(fromStop, toStop, mode)
            setDuration(nextEst, false)
          }}
        >
          Як оцінка
        </button>
      </div>
      <div className="flex flex-wrap items-end gap-2 border-t border-purple-100/60 pt-3">
        <div className="min-w-[120px] flex-1">
          <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-stone-500">Квиток</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step={1}
              placeholder="грн"
              className="input-field w-full py-2 pr-10 text-sm"
              value={ticketVal}
              onChange={e => setTicketPrice(e.target.value)}
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">грн</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StopCard({
  stop,
  index,
  startDate,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  editable,
  onAppendPhotos,
}) {
  const [open, setOpen] = useState(editable)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const fileRef = useRef(null)
  const date =
    startDate && stop.dayOffset != null
      ? new Date(new Date(startDate).getTime() + Number(stop.dayOffset) * 86400000)
      : null
  const dateLabel = date
    ? date.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' })
    : null

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-md shadow-stone-900/[0.04] ring-1 ring-stone-900/[0.02]">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-stone-50 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-stone-300"><GripVertical size={16} /></span>
        <span className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-800 truncate">{stop.name || 'Без назви'}</p>
          {dateLabel && <p className="text-[11px] text-stone-400">{dateLabel}</p>}
        </div>
        {open ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-0 space-y-3 border-t border-stone-50">
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">Ночей</label>
              <input
                type="number"
                min={0}
                disabled={!editable}
                className="input-field py-1.5 text-sm mt-0.5"
                value={stop.nights}
                onChange={e => onUpdate({ ...stop, nights: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">День (зміщ.)</label>
              <input
                type="number"
                min={0}
                disabled={!editable}
                title="Дні від дати початку подорожі"
                className="input-field py-1.5 text-sm mt-0.5"
                value={stop.dayOffset ?? 0}
                onChange={e => onUpdate({ ...stop, dayOffset: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">Опис / план</label>
            <textarea
              disabled={!editable}
              rows={3}
              className="input-field resize-none text-sm mt-0.5"
              placeholder="Що подивитись, де поїсти…"
              value={stop.notes || ''}
              onChange={e => onUpdate({ ...stop, notes: e.target.value })}
            />
          </div>

          {(stop.photos || []).length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {(stop.photos || []).map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                  onClick={() => setLightboxIndex(i)}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {editable && (
                    <button
                      type="button"
                      className="absolute top-0.5 right-0.5 bg-black/50 text-white text-[10px] rounded px-1 opacity-0 group-hover:opacity-100"
                      onClick={e => { e.stopPropagation(); onUpdate({ ...stop, photos: stop.photos.filter((_, j) => j !== i) }) }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Lightbox */}
          {lightboxIndex !== null && (stop.photos || []).length > 0 && createPortal(
            <div
              className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-4"
              onClick={() => setLightboxIndex(null)}
            >
              <button
                className="absolute top-4 right-4 text-white/70 hover:text-white"
                onClick={() => setLightboxIndex(null)}
              >
                <X size={28} />
              </button>
              {lightboxIndex > 0 && (
                <button
                  className="absolute left-4 text-white/70 hover:text-white"
                  onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
                >
                  <ChevronLeft size={36} />
                </button>
              )}
              <img
                src={stop.photos[lightboxIndex]}
                alt=""
                className="max-w-full max-h-[85vh] object-contain rounded-xl"
                onClick={e => e.stopPropagation()}
              />
              {lightboxIndex < stop.photos.length - 1 && (
                <button
                  className="absolute right-4 text-white/70 hover:text-white"
                  onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
                >
                  <ChevronRight size={36} />
                </button>
              )}
              <div className="absolute bottom-4 text-white/60 text-sm">
                {lightboxIndex + 1} / {stop.photos.length}
              </div>
            </div>,
            document.body
          )}

          {editable && (
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || [])
                  if (!files.length) return
                  const urls = await Promise.all(files.map(f => toDataUrl(f)))
                  onAppendPhotos(urls)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs border border-dashed border-stone-200 rounded-lg px-3 py-1.5 text-stone-500 hover:border-brand-300 hover:text-brand-600"
              >
                + Фото зупинки
              </button>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={index === 0}
                className="text-xs btn-secondary py-1.5 px-2 disabled:opacity-40"
              >
                Вгору
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                className="text-xs btn-secondary py-1.5 px-2 disabled:opacity-40"
              >
                Вниз
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="text-xs text-red-400 hover:text-red-600 ml-auto flex items-center gap-1"
              >
                <Trash2 size={12} /> Прибрати
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Polar-style ordered stops + legs. Calls onChange({ stops, legs, route? }) with route derived from stops when syncRoute is true.
 */
export default function PolarPlanner({
  stops = [],
  legs = [],
  onChange,
  editable = true,
  startDate,
  syncRoute = true,
}) {
  const commit = useCallback((nextStops, nextLegs) => {
    const L = reconcileLegs(nextStops, nextLegs)
    const payload = { stops: nextStops, legs: L }
    if (syncRoute) payload.route = stopsToRoute(nextStops)
    onChange(payload)
  }, [onChange, syncRoute])

  const addStopFromPlace = useCallback((place) => {
    const s = createEmptyStop({
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      nights: 1,
      dayOffset: stops.length,
    })
    const nextStops = [...stops, s]
    commit(nextStops, legs)
  }, [stops, legs, commit])

  const updateStop = useCallback((i, updated) => {
    const next = [...stops]
    next[i] = updated
    commit(next, legs)
  }, [stops, legs, commit])

  const removeStop = useCallback((i) => {
    const next = stops.filter((_, j) => j !== i)
    commit(next, [])
  }, [stops, commit])

  const moveStop = useCallback((i, dir) => {
    const j = i + dir
    if (j < 0 || j >= stops.length) return
    const next = [...stops]
    ;[next[i], next[j]] = [next[j], next[i]]
    commit(next, [])
  }, [stops, commit])

  const updateLeg = useCallback((legIndex, updated) => {
    const L = [...legs]
    if (legIndex >= 0 && legIndex < L.length) L[legIndex] = updated
    commit(stops, L)
  }, [stops, legs, commit])

  const coords = stops.filter(s => s.lat != null && s.lng != null)
  const center = coords.length > 0 ? [coords[0].lat, coords[0].lng] : [49.0, 31.5]

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <div className="min-w-0 space-y-5">
        <div className="flex items-center gap-2.5 text-stone-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Globe2 size={18} />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight">Зупинки по маршруту</h3>
            <p className="text-xs text-stone-500">Порядок визначає лінію на карті та переїзди між містами.</p>
          </div>
        </div>

        {stops.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 py-12 text-center text-stone-400">
            <MapPin size={24} className="text-stone-300 mx-auto mb-2" />
            <p className="mx-auto max-w-sm text-sm leading-relaxed">
              Додайте міста через пошук унизу або відкрийте стару подорож — зупинки зʼявляться з маршруту на карті.
            </p>
          </div>
        )}

        {stops.map((stop, i) => (
          <React.Fragment key={stop.id || i}>
            <StopCard
              stop={stop}
              index={i}
              startDate={startDate}
              editable={editable}
              onUpdate={u => updateStop(i, u)}
              onRemove={() => removeStop(i)}
              onMoveUp={() => moveStop(i, -1)}
              onMoveDown={() => moveStop(i, 1)}
              onAppendPhotos={urls => updateStop(i, { ...stop, photos: [...(stop.photos || []), ...urls] })}
            />
            {i < stops.length - 1 && legs[i] && (
              <LegEditor
                leg={legs[i]}
                fromStop={stops[i]}
                toStop={stops[i + 1]}
                editable={editable}
                onChange={leg => updateLeg(i, leg)}
              />
            )}
          </React.Fragment>
        ))}

        {editable && stops.length > 0 && (
          <p className="text-xs leading-relaxed text-stone-500">
            Класичний розклад по днях лишається в даних подорожі, якщо ви його заповнювали; цей блок керує зупинками та переїздами.
          </p>
        )}

        {editable && (
          <CityAutocomplete onPick={addStopFromPlace} disabled={false} />
        )}
      </div>

      <div className="space-y-3 lg:sticky lg:top-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-stone-800">Карта маршруту</h3>
          <p className="text-xs text-stone-500">Точки з координатами з&apos;єднуються лінією.</p>
        </div>
        <MapContainer center={center} zoom={coords.length > 1 ? 6 : 8} style={{ height: 340, width: '100%' }} className="z-0 overflow-hidden rounded-2xl border border-stone-200 shadow-md shadow-stone-900/10">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {coords.map((s, i) => (
            <Marker key={s.id || i} position={[s.lat, s.lng]}>
              <Popup>
                <b>{i + 1}. {s.name}</b>
              </Popup>
            </Marker>
          ))}
          {coords.length > 1 && (
            <Polyline
              positions={coords.map(s => [s.lat, s.lng])}
              color="#2e6e59"
              weight={3}
              dashArray="8,4"
            />
          )}
        </MapContainer>
      </div>
    </div>
  )
}
