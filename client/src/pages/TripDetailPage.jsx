import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Calendar, ArrowLeft, Edit2, Trash2, ChevronLeft, ChevronRight, X, Lock, Globe, ExternalLink, Footprints, Users, Search, BookOpen, Map, CalendarDays, Camera, Wallet } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { useTrips } from '../context/TripsContext'
import { useAuth } from '../context/AuthContext'
import { TRIP_STATUSES } from '../data/mockData'
import { calcTripBudget } from '../utils/tripItinerary'
import { api } from '../api'
import BlockEditor from '../components/BlockEditor'
import TripPlanner from '../components/TripPlanner'
import PolarPlanner from '../components/PolarPlanner'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function TripDetailPage() {
  const { id } = useParams()
  const { getTripById, deleteTrip } = useTrips()
  const { user, getUserById } = useAuth()
  const navigate = useNavigate()

  const localTrip = getTripById(id)
  const [fetchedTrip, setFetchedTrip] = useState(null)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(null)

  useEffect(() => {
    if (localTrip || !id) return
    setFetchLoading(true)
    api.getTrip(id)
      .then(t => setFetchedTrip(t))
      .catch(() => setFetchedTrip(null))
      .finally(() => setFetchLoading(false))
  }, [id, localTrip])

  const trip = localTrip || fetchedTrip
  const isOwner = user && trip && String(trip.authorId) === String(user.id)

  if (fetchLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )

  if (!trip) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <Search size={48} className="text-stone-300 mx-auto mb-4" />
      <h2 className="font-display text-2xl font-bold text-stone-700 mb-2">Подорож не знайдена</h2>
      <Link to="/" className="btn-primary mt-4 inline-flex">На головну</Link>
    </div>
  )

  const handleDelete = () => {
    if (confirm('Видалити цю подорож?')) { deleteTrip(id); navigate('/') }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const duration = trip.startDate && trip.endDate
    ? Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1)
    : null
  const status = TRIP_STATUSES[trip.status] || TRIP_STATUSES.done
  const budget = calcTripBudget(trip)
  const author = trip.authorId
    ? (getUserById(trip.authorId) || (trip.authorName ? { id: trip.authorId, name: trip.authorName, username: trip.authorUsername, avatar: trip.authorAvatar } : null))
    : null
  const authorInitials = author?.name
    ? author.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const stravaHref = (() => {
    const t = (trip.stravaUrl || '').trim()
    if (!t) return ''
    if (/^https?:\/\//i.test(t)) return t
    return `https://${t}`
  })()

  const hasStravaBlock = Boolean(
    (trip.stravaUrl || '').trim()
    || (trip.stravaTitle || '').trim()
    || (trip.stravaPhoto || '').trim()
  )

  const hasBlocks = trip.blocks?.length > 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 mb-6 group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Назад
      </button>

      {/* Hero */}
      {trip.photos?.[0] && (
        <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden mb-8 cursor-pointer" onClick={() => setPhotoIndex(0)}>
          <img src={trip.photos[0]} alt={trip.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {trip.photos.length > 1 && (
            <div className="absolute bottom-4 right-4 tag bg-black/50 text-white text-sm px-3 py-1.5">+{trip.photos.length - 1} фото</div>
          )}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`tag ${status.color} flex items-center gap-1`}><status.Icon size={10} className="shrink-0" /> {status.label}</span>
            {trip.visibility === 'private'
              ? <span className="tag bg-stone-100 text-stone-500"><Lock size={10} /> Приватна</span>
              : <span className="tag bg-stone-100 text-stone-500"><Globe size={10} /> Публічна</span>}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-800 mb-3">{trip.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-stone-500 text-sm">
            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-brand-500" />{trip.region}</span>
            <span>·</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-brand-500" />{formatDate(trip.startDate)}{trip.endDate ? ` – ${formatDate(trip.endDate)}` : ''}</span>
            {duration && <><span>·</span><span>{duration} {duration === 1 ? 'день' : duration < 5 ? 'дні' : 'днів'}</span></>}
            {budget > 0 && <><span>·</span><span className="flex items-center gap-1 font-semibold text-brand-700"><Wallet size={13} className="shrink-0" />{budget.toLocaleString('uk-UA')} грн</span></>}
          </div>

          {/* Author */}
          {author && (
            <Link
              to={`/profile/${encodeURIComponent(author.username || author.id)}`}
              className="mt-4 inline-flex items-center gap-2.5 group/author"
            >
              {author.avatar ? (
                <img src={author.avatar} alt={author.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {authorInitials}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-stone-700 group-hover/author:text-brand-700 transition-colors leading-tight">
                  {author.name}
                </p>
                {author.username && (
                  <p className="text-xs text-stone-400">@{author.username}</p>
                )}
              </div>
            </Link>
          )}

          {/* Participants */}
          {trip.participants?.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Users size={14} className="text-stone-400 shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {trip.participants.map(p => (
                  <Link
                    key={p.id}
                    to={`/profile/${encodeURIComponent(p.username || p.id)}`}
                    className="text-xs bg-stone-100 hover:bg-brand-50 hover:text-brand-700 text-stone-600 px-2.5 py-1 rounded-full transition-colors font-medium"
                  >
                    @{p.username || p.name}
                  </Link>
                ))}
              </div>
            </div>
          )}


        </div>
        {isOwner && (
          <div className="flex gap-2 shrink-0">
            <Link to={`/trips/${id}/edit`} className="btn-secondary flex items-center gap-2 text-sm py-2"><Edit2 size={14} />Редагувати</Link>
            <button onClick={handleDelete} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-stone-200 transition-colors"><Trash2 size={16} /></button>
          </div>
        )}
      </div>

      {/* Content */}
      {hasBlocks ? (
        /* Block-based story */
        <div className="bg-white rounded-2xl border border-stone-100 p-6 md:p-8">
          <BlockEditor blocks={trip.blocks} onChange={() => {}} editable={false} route={trip.route} />
        </div>
      ) : (
        /* Fallback: simple layout */
        <div className="space-y-6">
          {trip.description && (
            <div className="bg-white rounded-2xl border border-stone-100 p-6">
              <h2 className="font-display font-bold text-xl mb-3">Про подорож</h2>
              <p className="text-stone-600 leading-relaxed">{trip.description}</p>
            </div>
          )}
          {trip.notes && (
            <div className="bg-earth-100 rounded-2xl p-6">
              <h2 className="font-display font-bold text-xl mb-3 flex items-center gap-2"><BookOpen size={18} className="text-stone-500 shrink-0" /> Нотатки</h2>
              <p className="text-stone-600 leading-relaxed whitespace-pre-line">{trip.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Polar-style itinerary + map (stops from planner or migrated from route) */}
      {trip.stops?.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-100 bg-white p-6 shadow-sm shadow-stone-900/5 md:p-7">
          <h2 className="font-display mb-5 text-xl font-bold text-stone-800 flex items-center gap-2"><MapPin size={18} className="text-brand-500 shrink-0" /> Маршрут і зупинки</h2>
          <PolarPlanner
            stops={trip.stops}
            legs={trip.legs || []}
            onChange={() => {}}
            editable={false}
            startDate={trip.startDate}
            syncRoute={false}
          />
        </div>
      )}

      {hasStravaBlock && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50/30 shadow-sm shadow-stone-900/5">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-orange-100/80 px-6 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/30">
              <Footprints size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-stone-800">Пішки / Strava</h2>
              {(trip.stravaTitle || '').trim() && (
                <p className="text-sm text-stone-500 leading-tight">{trip.stravaTitle.trim()}</p>
              )}
            </div>
            {stravaHref && (
              <a
                href={stravaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-500/30 hover:bg-orange-600 transition-colors"
              >
                <ExternalLink size={14} />
                Відкрити
              </a>
            )}
          </div>

          {/* Photo */}
          {trip.stravaPhoto ? (
            <div className="flex items-center justify-center overflow-hidden">
              <img
                src={trip.stravaPhoto}
                alt=""
                className="max-h-[min(75vh,600px)] w-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-stone-400">
              <Footprints size={28} className="text-orange-200" />
              <p>Скріншот активності не додано</p>
            </div>
          )}
        </div>
      )}

      {/* Route map (legacy hand-drawn route only when no structured stops) */}
      {trip.route?.length > 0 && !(trip.stops?.length > 0) && !trip.blocks?.some(b => b.type === 'map') && (
        <div className="mt-6 bg-white rounded-2xl border border-stone-100 p-6">
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><Map size={18} className="text-brand-500 shrink-0" /> Маршрут</h2>
          <MapContainer center={[trip.route[0].lat, trip.route[0].lng]} zoom={7} style={{ height: 280 }} className="rounded-2xl">
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {trip.route.map((p, i) => <Marker key={i} position={[p.lat, p.lng]}><Popup>{p.name}</Popup></Marker>)}
            {trip.route.length > 1 && <Polyline positions={trip.route.map(p => [p.lat, p.lng])} color="#2e6e59" weight={3} dashArray="8,4" />}
          </MapContainer>
          <div className="mt-4 space-y-2">
            {trip.route.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                {p.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planner: classic day view if present */}
      {trip.days?.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-stone-100 p-6">
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><CalendarDays size={18} className="text-brand-500 shrink-0" /> Програма по днях</h2>
          <TripPlanner days={trip.days} onChange={() => {}} editable={false} startDate={trip.startDate} />
        </div>
      )}

      {/* Photo gallery */}
      {trip.photos?.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-stone-100 p-6">
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><Camera size={18} className="text-brand-500 shrink-0" /> Галерея</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {trip.photos.map((photo, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPhotoIndex(i)}>
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {photoIndex !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPhotoIndex(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setPhotoIndex(null)}><X size={28} /></button>
          <button className="absolute left-4 text-white/70 hover:text-white" onClick={e => { e.stopPropagation(); setPhotoIndex(Math.max(0, photoIndex-1)) }}><ChevronLeft size={36} /></button>
          <img src={trip.photos[photoIndex]} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 text-white/70 hover:text-white" onClick={e => { e.stopPropagation(); setPhotoIndex(Math.min(trip.photos.length-1, photoIndex+1)) }}><ChevronRight size={36} /></button>
          <div className="absolute bottom-4 text-white/60 text-sm">{photoIndex+1} / {trip.photos.length}</div>
        </div>
      )}
    </div>
  )
}
