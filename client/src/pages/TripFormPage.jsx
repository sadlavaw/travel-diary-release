import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { toDataUrl } from '../utils/convertImage'
import { useNavigate, useMatch } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Footprints, Globe, Lock, Save, Users, Check, ClipboardList, MapPin, BookOpen, Camera, ImageIcon } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import { useTrips } from '../context/TripsContext'
import { useAuth } from '../context/AuthContext'
import { REGIONS, TRIP_STATUSES, VISIBILITY } from '../data/mockData'
import BlockEditor from '../components/BlockEditor'
import TripPlanner from '../components/TripPlanner'
import PolarPlanner from '../components/PolarPlanner'
import { normalizeTrip, stopsToRoute } from '../utils/tripItinerary'

const TABS = [
  { id: 'basic',   label: 'Основне',        Icon: ClipboardList },
  { id: 'strava',  label: 'Пішки / Strava',  Icon: Footprints },
  { id: 'planner', label: 'Зупинки',         Icon: MapPin },
  { id: 'story',   label: 'Розповідь',       Icon: BookOpen },
  { id: 'photos',  label: 'Фото',            Icon: Camera },
]

const EMPTY_FORM = {
  title: '', region: '', startDate: '', endDate: '',
  status: 'done', visibility: 'public',
  description: '', notes: '',
  photos: [], route: [], blocks: [], days: [],
  stops: [], legs: [],
  stravaUrl: '', stravaTitle: '', stravaPhoto: '',
  participants: [],
}

function normalizeStravaUrl(raw) {
  const t = (raw || '').trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

export default function TripFormPage() {
  const editMatch = useMatch({ path: '/trips/:id/edit', end: true })
  const isEdit = Boolean(editMatch)
  const id = editMatch?.params?.id
  const { addTrip, updateTrip, getTripById } = useTrips()
  const { getFriends } = useAuth()
  const navigate = useNavigate()

  const friends = useMemo(() => getFriends(), [])
  const fileRef = useRef()
  const stravaPhotoRef = useRef()

  const [activeTab, setActiveTab] = useState('basic')
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!isEdit || !id) return
    const trip = getTripById(id)
    if (trip) setForm({ ...EMPTY_FORM, ...normalizeTrip(trip) })
  }, [id, isEdit, getTripById])

  const set = useCallback((key, val) => {
    setForm(f => ({ ...f, [key]: val }))
  }, [])

  const handleDaysChange = useCallback((days) => set('days', days), [set])
  const handleBlocksChange = useCallback((blocks) => set('blocks', blocks), [set])
  const handleItineraryChange = useCallback((payload) => {
    setForm(f => ({ ...f, ...payload }))
  }, [])

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = "Назва обов'язкова"
    if (!form.region) e.region = 'Оберіть регіон'
    if (!form.startDate) e.startDate = 'Вкажіть дату початку'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    setSaveError('')
    if (!validate()) {
      setActiveTab('basic')
      setSaveError('Щоб зберегти зміни, заповніть обовʼязкові поля на вкладці «Основне»: назва, регіон і дата початку.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setLoading(true)
    try {
      if (isEdit) {
        const ok = await updateTrip(id, form)
        if (!ok) {
          setSaveError('Не вдалося зберегти. Перевірте підключення до сервера.')
          return
        }
        navigate(`/trips/${id}`)
      } else {
        const trip = await addTrip(form)
        if (!trip) {
          setSaveError('Не вдалося створити подорож. Перевірте підключення до сервера.')
          return
        }
        navigate(`/trips/${trip.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoFiles = async (e) => {
    const files = Array.from(e.target.files)
    e.target.value = ''
    const urls = await Promise.all(files.map(f => toDataUrl(f)))
    setForm(f => ({ ...f, photos: [...f.photos, ...urls] }))
  }

  const handleStravaPhotoFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, stravaPhoto: ev.target.result }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const routeForBlocks =
    (form.stops && form.stops.length > 0) ? stopsToRoute(form.stops) : (form.route || [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {saveError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {saveError}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Назад
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Save size={15} />
          }
          {isEdit ? 'Зберегти' : 'Створити'}
        </button>
      </div>

      <h1 className="font-display text-3xl font-bold text-stone-800 mb-6">
        {isEdit ? 'Редагувати подорож' : 'Нова подорож'}
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-2xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 flex-1 py-2 px-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === t.id ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <t.Icon size={13} className="inline-block mr-1 shrink-0" />{t.label}
          </button>
        ))}
      </div>

      {/* ---- BASIC ---- */}
      {activeTab === 'basic' && (
        <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Назва <span className="text-red-400">*</span></label>
            <input
              type="text"
              className="input-field"
              placeholder="Наприклад: Карпати — зима 2024"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Регіон <span className="text-red-400">*</span></label>
            <select className="input-field" value={form.region} onChange={e => set('region', e.target.value)}>
              <option value="">Оберіть регіон</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Початок <span className="text-red-400">*</span></label>
              <DatePicker
                value={form.startDate}
                onChange={v => set('startDate', v)}
                placeholder="Дата початку"
                maxDate={form.endDate || undefined}
                rangeStart={form.startDate}
                rangeEnd={form.endDate}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Кінець</label>
              <DatePicker
                value={form.endDate}
                onChange={v => set('endDate', v)}
                placeholder="Дата кінця"
                minDate={form.startDate || undefined}
                rangeStart={form.startDate}
                rangeEnd={form.endDate}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Статус</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TRIP_STATUSES).map(([key, s]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('status', key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    form.status === key ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Видимість</label>
            <div className="flex gap-2">
              {Object.entries(VISIBILITY).map(([key, v]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('visibility', key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium flex-1 justify-center transition-all ${
                    form.visibility === key ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {key === 'public' ? <Globe size={14} /> : <Lock size={14} />} {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Учасники */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2">
              <Users size={14} /> Учасники подорожі
            </label>
            {friends.length > 0 ? (
              <div className="space-y-1.5">
                {friends.map(friend => {
                  const selected = (form.participants || []).some(p => p.id === friend.id)
                  const toggle = () => {
                    const current = form.participants || []
                    set('participants', selected
                      ? current.filter(p => p.id !== friend.id)
                      : [...current, { id: friend.id, name: friend.name, username: friend.username, avatar: friend.avatar || null }]
                    )
                  }
                  const initials = friend.name
                    ? friend.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : '?'
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={toggle}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        selected
                          ? 'border-brand-400 bg-brand-50 text-brand-700'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {initials}
                        </div>
                      )}
                      <span className="flex-1 text-left font-medium">{friend.name}</span>
                      <span className="text-xs text-stone-400">@{friend.username}</span>
                      {selected && <Check size={14} className="text-brand-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-stone-400 bg-stone-50 rounded-xl px-4 py-3">
                Додайте друзів у профілі, щоб відзначити учасників подорожі
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Короткий опис</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Кілька речень про подорож..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ---- STRAVA / WALKING ---- */}
      {activeTab === 'strava' && (
        <div className="animate-fade-in space-y-4">
          <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm shadow-stone-900/5 md:p-7">
            <div className="grid items-start gap-8 lg:grid-cols-2">
              <div className="space-y-3 lg:sticky lg:top-4">
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-stone-800">Прев&apos;ю скріну</h3>
                  <p className="text-xs text-stone-500">Зліва — як карта в блоці зупинок; вертикальні знімки без обрізання.</p>
                </div>
                {form.stravaPhoto ? (
                  <div className="flex min-h-[200px] w-full min-w-0 max-h-[min(75vh,560px)] items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-inner shadow-stone-900/5">
                    <img
                      src={form.stravaPhoto}
                      alt=""
                      className="max-h-[min(75vh,560px)] w-auto max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-10 text-center text-sm text-stone-400">
                    <ImageIcon size={32} className="text-stone-300" />
                    <p>Додайте URL або файл — прев&apos;ю з&apos;явиться тут</p>
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Footprints size={20} />
                  </span>
                  <div>
                    <h2 className="font-semibold text-stone-800">Піший маршрут або активність Strava</h2>
                    <p className="mt-1 text-sm leading-relaxed text-stone-500">
                      Маршрут на карті — з вкладки «Зупинки». Тут посилання та поля справа; прев&apos;ю зліва.
                    </p>
                  </div>
                </div>
                <div
                  role="note"
                  className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950/90"
                >
                  Сторінки Strava зазвичай <strong className="font-semibold">не можна вбудувати</strong> у сайт (X-Frame-Options).
                  Відкривайте активність кнопкою; вертикальний скрін добре сидить у прев&apos;ю зліва.
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-stone-700">Посилання на активність Strava</label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://www.strava.com/activities/…"
                    value={form.stravaUrl || ''}
                    onChange={e => set('stravaUrl', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-stone-700">Заголовок посилання (опційно)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Напр.: Ранкова 10 км у Львові"
                    value={form.stravaTitle || ''}
                    onChange={e => set('stravaTitle', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-stone-700">Фото / скрін прев&apos;ю</label>
                  <p className="mb-2 text-xs text-stone-500">URL або файл — зображення з&apos;являється в колонці зліва.</p>
                  <input
                    type="text"
                    className="input-field mb-2"
                    placeholder="https://… (опційно)"
                    value={form.stravaPhoto && !String(form.stravaPhoto).startsWith('data:') ? form.stravaPhoto : ''}
                    onChange={e => set('stravaPhoto', e.target.value)}
                  />
                  {form.stravaPhoto && String(form.stravaPhoto).startsWith('data:') && (
                    <p className="mb-2 text-xs text-stone-500">Зараз використовується зображення з файлу.</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <input ref={stravaPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleStravaPhotoFile} />
                    <button type="button" className="btn-secondary text-sm" onClick={() => stravaPhotoRef.current?.click()}>
                      Вибрати зображення
                    </button>
                    {form.stravaPhoto && (
                      <button type="button" className="text-sm text-red-500 hover:underline" onClick={() => set('stravaPhoto', '')}>
                        Прибрати фото
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="btn-primary inline-flex items-center gap-2"
                    disabled={!normalizeStravaUrl(form.stravaUrl || '')}
                    onClick={() => {
                      const u = normalizeStravaUrl(form.stravaUrl)
                      if (u) window.open(u, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    <ExternalLink size={16} /> Відкрити в Strava
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- PLANNER ---- */}
      {activeTab === 'planner' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm shadow-stone-900/5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-stone-800">Зупинки та переїзди</h2>
                <p className="mt-0.5 text-xs text-stone-500">Маршрут на карті синхронізується з цим списком.</p>
              </div>
              <span className="shrink-0 rounded-lg bg-stone-100 px-2.5 py-1 text-xs text-stone-500">Polarsteps</span>
            </div>
            <PolarPlanner
              stops={form.stops || []}
              legs={form.legs || []}
              onChange={handleItineraryChange}
              editable
              startDate={form.startDate}
            />
          </div>
          <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm shadow-stone-900/5">
            <h2 className="mb-2 font-semibold text-stone-800">Розклад по днях</h2>
            <p className="mb-4 text-xs text-stone-500">Опційно: активності та бюджет по кожному дню.</p>
            <TripPlanner
              days={form.days}
              onChange={handleDaysChange}
              editable
              startDate={form.startDate}
            />
          </div>
        </div>
      )}

      {/* ---- STORY ---- */}
      {activeTab === 'story' && (
        <div className="animate-fade-in rounded-2xl border border-stone-100 bg-white p-6 shadow-sm shadow-stone-900/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-700">Розповідь — конструктор блоків</h2>
            <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-lg">як Notion</span>
          </div>
          <BlockEditor
            blocks={form.blocks}
            onChange={handleBlocksChange}
            editable={true}
            route={routeForBlocks}
          />
        </div>
      )}

      {/* ---- PHOTOS ---- */}
      {activeTab === 'photos' && (
        <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4 animate-fade-in">
          <h2 className="font-semibold text-stone-700">Фотографії обкладинки</h2>
          {form.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {form.photos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => set('photos', form.photos.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-stone-200 rounded-xl py-10 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors"
          >
            <Camera size={40} className="text-stone-300 mx-auto mb-2" />
            <p className="text-stone-500 font-medium">Натисніть щоб вибрати фото з комп'ютера</p>
            <p className="text-stone-400 text-sm mt-1">JPG, PNG, WEBP, HEIC</p>
            <input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={handlePhotoFiles} />
          </div>
        </div>
      )}

      {/* Bottom save */}
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Скасувати</button>
        <button type="button" onClick={handleSave} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading
            ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : isEdit ? 'Зберегти зміни' : 'Створити подорож'
          }
        </button>
      </div>
    </div>
  )
}
