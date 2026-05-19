import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Image, Lock, Clock } from 'lucide-react'
import { TRIP_STATUSES } from '../data/mockData'
import { useAuth } from '../context/AuthContext'

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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-100 to-earth-100">
            <status.Icon size={40} className="text-brand-400" />
          </div>
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
