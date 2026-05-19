import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Image, Lock, Clock } from 'lucide-react'
import { TRIP_STATUSES } from '../data/mockData'
import { useAuth } from '../context/AuthContext'

const PLACEHOLDERS = [
  {
    bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 60%, #a7f3d0 100%)',
    blob: 'radial-gradient(ellipse at 78% 22%, rgba(167,243,208,0.55) 0%, transparent 58%)',
    layers: [
      { d: 'M0 68 L18 42 L34 56 L52 24 L70 40 L86 30 L100 38 L100 100 L0 100Z', fill: 'rgba(52,211,153,0.16)' },
      { d: 'M0 82 L22 62 L42 74 L60 52 L78 66 L94 56 L100 62 L100 100 L0 100Z', fill: 'rgba(16,185,129,0.22)' },
    ],
  },
  {
    bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 55%, #bae6fd 100%)',
    blob: 'radial-gradient(ellipse at 22% 28%, rgba(186,230,253,0.6) 0%, transparent 52%)',
    layers: [
      { d: 'M0 60 L22 36 L42 50 L60 20 L78 36 L92 26 L100 32 L100 100 L0 100Z', fill: 'rgba(56,189,248,0.14)' },
      { d: 'M0 78 L20 58 L40 70 L58 50 L76 63 L92 54 L100 60 L100 100 L0 100Z', fill: 'rgba(14,165,233,0.19)' },
    ],
  },
  {
    bg: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 55%, #99f6e4 100%)',
    blob: 'radial-gradient(ellipse at 85% 35%, rgba(153,246,228,0.5) 0%, transparent 55%)',
    layers: [
      { d: 'M0 72 L16 50 L32 62 L54 28 L72 46 L88 34 L100 42 L100 100 L0 100Z', fill: 'rgba(20,184,166,0.15)' },
      { d: 'M0 84 L26 66 L48 77 L66 58 L83 70 L98 62 L100 66 L100 100 L0 100Z', fill: 'rgba(13,148,136,0.2)' },
    ],
  },
  {
    bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 55%, #cbd5e1 100%)',
    blob: 'radial-gradient(ellipse at 65% 20%, rgba(203,213,225,0.7) 0%, transparent 52%)',
    layers: [
      { d: 'M0 65 L28 38 L46 54 L62 22 L80 38 L96 28 L100 34 L100 100 L0 100Z', fill: 'rgba(100,116,139,0.12)' },
      { d: 'M0 80 L24 60 L44 73 L62 54 L80 66 L96 57 L100 63 L100 100 L0 100Z', fill: 'rgba(71,85,105,0.15)' },
    ],
  },
  {
    bg: 'linear-gradient(135deg, #fafaf9 0%, #f5f5f4 40%, #e7f0ea 100%)',
    blob: 'radial-gradient(ellipse at 30% 25%, rgba(187,220,195,0.5) 0%, transparent 55%)',
    layers: [
      { d: 'M0 70 L20 44 L38 58 L56 26 L74 44 L90 32 L100 40 L100 100 L0 100Z', fill: 'rgba(74,150,90,0.11)' },
      { d: 'M0 83 L24 63 L46 75 L64 56 L82 68 L97 60 L100 65 L100 100 L0 100Z', fill: 'rgba(55,120,70,0.15)' },
    ],
  },
]

function TripPlaceholder({ trip }) {
  const idx = trip.id ? trip.id.charCodeAt(0) % PLACEHOLDERS.length : 0
  const v = PLACEHOLDERS[idx]
  return (
    <div className="w-full h-full" style={{ background: v.bg }}>
      <div className="absolute inset-0" style={{ background: v.blob }} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        {v.layers.map((l, i) => <path key={i} d={l.d} fill={l.fill} />)}
      </svg>
    </div>
  )
}

function exactDate(dateStr) {
  return new Date(dateStr).toLocaleString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'щойно'
  if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} хв тому` }
  if (diff < 2 * 86400) { const h = Math.floor(diff / 3600); return `${h} год тому` }
  return exactDate(dateStr)
}

export default function TripCard({ trip }) {
  const { getUserById } = useAuth()
  const localAuthor = trip.authorId ? getUserById(trip.authorId) : null
  const authorName = localAuthor?.name || trip.authorName || null
  const authorAvatar = localAuthor?.avatar || trip.authorAvatar || null

  const formatDate = (d) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
  const duration = Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1)
  const status = TRIP_STATUSES[trip.status] || TRIP_STATUSES.done

  const authorInitials = authorName
    ? authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <Link to={`/trips/${trip.id}`} className="card group flex flex-col animate-slide-up">
      <div className="relative h-48 overflow-hidden bg-stone-100">
        {trip.photos?.[0] ? (
          <img src={trip.photos[0]} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <TripPlaceholder trip={trip} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 right-3 flex gap-1.5">
          {trip.visibility === 'private' && (
            <span className="tag bg-black/50 text-white"><Lock size={10} /></span>
          )}
        </div>
        <div className="absolute bottom-3 left-3">
          <span className={`tag ${status.color} text-xs flex items-center gap-1`}><status.Icon size={10} className="shrink-0" /> {status.label}</span>
        </div>
        {trip.photos?.length > 1 && (
          <div className="absolute bottom-3 right-3">
            <span className="tag bg-black/40 text-white"><Image size={10} /> {trip.photos.length}</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Author */}
        {authorName && (
          <div className="flex items-center gap-2 mb-2.5">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                {authorInitials}
              </div>
            )}
            <span className="text-xs text-stone-400 font-medium">{authorName}</span>
          </div>
        )}

        <h3 className="font-display font-bold text-lg text-stone-800 mb-2 line-clamp-1 group-hover:text-brand-700 transition-colors">{trip.title}</h3>
        <div className="flex items-center gap-3 text-sm text-stone-500 mb-3">
          <span className="flex items-center gap-1"><MapPin size={13} className="text-brand-500" />{trip.region}</span>
          <span className="flex items-center gap-1"><Calendar size={13} className="text-brand-500" />{formatDate(trip.startDate)}</span>
        </div>
        {trip.description && <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">{trip.description}</p>}
        {trip.participants?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {trip.participants.map(p => (
              <span key={p.id} className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                @{p.username || p.name}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between">
          <span className="text-xs text-stone-400">{duration} {duration === 1 ? 'день' : duration < 5 ? 'дні' : 'днів'}</span>
          <div className="flex items-center gap-3">
            {trip.createdAt && (
              <span
                title={exactDate(trip.createdAt)}
                className="flex items-center gap-1 text-xs text-stone-400 cursor-default"
              >
                <Clock size={10} className="shrink-0" />{timeAgo(trip.createdAt)}
              </span>
            )}
            <span className="text-xs font-semibold text-brand-600 group-hover:text-brand-700">Читати →</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
