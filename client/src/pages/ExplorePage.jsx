import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, UserPlus, ChevronRight, Earth, Map, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { REGIONS, TRIP_STATUSES } from '../data/mockData'
import { api } from '../api'
import TripCard from '../components/TripCard'

export default function ExplorePage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(() => searchParams.get('tab') === 'people' ? 'people' : 'trips')
  const [search, setSearch] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [publicTripsAll, setPublicTripsAll] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [peopleSearch, setPeopleSearch] = useState('')

  useEffect(() => {
    api.getPublicTrips()
      .then(setPublicTripsAll)
      .catch(err => console.error('getPublicTrips failed', err))
  }, [])

  useEffect(() => {
    if (tab !== 'people' || !user) return
    api.searchUsers('').then(setAllUsers).catch(() => {})
  }, [tab, user])

  const publicTrips = useMemo(() => publicTripsAll.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
    const matchRegion = !filterRegion || (t.regions || []).includes(filterRegion)
    const matchStatus = !filterStatus || t.status === filterStatus
    return matchSearch && matchRegion && matchStatus
  }), [publicTripsAll, search, filterRegion, filterStatus])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-stone-800 mb-1 flex items-center gap-2">Спільнота <Earth size={26} className="text-brand-500" /></h1>
        <p className="text-stone-500">Публічні подорожі та мандрівники України</p>
      </div>

      <div className="flex gap-1 bg-stone-100 p-1 rounded-2xl mb-6 max-w-xs">
        <button
          type="button"
          onClick={() => { setTab('trips'); setSearchParams({}) }}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${tab === 'trips' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}
        >
          <Map size={14} className="inline-block mr-1 shrink-0" /> Подорожі
        </button>
        <button
          type="button"
          onClick={() => { setTab('people'); setSearchParams({ tab: 'people' }) }}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${tab === 'people' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}
        >
          <Users size={14} className="inline-block mr-1 shrink-0" /> Люди
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Пошук подорожей..."
            className="input-field pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {tab === 'trips' && (
          <>
            <select className="input-field sm:w-44" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
              <option value="">Всі регіони</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="input-field sm:w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Всі статуси</option>
              {Object.entries(TRIP_STATUSES).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {tab === 'trips' && (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(TRIP_STATUSES).map(([key, s]) => {
              const count = publicTripsAll.filter(t => t.status === key).length
              if (!count) return null
              return (
                <button key={key} type="button" onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
                  className={`tag cursor-pointer transition-all text-sm px-3 py-1.5 flex items-center gap-1 ${filterStatus === key ? s.color + ' ring-2 ring-offset-1' : s.color}`}>
                  <s.Icon size={12} className="shrink-0" /> {s.label} <span className="ml-1 font-bold">{count}</span>
                </button>
              )
            })}
          </div>

          {publicTrips.length === 0 ? (
            <div className="text-center py-20">
              <Search size={48} className="text-stone-300 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-stone-600">Нічого не знайдено</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {publicTrips.map(trip => <TripCard key={trip.id} trip={trip} />)}
            </div>
          )}
        </>
      )}

      {tab === 'people' && (
        <div>
          <div className="relative mb-5 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Пошук за ім'ям або @username..."
              className="input-field pl-10"
              value={peopleSearch}
              onChange={e => setPeopleSearch(e.target.value)}
            />
          </div>
          {(() => {
            const q = peopleSearch.toLowerCase()
            const filtered = q
              ? allUsers.filter(u => u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q))
              : allUsers
            if (!filtered.length) return (
              <div className="text-center py-16">
                <Users size={40} className="text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">{peopleSearch ? 'Нікого не знайдено' : 'Завантаження...'}</p>
              </div>
            )
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(u => (
                  <Link
                    key={u.id}
                    to={`/profile/${encodeURIComponent(u.username)}`}
                    state={{ fromPeople: true }}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-100 hover:shadow-md hover:border-brand-200 transition-all"
                  >
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-800 truncate">{u.name}</p>
                      <p className="text-sm text-stone-400">@{u.username}</p>
                      {u.bio && <p className="text-xs text-stone-500 truncate mt-0.5">{u.bio}</p>}
                    </div>
                    <ChevronRight size={16} className="text-stone-300 shrink-0" />
                  </Link>
                ))}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
