import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Image, Lock, Clock } from 'lucide-react'
import { TRIP_STATUSES } from '../data/mockData'
import { useAuth } from '../context/AuthContext'

function PlaceholderMountains() {
  return (
    <div className="w-full h-full" style={{ background: 'linear-gradient(170deg,#d4e4f0 0%,#a8c4da 50%,#7a9fb8 100%)' }}>
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <circle cx="168" cy="18" r="18" fill="rgba(220,238,255,0.35)" />
        {/* Far range */}
        <polygon points="0,100 0,72 18,50 32,62 52,32 68,46 88,36 108,52 128,28 148,44 168,34 188,48 200,42 200,100" fill="rgba(130,158,190,0.55)" />
        {/* Near range */}
        <polygon points="0,100 0,80 16,66 30,76 48,60 64,72 82,58 100,70 120,56 140,68 160,60 180,68 200,62 200,100" fill="rgba(90,122,158,0.68)" />
        {/* Snow caps */}
        <polygon points="52,32 44,50 60,50" fill="rgba(235,248,255,0.93)" />
        <polygon points="128,28 120,45 136,45" fill="rgba(235,248,255,0.93)" />
        <polygon points="168,34 161,50 175,50" fill="rgba(235,248,255,0.88)" />
        {/* Ground */}
        <polygon points="0,100 0,88 200,85 200,100" fill="rgba(60,92,128,0.38)" />
      </svg>
    </div>
  )
}

function PlaceholderSea() {
  return (
    <div className="w-full h-full" style={{ background: 'linear-gradient(180deg,#bfdbfe 0%,#7dd3fc 38%,#1d4ed8 100%)' }}>
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <circle cx="155" cy="36" r="12" fill="rgba(253,224,71,0.88)" />
        <circle cx="155" cy="36" r="18" fill="rgba(253,224,71,0.18)" />
        {/* Horizon */}
        <rect x="0" y="43" width="200" height="3" fill="rgba(255,255,255,0.2)" />
        {/* Deep water */}
        <polygon points="0,100 0,46 200,44 200,100" fill="rgba(29,78,216,0.62)" />
        {/* Wave layers — angular cubist */}
        <polygon points="0,100 0,62 25,57 50,63 75,56 100,63 125,56 150,63 175,57 200,62 200,100" fill="rgba(37,99,235,0.52)" />
        <polygon points="0,100 0,74 30,70 60,76 90,70 120,76 150,70 180,75 200,72 200,100" fill="rgba(96,165,250,0.48)" />
        <polygon points="0,100 0,85 40,82 80,86 120,82 160,86 200,83 200,100" fill="rgba(186,230,253,0.4)" />
      </svg>
    </div>
  )
}

function PlaceholderFields() {
  return (
    <div className="w-full h-full" style={{ background: 'linear-gradient(180deg,#fef9c3 0%,#fde68a 42%,#b45309 100%)' }}>
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <ellipse cx="38" cy="20" rx="28" ry="10" fill="rgba(255,255,255,0.28)" />
        <ellipse cx="148" cy="16" rx="22" ry="8" fill="rgba(255,255,255,0.22)" />
        {/* Field */}
        <polygon points="0,100 0,65 45,60 100,63 155,59 200,62 200,100" fill="rgba(101,163,13,0.72)" />
        <polygon points="0,100 0,80 200,77 200,100" fill="rgba(77,124,15,0.65)" />
        {/* Sunflowers: stem + octagon petals + center */}
        {[[28,52],[68,48],[108,51],[150,47],[182,53]].map(([cx,cy],i) => (
          <g key={i}>
            <rect x={cx-1.5} y={cy} width="3" height="50" fill="rgba(63,98,18,0.8)" />
            <polygon points={`${cx},${cy-12} ${cx+8},${cy-8} ${cx+11},${cy} ${cx+8},${cy+8} ${cx},${cy+11} ${cx-8},${cy+8} ${cx-11},${cy} ${cx-8},${cy-8}`} fill="rgba(251,191,36,0.92)" />
            <circle cx={cx} cy={cy} r="4.5" fill="rgba(120,53,15,0.88)" />
          </g>
        ))}
      </svg>
    </div>
  )
}

function PlaceholderForest() {
  const backTrees = [[12,78,36,28],[38,76,28,22],[65,78,32,26],[92,75,28,24],[118,77,34,28],[145,76,28,22],[172,78,30,26]]
  const frontTrees = [[25,80,22,18],[55,81,26,20],[85,80,20,16],[115,81,24,19],[148,80,22,18],[175,81,20,16]]
  return (
    <div className="w-full h-full" style={{ background: 'linear-gradient(180deg,#d1fae5 0%,#34d399 42%,#065f46 100%)' }}>
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        {backTrees.map(([x,base,w,h],i) => (
          <g key={i}>
            <rect x={x-2} y={base-5} width="4" height="10" fill="rgba(30,41,10,0.45)" />
            <polygon points={`${x},${base-h} ${x-w/2},${base} ${x+w/2},${base}`} fill="rgba(16,185,129,0.62)" />
            <polygon points={`${x},${base-h-8} ${x-w/3},${base-h/2} ${x+w/3},${base-h/2}`} fill="rgba(5,150,105,0.7)" />
          </g>
        ))}
        <polygon points="0,100 0,78 200,75 200,100" fill="rgba(4,120,87,0.78)" />
        {frontTrees.map(([x,base,w,h],i) => (
          <g key={i}>
            <rect x={x-2} y={base-4} width="3" height="8" fill="rgba(20,30,10,0.55)" />
            <polygon points={`${x},${base-h} ${x-w/2},${base} ${x+w/2},${base}`} fill="rgba(4,120,87,0.78)" />
            <polygon points={`${x},${base-h-6} ${x-w/3},${base-h/2} ${x+w/3},${base-h/2}`} fill="rgba(6,78,59,0.82)" />
          </g>
        ))}
      </svg>
    </div>
  )
}

function PlaceholderCity() {
  const buildings = [[0,58,22,42],[24,48,18,52],[44,36,20,64],[66,50,16,50],[84,30,18,70],[104,44,24,56],[130,38,16,62],[148,53,20,47],[170,40,18,60],[190,56,10,44]]
  const windows = [[8,64],[8,74],[14,64],[14,74],[27,54],[27,64],[34,54],[47,42],[47,52],[53,42],[87,37],[87,47],[93,37],[107,50],[113,50],[107,60],[133,44],[133,54],[152,59],[158,59],[173,46],[173,56]]
  return (
    <div className="w-full h-full" style={{ background: 'linear-gradient(180deg,#bfdbfe 0%,#dbeafe 40%,#e0f2fe 100%)' }}>
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        {/* Sun */}
        <circle cx="30" cy="18" r="11" fill="rgba(253,224,71,0.92)" />
        <circle cx="30" cy="18" r="18" fill="rgba(253,224,71,0.18)" />
        {/* Clouds */}
        <ellipse cx="90" cy="14" rx="22" ry="8" fill="rgba(255,255,255,0.7)" />
        <ellipse cx="110" cy="12" rx="16" ry="7" fill="rgba(255,255,255,0.65)" />
        <ellipse cx="160" cy="20" rx="18" ry="7" fill="rgba(255,255,255,0.6)" />
        {/* Buildings — slate silhouettes */}
        {buildings.map(([x,y,w,h],i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill="rgba(71,85,105,0.75)" />
        ))}
        {/* Windows — light blue reflections */}
        {windows.map(([x,y],i) => (
          <rect key={i} x={x} y={y} width="3" height="3" fill="rgba(186,230,253,0.85)" />
        ))}
        {/* Ground */}
        <rect x="0" y="95" width="200" height="5" fill="rgba(51,65,85,0.5)" />
      </svg>
    </div>
  )
}

function PlaceholderRiver() {
  return (
    <div className="w-full h-full" style={{ background: 'linear-gradient(155deg,#d1fae5 0%,#a7f3d0 55%,#6ee7b7 100%)' }}>
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <circle cx="160" cy="22" r="20" fill="rgba(255,255,255,0.2)" />
        {/* Left bank */}
        <polygon points="0,100 0,40 14,46 28,38 42,50 54,42 66,55 72,100" fill="rgba(34,197,94,0.55)" />
        {/* River */}
        <polygon points="72,100 66,55 54,42 58,28 76,22 96,26 112,20 128,24 140,16 150,26 142,38 150,50 140,62 136,100" fill="rgba(56,189,248,0.72)" />
        {/* Reflection highlights */}
        <polygon points="80,88 83,72 87,67 90,78 90,88" fill="rgba(186,230,253,0.5)" />
        <polygon points="126,82 128,67 132,62 134,74 134,82" fill="rgba(186,230,253,0.5)" />
        {/* Right bank */}
        <polygon points="136,100 140,62 150,50 142,38 150,26 163,32 178,26 194,30 200,38 200,100" fill="rgba(22,163,74,0.55)" />
        <polygon points="0,100 0,87 200,84 200,100" fill="rgba(21,128,61,0.38)" />
      </svg>
    </div>
  )
}

const MOUNTAIN_REGIONS = ['івано-франк','закарпат','чернівец','львів']
const SEA_REGIONS = ['одеськ','миколаїв','херсон']
const FIELD_REGIONS = ['полтав','кіровоград','черкас','харків','запоріз','дніпр']
const FOREST_REGIONS = ['волин','житомир','чернігів','рівнен','сум']

export function TripPlaceholder({ trip }) {
  const r = (trip.region || '').toLowerCase()
  let Component
  if (MOUNTAIN_REGIONS.some(k => r.includes(k))) Component = PlaceholderMountains
  else if (SEA_REGIONS.some(k => r.includes(k))) Component = PlaceholderSea
  else if (FIELD_REGIONS.some(k => r.includes(k))) Component = PlaceholderFields
  else if (FOREST_REGIONS.some(k => r.includes(k))) Component = PlaceholderForest
  else if (r.includes('київ')) Component = PlaceholderCity
  else Component = PlaceholderRiver
  return <Component />
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
