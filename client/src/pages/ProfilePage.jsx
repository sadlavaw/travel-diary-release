import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Link, useParams, Navigate, useLocation } from 'react-router-dom'
import {
  Edit2, Save, Search, UserPlus, UserMinus, MapPin, Calendar,
  ArrowLeft, Camera, Users, Map, Wallet,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { toDataUrl } from '../utils/convertImage'
import { useTrips } from '../context/TripsContext'
import { TRIP_STATUSES } from '../data/mockData'
import UkraineMap from '../components/UkraineMap'
import { calcTripBudget, calcPersonalBudget, normalizeTrip } from '../utils/tripItinerary'
import { api } from '../api'

function UserAvatar({ u, size = 'md' }) {
  const initials = u?.name
    ? u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  const cls = size === 'sm'
    ? 'w-9 h-9 text-xs'
    : size === 'lg'
    ? 'w-14 h-14 text-xl'
    : 'w-10 h-10 text-sm'

  return u?.avatar
    ? <img src={u.avatar} alt={u.name} className={`${cls} rounded-full object-cover`} />
    : (
      <div className={`${cls} rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold shrink-0`}>
        {initials}
      </div>
    )
}

function TripPost({ trip }) {
  const { getUserById } = useAuth()
  const status = TRIP_STATUSES[trip.status] || TRIP_STATUSES.done
  const author = trip.authorId ? getUserById(trip.authorId) : null
  const budget = calcTripBudget(trip)
  const duration = trip.startDate && trip.endDate
    ? Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1)
    : null

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group block w-full bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Photo — full width, square */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        {trip.photos?.[0] ? (
          <img
            src={trip.photos[0]}
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-100 to-earth-100">
            <status.Icon size={40} className="text-brand-400" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Status badge top-right */}
        <div className="absolute top-3 right-3">
          <span className={`tag ${status.color} text-xs shadow-sm flex items-center gap-1`}><status.Icon size={10} className="shrink-0" /> {status.label}</span>
        </div>

        {/* Photo count bottom-right */}
        {trip.photos?.length > 1 && (
          <div className="absolute bottom-3 right-3">
            <span className="tag bg-black/50 text-white text-xs">+{trip.photos.length - 1} фото</span>
          </div>
        )}

        {/* Title overlaid on gradient at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-6">
          <h3 className="font-display font-bold text-white text-xl leading-tight drop-shadow group-hover:text-brand-200 transition-colors line-clamp-2">
            {trip.title}
          </h3>
        </div>
      </div>

      {/* Info below photo */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {/* Author */}
        {author && (
          <div className="flex items-center gap-2">
            <UserAvatar u={author} size="sm" />
            <div className="min-w-0">
              <span className="text-sm font-semibold text-stone-700 truncate">{author.name}</span>
              {author.username && <span className="text-xs text-stone-400 ml-1">@{author.username}</span>}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-brand-500" />
            {trip.region}
          </span>
          {trip.startDate && (
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-brand-500" />
              {new Date(trip.startDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {duration && (
            <span>{duration} {duration === 1 ? 'день' : duration < 5 ? 'дні' : 'днів'}</span>
          )}
          {budget > 0 && (
            <span className="flex items-center gap-1 font-semibold text-brand-700">
              <Wallet size={11} /> {budget} грн
            </span>
          )}
        </div>

        {trip.description && (
          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{trip.description}</p>
        )}

        {trip.participants?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {trip.participants.map(p => (
              <span key={p.id} className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                @{p.username || p.name}
              </span>
            ))}
          </div>
        )}
      </div>

    </Link>
  )
}

export default function ProfilePage() {
  const { userId: routeUserId } = useParams()
  const {
    user, updateProfile, searchUsers,
    addFriend, removeFriend, isFriend, getFriends, findUserBySlug,
  } = useAuth()
  const { trips } = useTrips()

  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({ name: user?.name || '', bio: user?.bio || '' })
  const avatarRef = useRef(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [rightTab, setRightTab] = useState('trips')

  const location = useLocation()
  const backLink = location.state?.fromPeople ? '/explore?tab=people' : '/explore'
  const isOtherProfile = Boolean(routeUserId)

  const [profileUser, setProfileUser] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!isOtherProfile || !routeUserId) { setProfileUser(null); return }
    setProfileLoading(true)
    findUserBySlug(routeUserId)
      .then(u => setProfileUser(u))
      .catch(() => setProfileUser(null))
      .finally(() => setProfileLoading(false))
  }, [routeUserId, isOtherProfile])

  const [otherTrips, setOtherTrips] = useState([])
  const [participantTrips, setParticipantTrips] = useState([])

  useEffect(() => {
    if (!isOtherProfile || !profileUser?.id) { setOtherTrips([]); return }
    api.getUserTrips(profileUser.id)
      .then(rows => setOtherTrips(rows.map(normalizeTrip)))
      .catch(() => setOtherTrips([]))
  }, [isOtherProfile, profileUser?.id])

  useEffect(() => {
    const targetId = isOtherProfile ? profileUser?.id : user?.id
    if (!targetId) { setParticipantTrips([]); return }
    api.getParticipantTrips(targetId)
      .then(rows => setParticipantTrips(rows.map(normalizeTrip)))
      .catch(() => setParticipantTrips([]))
  }, [isOtherProfile, profileUser?.id, user?.id])

  const alreadyFriend = isOtherProfile && profileUser ? isFriend(profileUser.id) : false

  const friends = getFriends()

  const displayTrips = useMemo(() => {
    if (isOtherProfile) return otherTrips
    return trips
  }, [isOtherProfile, otherTrips, trips])

  // Всі подорожі для карти і статистики: власні + спільні (без дублів)
  const allTrips = useMemo(() => {
    const ids = new Set(displayTrips.map(t => t.id))
    return [...displayTrips, ...participantTrips.filter(t => !ids.has(t.id))]
  }, [displayTrips, participantTrips])

  const visitedRegions = useMemo(
    () => [...new Set(allTrips.filter(t => t.status === 'done').map(t => t.region).filter(Boolean))],
    [allTrips],
  )
  const plannedRegions = useMemo(
    () => [...new Set(allTrips.filter(t => t.status === 'planned').map(t => t.region).filter(Boolean))],
    [allTrips],
  )
  const activeRegions = useMemo(
    () => [...new Set(allTrips.filter(t => t.status === 'active').map(t => t.region).filter(Boolean))],
    [allTrips],
  )
  const totalPhotos = useMemo(
    () => allTrips.reduce((s, t) => s + (t.photos?.length || 0), 0),
    [allTrips],
  )
  const totalBudget = useMemo(
    () => allTrips.reduce((s, t) => s + calcPersonalBudget(t), 0),
    [allTrips],
  )

  const displayedTrips = showAll ? displayTrips : displayTrips.slice(0, 8)

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await toDataUrl(file)
    updateProfile({ avatar: dataUrl })
    e.target.value = ''
  }

  const handleSearch = async (q) => {
    setSearchQuery(q)
    if (q.length > 1) {
      const results = await searchUsers(q)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const handleSave = async () => {
    await updateProfile(editData)
    setEditing(false)
  }

  const handleFriendToggle = async () => {
    if (!profileUser) return
    if (alreadyFriend) {
      await removeFriend(profileUser.id)
    } else {
      await addFriend(profileUser.id)
    }
  }

  const redirectToSelf = Boolean(isOtherProfile && profileUser && user && profileUser.id === user.id)
  const notFound = Boolean(isOtherProfile && !profileLoading && !profileUser)
  const subject = isOtherProfile && profileUser ? profileUser : user

  const initials = subject?.name
    ? subject.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const tripsHeading = isOtherProfile && profileUser
    ? `Подорожі ${profileUser.name.split(' ')[0]}`
    : 'Мої подорожі'

  if (isOtherProfile && profileLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )

  if (redirectToSelf) return <Navigate to="/profile" replace />

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Search size={48} className="text-stone-300 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-stone-800 mb-2">Користувача не знайдено</h1>
        <p className="text-stone-500 text-sm mb-6">Перевірте посилання або поверніться до спільноти.</p>
        <Link to="/explore" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft size={16} /> До стрічки
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {isOtherProfile && (
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-6"
        >
          <ArrowLeft size={16} /> До стрічки
        </Link>
      )}

      <h1 className="font-display text-3xl font-bold text-stone-800 mb-8">
        {isOtherProfile && profileUser ? profileUser.name : 'Профіль'}
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ====== LEFT COLUMN ====== */}
        <div className="space-y-5">
          {/* User card */}
          <div className="bg-white rounded-2xl border border-stone-100 p-6 text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              {subject?.avatar ? (
                <img src={subject.avatar} alt={subject.name} className="w-20 h-20 rounded-full object-cover shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {initials}
                </div>
              )}
              {!isOtherProfile && (
                <button
                  type="button"
                  onClick={() => avatarRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border-2 border-stone-200 flex items-center justify-center shadow hover:bg-brand-50 transition-colors"
                  title="Змінити фото"
                >
                  <Camera size={13} className="text-stone-500" />
                </button>
              )}
              <input ref={avatarRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleAvatarChange} />
            </div>

            {!isOtherProfile && editing ? (
              <div className="space-y-3 text-left">
                <input
                  className="input-field text-sm"
                  placeholder="Ім'я"
                  value={editData.name}
                  onChange={e => setEditData({ ...editData, name: e.target.value })}
                />
                <textarea
                  className="input-field text-sm resize-none"
                  rows={2}
                  placeholder="Про себе..."
                  value={editData.bio}
                  onChange={e => setEditData({ ...editData, bio: e.target.value })}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1 text-sm py-2">Скасувати</button>
                  <button type="button" onClick={handleSave} className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1">
                    <Save size={13} /> Зберегти
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-display text-xl font-bold text-stone-800">{subject?.name}</h2>
                {subject?.username && <p className="text-stone-400 text-sm">@{subject.username}</p>}
                {subject?.bio && <p className="text-stone-600 text-sm mt-2">{subject.bio}</p>}
                {!isOtherProfile && <p className="text-xs text-stone-400 mt-1">{user?.email}</p>}

                {isOtherProfile && (
                  <button
                    type="button"
                    onClick={handleFriendToggle}
                    className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                      alreadyFriend
                        ? 'bg-stone-100 text-stone-600 hover:bg-red-50 hover:text-red-600'
                        : 'btn-primary'
                    }`}
                  >
                    {alreadyFriend
                      ? <><UserMinus size={16} /> Видалити з друзів</>
                      : <><UserPlus size={16} /> Додати в друзі</>
                    }
                  </button>
                )}

                {!isOtherProfile && (
                  <button
                    type="button"
                    onClick={() => { setEditing(true); setEditData({ name: user?.name || '', bio: user?.bio || '' }) }}
                    className="mt-3 flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mx-auto"
                  >
                    <Edit2 size={13} /> Редагувати
                  </button>
                )}
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { Icon: Map,    val: allTrips.length,                              label: 'Подорожей' },
              { Icon: MapPin, val: visitedRegions.length,                        label: 'Регіонів' },
              { Icon: Camera, val: totalPhotos,                                  label: 'Фото' },
              { Icon: Wallet, val: totalBudget > 0 ? `${totalBudget}₴` : '0',  label: 'Витрат' },
            ].map(({ Icon, val, label }) => (
              <div key={label} className="bg-white rounded-2xl border border-stone-100 p-4 text-center">
                <div className="flex justify-center mb-1"><Icon size={22} className="text-brand-400" /></div>
                <div className="font-display text-xl font-bold text-brand-700 leading-tight">{val}</div>
                <div className="text-xs text-stone-500">{label}</div>
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h3 className="font-semibold text-stone-700 mb-3 text-sm">По статусах</h3>
            {Object.entries(TRIP_STATUSES).map(([key, s]) => (
              <div key={key} className="flex items-center justify-between py-1.5 border-b border-stone-50 last:border-0">
                <span className="text-sm text-stone-600 flex items-center gap-1.5"><s.Icon size={13} className="shrink-0" /> {s.label}</span>
                <span className="font-bold text-stone-800">{allTrips.filter(t => t.status === key).length}</span>
              </div>
            ))}
          </div>

          {/* Search other users */}
          {!isOtherProfile && (
            <div className="bg-white rounded-2xl border border-stone-100 p-5">
              <h3 className="font-semibold text-stone-700 mb-3 text-sm flex items-center gap-2">
                <Search size={14} /> Знайти мандрівника
              </h3>
              <input
                type="text"
                className="input-field text-sm py-2"
                placeholder="@username або ім'я..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  {searchResults.map(u => (
                    <Link
                      key={u.id}
                      to={`/profile/${encodeURIComponent(u.username)}`}
                      className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-brand-50 transition-colors text-left"
                    >
                      <UserAvatar u={u} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800 text-sm truncate">{u.name}</p>
                        <p className="text-xs text-stone-400">@{u.username}</p>
                      </div>
                      {isFriend(u.id)
                        ? <span className="text-xs text-green-600 font-medium">Друг</span>
                        : <UserPlus size={14} className="ml-auto text-brand-500" />
                      }
                    </Link>
                  ))}
                </div>
              )}
              {searchQuery.length > 1 && !searchResults.length && (
                <p className="text-xs text-stone-400 text-center mt-2">Нікого не знайдено</p>
              )}
            </div>
          )}
        </div>

        {/* ====== RIGHT COLUMN ====== */}
        <div className="md:col-span-2 space-y-5">
          {/* Map */}
          <div className="bg-white rounded-2xl border border-stone-100 p-6">
            <h2 className="font-display font-bold text-xl text-stone-800 mb-1 flex items-center gap-2">
              <MapPin size={18} className="text-brand-500" /> Карта мандрів
            </h2>
            <p className="text-sm text-stone-400 mb-4">{visitedRegions.length} з 25 регіонів відвідано</p>
            <UkraineMap
              visitedRegions={visitedRegions}
              plannedRegions={plannedRegions}
              activeRegions={activeRegions}
            />
          </div>

          {/* Tabs: Trips / Friends */}
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <div className="flex border-b border-stone-100">
              <button
                type="button"
                onClick={() => setRightTab('trips')}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  rightTab === 'trips'
                    ? 'text-brand-700 border-b-2 border-brand-500 bg-brand-50/50'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Map size={14} className="inline-block mr-1 shrink-0" /> {tripsHeading}
                {displayTrips.length > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-stone-400">({displayTrips.length})</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setRightTab('shared')}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  rightTab === 'shared'
                    ? 'text-brand-700 border-b-2 border-brand-500 bg-brand-50/50'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Users size={14} className="inline-block mr-1 shrink-0" /> Спільні
                {participantTrips.length > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-stone-400">({participantTrips.length})</span>
                )}
              </button>

              {!isOtherProfile && (
                <button
                  type="button"
                  onClick={() => setRightTab('friends')}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                    rightTab === 'friends'
                      ? 'text-brand-700 border-b-2 border-brand-500 bg-brand-50/50'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <Users size={14} className="inline-block mr-1 shrink-0" /> Друзі
                  {friends.length > 0 && (
                    <span className="ml-1.5 text-xs font-normal text-stone-400">({friends.length})</span>
                  )}
                </button>
              )}
            </div>

            <div className="p-5">
              {/* ---- TRIPS TAB ---- */}
              {rightTab === 'trips' && (
                <>
                  {displayTrips.length > 0 ? (
                    <>
                      {totalBudget > 0 && (
                        <div className="flex justify-end mb-3">
                          <span className="text-sm font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-xl">
                            <Wallet size={13} className="inline-block mr-1 shrink-0" /> Всього: {totalBudget} грн
                          </span>
                        </div>
                      )}
                      <div className="space-y-4">
                        {displayedTrips.map(trip => <TripPost key={trip.id} trip={trip} />)}
                      </div>
                      {displayTrips.length > 8 && (
                        <button
                          type="button"
                          onClick={() => setShowAll(s => !s)}
                          className="mt-4 w-full text-center text-sm text-brand-600 hover:text-brand-700 font-semibold py-2 border border-brand-200 rounded-xl hover:bg-brand-50 transition-colors"
                        >
                          {showAll ? 'Сховати' : `Показати всі ${displayTrips.length} подорожей`}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="py-8 text-center text-stone-400">
                      <Map size={40} className="text-stone-300 mx-auto mb-3" />
                      <p className="font-medium text-stone-600">
                        {isOtherProfile ? 'Публічних подорожей поки немає' : 'Ще немає подорожей'}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ---- SHARED TAB ---- */}
              {rightTab === 'shared' && (
                <>
                  {participantTrips.length > 0 ? (
                    <div className="space-y-4">
                      {participantTrips.map(trip => <TripPost key={trip.id} trip={trip} />)}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-stone-400">
                      <Users size={40} className="text-stone-300 mx-auto mb-3" />
                      <p className="font-medium text-stone-600">
                        {isOtherProfile ? 'Немає спільних подорожей' : 'Вас ще не відмічали у подорожах'}
                      </p>
                      {!isOtherProfile && (
                        <p className="text-sm text-stone-400 mt-1">Попросіть друзів додати вас як учасника</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ---- FRIENDS TAB ---- */}
              {rightTab === 'friends' && !isOtherProfile && (
                <>
                  {friends.length > 0 ? (
                    <div className="space-y-2">
                      {friends.map(friend => (
                        <div
                          key={friend.id}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-colors"
                        >
                          <Link
                            to={`/profile/${encodeURIComponent(friend.username)}`}
                            className="flex items-center gap-3 flex-1 min-w-0"
                          >
                            <UserAvatar u={friend} size="md" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-stone-800 truncate">{friend.name}</p>
                              <p className="text-xs text-stone-400">@{friend.username}</p>
                              {friend.bio && (
                                <p className="text-xs text-stone-500 truncate mt-0.5">{friend.bio}</p>
                              )}
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFriend(friend.id)}
                            className="shrink-0 p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Видалити з друзів"
                          >
                            <UserMinus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-stone-400">
                      <Users size={40} className="text-stone-300 mx-auto mb-3" />
                      <p className="font-medium text-stone-600 mb-1">Список друзів порожній</p>
                      <p className="text-sm text-stone-400">
                        Знайдіть мандрівників через пошук або в стрічці
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
