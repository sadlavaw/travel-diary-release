import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, Trash2, ImageIcon, Map, FileText, TramFront, Home, Minus, ChevronUp, ChevronDown, MapPin, PlaneTakeoff, PlaneLanding, Wallet, BookOpen } from 'lucide-react'
import DatePicker from './DatePicker'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { useNominatimSearch } from '../hooks/useNominatimSearch'
import { toDataUrl } from '../utils/convertImage'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const BLOCK_DEFS = [
  { type: 'text',          Icon: FileText,  label: 'Текст' },
  { type: 'image',         Icon: ImageIcon, label: 'Фото' },
  { type: 'map',           Icon: Map,       label: 'Карта маршруту' },
  { type: 'transport',     Icon: TramFront, label: 'Транспорт' },
  { type: 'accommodation', Icon: Home,      label: 'Житло' },
  { type: 'divider',       Icon: Minus,     label: 'Розділювач' },
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

const INPUT_CLS = 'w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent'

// --- TextBlock with auto-resize ---
function TextBlock({ content, onChange, editable }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = ref.current.scrollHeight + 'px'
  }, [content])

  if (!editable) return <p className="text-stone-700 leading-relaxed whitespace-pre-line">{content}</p>
  return (
    <textarea
      ref={ref}
      className="w-full resize-none bg-transparent outline-none text-stone-700 leading-relaxed placeholder-stone-300 focus:ring-0 overflow-hidden"
      style={{ minHeight: '80px' }}
      placeholder="Пишіть тут свою розповідь..."
      value={content || ''}
      onChange={e => onChange(e.target.value)}
    />
  )
}

// --- ImageBlock with HEIC support ---
function ImageBlock({ block, onChange, editable }) {
  const fileRef = useRef()
  const [converting, setConverting] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setConverting(true)
    try {
      const dataUrl = await toDataUrl(file)
      onChange({ ...block, url: dataUrl })
    } finally {
      setConverting(false)
      e.target.value = ''
    }
  }

  if (!editable) {
    if (!block.url) return null
    return (
      <figure>
        <img src={block.url} alt={block.caption || ''} className="w-full rounded-xl object-contain max-h-[600px] bg-stone-50" />
        {block.caption && <figcaption className="text-center text-sm text-stone-400 mt-2 italic">{block.caption}</figcaption>}
      </figure>
    )
  }

  return (
    <div className="space-y-2">
      {block.url ? (
        <div className="relative group">
          <img src={block.url} alt="" className="w-full rounded-xl object-contain max-h-[400px] bg-stone-50" />
          <button
            type="button"
            onClick={() => onChange({ ...block, url: '' })}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !converting && fileRef.current?.click()}
          className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors"
        >
          {converting ? (
            <div className="flex flex-col items-center gap-2 text-stone-400">
              <span className="w-6 h-6 border-2 border-stone-200 border-t-brand-600 rounded-full animate-spin" />
              <p className="text-sm">Конвертація HEIC…</p>
            </div>
          ) : (
            <>
              <ImageIcon size={28} className="mx-auto text-stone-300 mb-2" />
              <p className="text-sm text-stone-400">Натисніть щоб вибрати фото</p>
              <p className="text-xs text-stone-300 mt-1">JPG, PNG, WEBP, HEIC</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleFile} />
        </div>
      )}
      <input
        type="text"
        placeholder="Підпис до фото (необов'язково)"
        value={block.caption || ''}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        className={INPUT_CLS}
      />
    </div>
  )
}

// --- MapBlock ---
function MapBlock({ route }) {
  if (!route?.length) {
    return <div className="bg-stone-50 rounded-xl p-6 text-center text-stone-400 text-sm">Додайте точки маршруту на вкладці «Маршрут» — вони відобразяться тут</div>
  }
  const center = [route[0].lat, route[0].lng]
  return (
    <MapContainer center={center} zoom={7} style={{ height: 260, width: '100%' }} className="rounded-xl">
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {route.map((p, i) => <Marker key={i} position={[p.lat, p.lng]}><Popup>{p.name}</Popup></Marker>)}
      {route.length > 1 && <Polyline positions={route.map(p => [p.lat, p.lng])} color="#2e6e59" weight={3} dashArray="6,4" />}
    </MapContainer>
  )
}

// --- City search input for TransportBlock ---
function CitySearchInput({ value, onChangeName, placeholder }) {
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
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      )}
      {open && q.length >= 2 && results.length > 0 && (
        <ul className="absolute z-30 top-full mt-0.5 left-0 right-0 bg-white border border-stone-200 rounded-xl shadow-lg max-h-44 overflow-auto">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-brand-50 flex items-center gap-1.5"
              >
                <MapPin size={11} className="text-brand-500 shrink-0" />
                <span className="truncate">{r.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// --- TransportBlock ---
function TransportBlock({ block, onChange, editable }) {
  const depDate = block.departureDate || block.date || ''
  const arrDate = block.arrivalDate || ''

  const fmt = (date, time) => {
    if (!date) return null
    const d = new Date(date).toLocaleDateString('uk-UA')
    return time ? `${d} о ${time}` : d
  }

  if (!editable) return (
    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-3">
      <TramFront size={22} className="text-purple-500 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <p className="font-semibold text-stone-800">
          {block.provider || 'Транспорт'}
          {block.from ? `: ${block.from} → ${block.to}` : ''}
        </p>
        {depDate && <p className="text-sm text-stone-500 flex items-center gap-1"><PlaneTakeoff size={12} className="shrink-0" /> Відправлення: {fmt(depDate, block.departureTime)}</p>}
        {arrDate && <p className="text-sm text-stone-500 flex items-center gap-1"><PlaneLanding size={12} className="shrink-0" /> Прибуття: {fmt(arrDate, block.arrivalTime)}</p>}
        {block.price && <p className="text-sm font-semibold text-brand-700 flex items-center gap-1"><Wallet size={12} className="shrink-0" /> {block.price} грн</p>}
        {block.link && <a href={block.link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Квиток →</a>}
      </div>
    </div>
  )

  return (
    <div className="space-y-2.5">
      {/* Provider */}
      <select
        className={INPUT_CLS}
        value={block.provider || ''}
        onChange={e => onChange({ ...block, provider: e.target.value })}
      >
        <option value="">Оберіть перевізника…</option>
        {TRANSPORT_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      {/* From / To */}
      <div className="grid grid-cols-2 gap-2">
        <CitySearchInput
          placeholder="Місто відправки"
          value={block.from || ''}
          onChangeName={v => onChange({ ...block, from: v })}
        />
        <CitySearchInput
          placeholder="Місто прибуття"
          value={block.to || ''}
          onChangeName={v => onChange({ ...block, to: v })}
        />
      </div>

      {/* Departure */}
      <div>
        <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1 flex items-center gap-1"><PlaneTakeoff size={10} className="shrink-0" /> Відправлення</p>
        <div className="grid grid-cols-2 gap-2">
          <DatePicker
            value={block.departureDate || block.date || ''}
            onChange={v => onChange({ ...block, departureDate: v, date: v })}
            placeholder="Дата"
            triggerCls={INPUT_CLS + ' flex items-center gap-1.5'}
          />
          <input type="time" className={INPUT_CLS}
            value={block.departureTime || ''}
            onChange={e => onChange({ ...block, departureTime: e.target.value })} />
        </div>
      </div>

      {/* Arrival */}
      <div>
        <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1 flex items-center gap-1"><PlaneLanding size={10} className="shrink-0" /> Прибуття</p>
        <div className="grid grid-cols-2 gap-2">
          <DatePicker
            value={block.arrivalDate || ''}
            onChange={v => onChange({ ...block, arrivalDate: v })}
            placeholder="Дата"
            minDate={block.departureDate || block.date || undefined}
            triggerCls={INPUT_CLS + ' flex items-center gap-1.5'}
          />
          <input type="time" className={INPUT_CLS}
            value={block.arrivalTime || ''}
            onChange={e => onChange({ ...block, arrivalTime: e.target.value })} />
        </div>
      </div>

      {/* Price & Link */}
      <div className="grid grid-cols-2 gap-2">
        <input type="number" placeholder="Ціна (грн)" className={INPUT_CLS}
          value={block.price || ''}
          onChange={e => onChange({ ...block, price: e.target.value })} />
        <input type="text" placeholder="Посилання на квиток" className={INPUT_CLS}
          value={block.link || ''}
          onChange={e => onChange({ ...block, link: e.target.value })} />
      </div>
    </div>
  )
}

// --- AccommodationBlock ---
function AccommodationBlock({ block, onChange, editable }) {
  if (!editable) return (
    <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex gap-3">
      <Home size={22} className="text-green-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-stone-800">{block.name || 'Житло'}</p>
        {block.location && <p className="text-sm text-stone-500">{block.location}</p>}
        {block.price && <p className="text-sm font-semibold text-brand-700 flex items-center gap-1"><Wallet size={12} className="shrink-0" /> {block.price} грн/ніч{block.nights ? ` × ${block.nights} = ${block.price * block.nights} грн` : ''}</p>}
        {block.link && <a href={block.link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Бронювання →</a>}
      </div>
    </div>
  )
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        { k: 'name',     p: 'Назва (готель, квартира…)', col: 'col-span-2' },
        { k: 'location', p: 'Місто / адреса' },
        { k: 'price',    p: 'Ціна за ніч (грн)' },
        { k: 'nights',   p: 'Кількість ночей' },
        { k: 'link',     p: 'Посилання Booking/Airbnb', col: 'col-span-2' },
      ].map(f => (
        <input key={f.k} type="text"
          className={`border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent ${f.col || ''}`}
          placeholder={f.p} value={block[f.k] || ''}
          onChange={e => onChange({ ...block, [f.k]: e.target.value })} />
      ))}
    </div>
  )
}

// --- Add block menu ---
function AddMenu({ onAdd, onClose }) {
  return (
    <div className="absolute z-30 bg-white rounded-2xl shadow-xl border border-stone-100 p-2 w-64 animate-scale-in">
      {BLOCK_DEFS.map(b => (
        <button key={b.type} type="button"
          onClick={() => { onAdd(b.type); onClose() }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-brand-50 text-sm text-stone-700 hover:text-brand-700 transition-colors">
          <b.Icon size={16} className="shrink-0" /> {b.label}
        </button>
      ))}
    </div>
  )
}

// --- Main component ---
export default function BlockEditor({ blocks = [], onChange, editable = true, route = [] }) {
  const [addMenuAt, setAddMenuAt] = useState(null)

  const createBlock = (type) => ({
    id: `blk_${Date.now()}_${Math.random()}`,
    type,
    content: '', url: '', caption: '',
    provider: '', from: '', to: '',
    date: '', departureDate: '', departureTime: '',
    arrivalDate: '', arrivalTime: '',
    price: '', link: '',
    name: '', location: '', nights: '',
  })

  const addBlock = useCallback((type, afterIndex) => {
    const nb = createBlock(type)
    const arr = [...blocks]
    arr.splice(afterIndex + 1, 0, nb)
    onChange(arr)
    setAddMenuAt(null)
  }, [blocks, onChange])

  const updateBlock = useCallback((i, updated) => {
    const arr = [...blocks]
    arr[i] = updated
    onChange(arr)
  }, [blocks, onChange])

  const removeBlock = useCallback((i) => {
    onChange(blocks.filter((_, j) => j !== i))
  }, [blocks, onChange])

  const moveBlock = useCallback((i, dir) => {
    const arr = [...blocks]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    onChange(arr)
  }, [blocks, onChange])

  const renderBlockContent = (block, i) => {
    switch (block.type) {
      case 'text':
        return <TextBlock content={block.content} onChange={v => updateBlock(i, { ...block, content: v })} editable={editable} />
      case 'image':
        return <ImageBlock block={block} onChange={updated => updateBlock(i, updated)} editable={editable} />
      case 'map':
        return <MapBlock route={route} />
      case 'transport':
        return <TransportBlock block={block} onChange={updated => updateBlock(i, updated)} editable={editable} />
      case 'accommodation':
        return <AccommodationBlock block={block} onChange={updated => updateBlock(i, updated)} editable={editable} />
      case 'divider':
        return <hr className="border-stone-200" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {blocks.length === 0 && editable && (
        <div className="text-center py-10 text-stone-400">
          <BookOpen size={40} className="text-stone-300 mx-auto mb-3" />
          <p className="font-semibold text-stone-500">Розповідь порожня</p>
          <p className="text-sm mt-1">Натисніть кнопку нижче щоб додати перший блок</p>
        </div>
      )}

      {blocks.map((block, i) => {
        const def = BLOCK_DEFS.find(d => d.type === block.type)
        return (
          <div key={block.id} className={`group relative ${editable ? 'bg-stone-50 rounded-2xl p-4' : ''}`}>
            {editable && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-stone-400 flex items-center gap-1.5">
                  {def?.Icon && <def.Icon size={12} className="shrink-0" />} {def?.label}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} className="p-1 text-stone-300 hover:text-stone-600 disabled:opacity-20"><ChevronUp size={14} /></button>
                  <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} className="p-1 text-stone-300 hover:text-stone-600 disabled:opacity-20"><ChevronDown size={14} /></button>
                  <button type="button" onClick={() => removeBlock(i)} className="p-1 text-stone-300 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            )}

            {renderBlockContent(block, i)}

            {editable && (
              <div className="relative mt-3">
                <button
                  type="button"
                  onClick={() => setAddMenuAt(addMenuAt === i ? null : i)}
                  className="text-xs text-stone-300 hover:text-brand-500 flex items-center gap-1 transition-colors"
                >
                  <Plus size={12} /> Вставити блок після
                </button>
                {addMenuAt === i && (
                  <AddMenu onAdd={type => addBlock(type, i)} onClose={() => setAddMenuAt(null)} />
                )}
              </div>
            )}
          </div>
        )
      })}

      {editable && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setAddMenuAt(addMenuAt === -1 ? null : -1)}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-stone-200 rounded-2xl py-4 text-stone-400 hover:border-brand-300 hover:text-brand-600 transition-colors font-medium"
          >
            <Plus size={18} /> Додати блок
          </button>
          {addMenuAt === -1 && (
            <AddMenu onAdd={type => addBlock(type, blocks.length - 1)} onClose={() => setAddMenuAt(null)} />
          )}
        </div>
      )}
    </div>
  )
}
