import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, MapPin, X, Map } from 'lucide-react'
import { useTrips } from '../context/TripsContext'
import { useAuth } from '../context/AuthContext'
import { REGIONS } from '../data/mockData'
import TripCard from '../components/TripCard'

export default function HomePage() {
  const { trips } = useTrips()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const years = useMemo(() => {
    const ys = [...new Set(trips.map(t => new Date(t.startDate).getFullYear()))]
    return ys.sort((a, b) => b - a)
  }, [trips])

  const filtered = useMemo(() => {
    return trips.filter(t => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
      const matchRegion = !filterRegion || t.region === filterRegion
      const matchYear = !filterYear || new Date(t.startDate).getFullYear() === Number(filterYear)
      return matchSearch && matchRegion && matchYear
    })
  }, [trips, search, filterRegion, filterYear])

  const hasFilters = search || filterRegion || filterYear

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-stone-800">
          Привіт, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-stone-500 mt-1">
          {trips.length === 0
            ? 'Поки що подорожей немає. Час починати!'
            : `У вас ${trips.length} ${trips.length === 1 ? 'подорож' : trips.length < 5 ? 'подорожі' : 'подорожей'}`
          }
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Пошук за назвою..."
              className="input-field pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
              showFilters || filterRegion || filterYear
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
            }`}
          >
            <SlidersHorizontal size={16} />
            Фільтри
            {(filterRegion || filterYear) && (
              <span className="bg-white/30 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {(filterRegion ? 1 : 0) + (filterYear ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-white rounded-2xl border border-stone-200 animate-fade-in">
            <div className="flex-1 min-w-40">
              <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1">
                <MapPin size={11} /> Регіон
              </label>
              <select
                className="input-field py-2 text-sm"
                value={filterRegion}
                onChange={e => setFilterRegion(e.target.value)}
              >
                <option value="">Всі регіони</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-32">
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Рік</label>
              <select
                className="input-field py-2 text-sm"
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
              >
                <option value="">Всі роки</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {hasFilters && (
              <div className="flex items-end">
                <button
                  onClick={() => { setSearch(''); setFilterRegion(''); setFilterYear('') }}
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 mb-0.5"
                >
                  <X size={14} /> Скинути
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Map size={48} className="text-stone-300 mx-auto mb-4" />
          <h3 className="font-display text-xl font-bold text-stone-600 mb-2">
            {hasFilters ? 'Нічого не знайдено' : 'Ще немає подорожей'}
          </h3>
          <p className="text-stone-400 mb-6">
            {hasFilters ? 'Спробуйте змінити параметри пошуку' : 'Додайте свою першу подорож Україною'}
          </p>
          {!hasFilters && (
            <Link to="/trips/new" className="btn-primary inline-flex items-center gap-2">
              Додати подорож
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-stone-400 mb-4">
            {filtered.length} {filtered.length === 1 ? 'результат' : filtered.length < 5 ? 'результати' : 'результатів'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
