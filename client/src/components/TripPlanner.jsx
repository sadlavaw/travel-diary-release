import React, { useState, useCallback, useRef, useEffect } from 'react'

const safeUrl = (url) => {
  if (!url) return ''
  const t = url.trim()
  return /^https?:\/\//i.test(t) ? t : ''
}
import { Plus, Trash2, ChevronDown, ChevronUp, MapPin, TramFront, UtensilsCrossed, Home, Camera, FileText, PlaneTakeoff, PlaneLanding, Wallet, CalendarDays } from 'lucide-react'
import DatePicker from './DatePicker'
import { useNominatimSearch } from '../hooks/useNominatimSearch'

const ACTIVITY_TYPES = [
  { type: 'place',         Icon: MapPin,          label: 'Місце',       color: 'bg-blue-50 border-blue-200' },
  { type: 'transport',     Icon: TramFront,       label: 'Транспорт',   color: 'bg-purple-50 border-purple-200' },
  { type: 'food',          Icon: UtensilsCrossed, label: 'Їжа',         color: 'bg-orange-50 border-orange-200' },
  { type: 'accommodation', Icon: Home,            label: 'Житло',       color: 'bg-green-50 border-green-200' },
  { type: 'photo',         Icon: Camera,          label: 'Фото-спот',   color: 'bg-pink-50 border-pink-200' },
  { type: 'note',          Icon: FileText,        label: 'Нотатка',     color: 'bg-yellow-50 border-yellow-200' },
]

const TRANSPORT_PROVIDERS = [
  'Укрзалізниця',
  'BlaBlaCar (машина)',
  'BlaBlaCar (автобус)',
  'Автобус / маршрутка',
  'Літак',
  'Таксі / Bolt / Uber',
  'Власне авто',
  'Пором',
  'Інше',
]

const INPUT_CLS = 'w-full bg-white/70 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand-400'

// --- City search mini (for transport inside day planner) ---
function CitySearchInput({ value, onChangeName, placeholder, colorClass }) {
  const [q, setQ] = useState(value || '')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const { results, loading } = useNominatimSearch(q, { debounceMs: 400, countryCodes: 'ua' })

  useEffect(() => { setQ(value || '') }, [value])

  useEffect(() => {
    const close = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const pick = (item) => {
    const name = item.name.split(',')[0]?.trim() || item.name
    setQ(name)
    onChangeName(name)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={q}
        onChange={e => { setQ(e.target.value); onChangeName(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        className={INPUT_CLS}
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      )}
      {open && q.length >= 2 && results.length > 0 && (
        <ul className="absolute z-30 top-full mt-0.5 left-0 right-0 bg-white border border-stone-200 rounded-xl shadow-lg max-h-36 overflow-auto">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-2 py-1.5 text-xs text-stone-700 hover:bg-brand-50 flex items-center gap-1"
              >
                <MapPin size={10} className="text-brand-500 shrink-0" />
                <span className="truncate">{r.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// --- Food menu editor ---
function FoodEditor({ activity, onUpdate }) {
  const items = activity.menuItems || []

  const addItem = () => {
    onUpdate({ ...activity, menuItems: [...items, ''] })
  }

  const updateItem = (i, val) => {
    const next = [...items]
    next[i] = val
    onUpdate({ ...activity, menuItems: next })
  }

  const removeItem = (i) => {
    onUpdate({ ...activity, menuItems: items.filter((_, j) => j !== i) })
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="text-orange-400 text-xs shrink-0">•</span>
          <input
            type="text"
            placeholder={`Страва ${i + 1}`}
            value={item}
            onChange={e => updateItem(i, e.target.value)}
            className={INPUT_CLS + ' flex-1'}
          />
          <button type="button" onClick={() => removeItem(i)} className="text-stone-300 hover:text-red-400 shrink-0">
            <Trash2 size={11} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="text-xs text-orange-600/70 hover:text-orange-700 flex items-center gap-1 mt-1"
      >
        <Plus size={11} /> Додати страву
      </button>
    </div>
  )
}

// --- Activity row ---
function ActivityRow({ activity, onUpdate, onRemove, editable }) {
  const typeInfo = ACTIVITY_TYPES.find(t => t.type === activity.type) || ACTIVITY_TYPES[0]

  // --- VIEW MODE ---
  if (!editable) {
    return (
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${typeInfo.color}`}>
        <typeInfo.Icon size={18} className="shrink-0 mt-0.5 text-stone-500" />
        <div className="flex-1 min-w-0">
          {activity.time && <span className="text-sm font-mono text-stone-400 mr-2">{activity.time}</span>}
          <span className="font-semibold text-base text-stone-800">{activity.title || typeInfo.label}</span>

          {/* Transport view */}
          {activity.type === 'transport' && (
            <div className="text-sm text-stone-500 mt-1 space-y-1">
              {activity.provider && <p className="flex items-center gap-1.5"><TramFront size={13} className="shrink-0" /> {activity.provider}{activity.fromCity ? `: ${activity.fromCity} → ${activity.toCity}` : ''}</p>}
              {activity.departureDate && <p className="flex items-center gap-1.5"><PlaneTakeoff size={13} className="shrink-0" /> {new Date(activity.departureDate).toLocaleDateString('uk-UA')}{activity.departureTime ? ` о ${activity.departureTime}` : ''}</p>}
              {activity.arrivalDate && <p className="flex items-center gap-1.5"><PlaneLanding size={13} className="shrink-0" /> {new Date(activity.arrivalDate).toLocaleDateString('uk-UA')}{activity.arrivalTime ? ` о ${activity.arrivalTime}` : ''}</p>}
            </div>
          )}

          {/* Accommodation view */}
          {activity.type === 'accommodation' && (
            <div className="text-sm text-stone-500 mt-1 space-y-1">
              {activity.location && <p className="flex items-center gap-1.5"><MapPin size={13} className="shrink-0" /> {activity.location}</p>}
              {activity.pricePerNight && <p className="flex items-center gap-1.5"><Wallet size={13} className="shrink-0" /> {activity.pricePerNight} грн/ніч{activity.nights ? ` × ${activity.nights} = ${activity.pricePerNight * activity.nights} грн` : ''}</p>}
              {safeUrl(activity.link) && <a href={safeUrl(activity.link)} target="_blank" rel="noreferrer noopener" className="text-blue-600 hover:underline">Бронювання →</a>}
            </div>
          )}

          {/* Food view */}
          {activity.type === 'food' && (activity.menuItems || []).length > 0 && (
            <ul className="mt-1 text-sm text-stone-500 space-y-1">
              {activity.menuItems.map((item, i) => item && <li key={i}>• {item}</li>)}
            </ul>
          )}

          {/* Generic description */}
          {activity.type !== 'transport' && activity.type !== 'accommodation' && activity.description && (
            <p className="text-sm text-stone-500 mt-1">{activity.description}</p>
          )}

          {activity.price && activity.type !== 'accommodation' && <p className="text-sm font-semibold text-brand-700 mt-1 flex items-center gap-1.5"><Wallet size={13} className="shrink-0" /> {activity.price} грн</p>}
        </div>
      </div>
    )
  }

  // --- EDIT MODE ---
  return (
    <div className={`p-4 rounded-xl border ${typeInfo.color} space-y-3`}>
      {/* Type selector + remove */}
      <div className="flex items-center gap-2">
        <typeInfo.Icon size={16} className="shrink-0 text-stone-500" />
        <select
          value={activity.type}
          onChange={e => onUpdate({ ...activity, type: e.target.value })}
          className="text-sm font-semibold bg-transparent border-0 outline-none cursor-pointer flex-1"
        >
          {ACTIVITY_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
        </select>
        <button type="button" onClick={onRemove} className="text-stone-400 hover:text-red-500 shrink-0">
          <Trash2 size={13} />
        </button>
      </div>

      {/* TRANSPORT form */}
      {activity.type === 'transport' && (
        <div className="space-y-1.5">
          <select
            value={activity.provider || ''}
            onChange={e => onUpdate({ ...activity, provider: e.target.value })}
            className={INPUT_CLS}
          >
            <option value="">Оберіть перевізника…</option>
            {TRANSPORT_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-1.5">
            <CitySearchInput
              placeholder="Місто відправки"
              value={activity.fromCity || ''}
              onChangeName={v => onUpdate({ ...activity, fromCity: v })}
            />
            <CitySearchInput
              placeholder="Місто прибуття"
              value={activity.toCity || ''}
              onChangeName={v => onUpdate({ ...activity, toCity: v })}
            />
          </div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide flex items-center gap-1"><PlaneTakeoff size={10} className="shrink-0" /> Відправлення</p>
          <div className="grid grid-cols-2 gap-1.5">
            <DatePicker
              value={activity.departureDate || ''}
              onChange={v => onUpdate({ ...activity, departureDate: v })}
              placeholder="Дата"
              triggerCls={INPUT_CLS + ' flex items-center gap-1.5'}
            />
            <input type="time" className={INPUT_CLS}
              value={activity.departureTime || ''}
              onChange={e => onUpdate({ ...activity, departureTime: e.target.value })} />
          </div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide flex items-center gap-1"><PlaneLanding size={10} className="shrink-0" /> Прибуття</p>
          <div className="grid grid-cols-2 gap-1.5">
            <DatePicker
              value={activity.arrivalDate || ''}
              onChange={v => onUpdate({ ...activity, arrivalDate: v })}
              placeholder="Дата"
              minDate={activity.departureDate || undefined}
              triggerCls={INPUT_CLS + ' flex items-center gap-1.5'}
            />
            <input type="time" className={INPUT_CLS}
              value={activity.arrivalTime || ''}
              onChange={e => onUpdate({ ...activity, arrivalTime: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <input type="number" placeholder="Ціна (грн)" className={INPUT_CLS}
              value={activity.price || ''}
              onChange={e => onUpdate({ ...activity, price: e.target.value })} />
            <input type="text" placeholder="Посилання на квиток" className={INPUT_CLS}
              value={activity.link || ''}
              onChange={e => onUpdate({ ...activity, link: e.target.value })} />
          </div>
        </div>
      )}

      {/* ACCOMMODATION form */}
      {activity.type === 'accommodation' && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            <input type="time" className={INPUT_CLS + ' col-span-1'}
              value={activity.time || ''}
              onChange={e => onUpdate({ ...activity, time: e.target.value })} />
            <input type="text" placeholder="Назва (готель, квартира…)" className={INPUT_CLS + ' col-span-2'}
              value={activity.title || ''}
              onChange={e => onUpdate({ ...activity, title: e.target.value })} />
          </div>
          <input type="text" placeholder="Місто / адреса" className={INPUT_CLS}
            value={activity.location || ''}
            onChange={e => onUpdate({ ...activity, location: e.target.value })} />
          <div className="grid grid-cols-2 gap-1.5">
            <input type="number" placeholder="Ціна за ніч (грн)" className={INPUT_CLS}
              value={activity.pricePerNight || ''}
              onChange={e => onUpdate({ ...activity, pricePerNight: e.target.value })} />
            <input type="number" placeholder="Кількість ночей" className={INPUT_CLS}
              value={activity.nights || ''}
              onChange={e => onUpdate({ ...activity, nights: e.target.value })} />
          </div>
          <input type="text" placeholder="Посилання Booking/Airbnb" className={INPUT_CLS}
            value={activity.link || ''}
            onChange={e => onUpdate({ ...activity, link: e.target.value })} />
        </div>
      )}

      {/* FOOD form */}
      {activity.type === 'food' && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            <input type="time" className={INPUT_CLS + ' col-span-1'}
              value={activity.time || ''}
              onChange={e => onUpdate({ ...activity, time: e.target.value })} />
            <input type="text" placeholder="Прийом їжі (Сніданок…)" className={INPUT_CLS + ' col-span-2'}
              value={activity.title || ''}
              onChange={e => onUpdate({ ...activity, title: e.target.value })} />
          </div>
          <FoodEditor activity={activity} onUpdate={onUpdate} />
          <input type="number" placeholder="Загальна вартість (грн)" className={INPUT_CLS}
            value={activity.price || ''}
            onChange={e => onUpdate({ ...activity, price: e.target.value })} />
        </div>
      )}

      {/* DEFAULT form (place, photo, note) */}
      {activity.type !== 'transport' && activity.type !== 'accommodation' && activity.type !== 'food' && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            <input type="time" className={INPUT_CLS + ' col-span-1'}
              value={activity.time || ''}
              onChange={e => onUpdate({ ...activity, time: e.target.value })} />
            <input type="text" placeholder="Назва" className={INPUT_CLS + ' col-span-2'}
              value={activity.title || ''}
              onChange={e => onUpdate({ ...activity, title: e.target.value })} />
          </div>
          <input type="text" placeholder="Опис, адреса, нотатка..."
            value={activity.description || ''}
            onChange={e => onUpdate({ ...activity, description: e.target.value })}
            className={INPUT_CLS} />
          <input type="number" placeholder="Ціна (грн)"
            value={activity.price || ''}
            onChange={e => onUpdate({ ...activity, price: e.target.value })}
            className={INPUT_CLS} />
        </div>
      )}
    </div>
  )
}

function DayCard({ day, dayIndex, startDate, onUpdate, onRemove, editable }) {
  const [open, setOpen] = useState(true)

  const date = startDate
    ? new Date(new Date(startDate).getTime() + dayIndex * 86400000)
    : null
  const dateLabel = date
    ? date.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })
    : `День ${dayIndex + 1}`

  const totalCost = (day.activities || []).reduce((s, a) => {
    if (a.type === 'accommodation' && a.pricePerNight && a.nights) {
      return s + a.pricePerNight * a.nights
    }
    return s + (parseFloat(a.price) || 0)
  }, 0)

  const addActivity = useCallback(() => {
    const newAct = {
      id: `act_${Date.now()}_${Math.random()}`,
      type: 'place', title: '', time: '', description: '', price: '',
      // transport fields
      provider: '', fromCity: '', toCity: '',
      departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', link: '',
      // accommodation fields
      location: '', pricePerNight: '', nights: '',
      // food fields
      menuItems: [],
    }
    onUpdate({ ...day, activities: [...(day.activities || []), newAct] })
  }, [day, onUpdate])

  const updateActivity = useCallback((i, updated) => {
    const acts = [...(day.activities || [])]
    acts[i] = updated
    onUpdate({ ...day, activities: acts })
  }, [day, onUpdate])

  const removeActivity = useCallback((i) => {
    onUpdate({ ...day, activities: (day.activities || []).filter((_, j) => j !== i) })
  }, [day, onUpdate])

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-stone-50 select-none"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-base shrink-0">
          {dayIndex + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-stone-700 capitalize">{dateLabel}</p>
          {day.title && <p className="text-sm text-stone-400 truncate">{day.title}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalCost > 0 && <span className="text-sm font-bold text-brand-700">~{totalCost} грн</span>}
          <span className="text-sm text-stone-400">{(day.activities || []).length} акт.</span>
          {editable && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRemove() }}
              className="text-stone-300 hover:text-red-400 ml-1"
            >
              <Trash2 size={13} />
            </button>
          )}
          {open ? <ChevronUp size={15} className="text-stone-400" /> : <ChevronDown size={15} className="text-stone-400" />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-5 space-y-3 border-t border-stone-100 pt-4">
          {editable && (
            <input
              type="text"
              placeholder="Назва дня (необов'язково)"
              value={day.title || ''}
              onChange={e => onUpdate({ ...day, title: e.target.value })}
              className="w-full input-field py-2 text-sm mb-2"
            />
          )}
          {(day.activities || []).map((act, i) => (
            <ActivityRow
              key={act.id}
              activity={act}
              onUpdate={updated => updateActivity(i, updated)}
              onRemove={() => removeActivity(i)}
              editable={editable}
            />
          ))}
          {editable && (
            <button
              type="button"
              onClick={addActivity}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-stone-200 rounded-xl py-3 text-sm text-stone-400 hover:border-brand-300 hover:text-brand-600 transition-colors mt-2"
            >
              <Plus size={14} /> Додати активність
            </button>
          )}
          {!editable && (day.activities || []).length === 0 && (
            <p className="text-sm text-stone-400 text-center py-2">Активності не заплановані</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function TripPlanner({ days = [], onChange, editable = true, startDate }) {
  const addDay = useCallback(() => {
    onChange([...days, { id: `day_${Date.now()}`, title: '', activities: [] }])
  }, [days, onChange])

  const updateDay = useCallback((i, updated) => {
    const arr = [...days]
    arr[i] = updated
    onChange(arr)
  }, [days, onChange])

  const removeDay = useCallback((i) => {
    onChange(days.filter((_, j) => j !== i))
  }, [days, onChange])

  const totalBudget = days.reduce((s, d) =>
    s + (d.activities || []).reduce((ss, a) => {
      if (a.type === 'accommodation' && a.pricePerNight && a.nights) {
        return ss + a.pricePerNight * a.nights
      }
      return ss + (parseFloat(a.price) || 0)
    }, 0), 0)

  return (
    <div className="space-y-3">
      {totalBudget > 0 && (
        <div className="flex items-center justify-between bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-brand-700 flex items-center gap-1"><Wallet size={14} className="shrink-0" /> Загальний бюджет поїздки</span>
          <span className="font-bold text-brand-800 text-lg">{totalBudget} грн</span>
        </div>
      )}

      {days.length === 0 && (
        <div className="text-center py-12 text-stone-400">
          <CalendarDays size={40} className="text-stone-300 mx-auto mb-3" />
          <p className="font-semibold text-stone-500">Поки що жодного дня</p>
          <p className="text-sm mt-1">Натисніть «Додати день» щоб почати планування</p>
        </div>
      )}

      {days.map((day, i) => (
        <DayCard
          key={day.id}
          day={day}
          dayIndex={i}
          startDate={startDate}
          onUpdate={updated => updateDay(i, updated)}
          onRemove={() => removeDay(i)}
          editable={editable}
        />
      ))}

      {editable && (
        <button
          type="button"
          onClick={addDay}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-stone-200 rounded-2xl py-4 text-stone-400 hover:border-brand-300 hover:text-brand-600 transition-colors font-medium"
        >
          <Plus size={18} /> Додати день
        </button>
      )}
    </div>
  )
}
