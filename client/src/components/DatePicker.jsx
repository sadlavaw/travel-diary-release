import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

const DAYS   = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
]

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fromISO(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function buildCells(year, month) {
  const first  = new Date(year, month, 1)
  const last   = new Date(year, month + 1, 0)
  const offset = (first.getDay() + 6) % 7
  const total  = Math.ceil((offset + last.getDate()) / 7) * 7
  return Array.from({ length: total }, (_, i) => {
    const n = i - offset + 1
    return n >= 1 && n <= last.getDate() ? new Date(year, month, n) : null
  })
}

/**
 * DatePicker — кастомний пікер дати у стилі сайту.
 *
 * Props:
 *   value         — ISO рядок 'YYYY-MM-DD' або ''
 *   onChange      — fn(iso: string)
 *   placeholder   — текст коли дата не вибрана
 *   className     — клас обгортки
 *   triggerCls    — клас кнопки-тригера (за замовчуванням input-field)
 *   minDate       — ISO рядок мінімальної дати
 *   maxDate       — ISO рядок максимальної дати
 *   rangeStart    — ISO рядок початку діапазону (для підсвічування)
 *   rangeEnd      — ISO рядок кінця діапазону (для підсвічування)
 */
export default function DatePicker({
  value,
  onChange,
  placeholder = 'Оберіть дату',
  className = '',
  triggerCls,
  minDate,
  maxDate,
  rangeStart,
  rangeEnd,
}) {
  const [open,   setOpen]   = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [vm,     setVm]     = useState(() => {
    const d = fromISO(value) || new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  const ref      = useRef(null)
  const todayISO = toISO(new Date())

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const openPicker = () => {
    if (value) {
      const d = fromISO(value)
      setVm({ y: d.getFullYear(), m: d.getMonth() })
    }
    const rect = ref.current?.getBoundingClientRect()
    setDropUp(rect ? window.innerHeight - rect.bottom < 330 : false)
    setOpen(o => !o)
  }

  const prevMonth = () => setVm(v => v.m === 0  ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 })
  const nextMonth = () => setVm(v => v.m === 11 ? { y: v.y + 1, m: 0  } : { ...v, m: v.m + 1 })

  const select = (d) => {
    if (!d) return
    const iso = toISO(d)
    if (minDate && iso < minDate) return
    if (maxDate && iso > maxDate) return
    onChange(iso)
    setOpen(false)
  }

  const cells  = buildCells(vm.y, vm.m)
  const display = value
    ? fromISO(value).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const btnCls = triggerCls ?? 'input-field w-full flex items-center gap-2 text-left'

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button type="button" onClick={openPicker} className={btnCls}>
        <CalendarDays size={14} className="text-brand-500 shrink-0" />
        <span className={display ? 'text-stone-800 flex-1 truncate' : 'text-stone-400 flex-1'}>
          {display || placeholder}
        </span>
      </button>

      {/* Popup */}
      {open && (
        <div
          className={[
            'absolute z-50 left-0 bg-white rounded-2xl shadow-2xl border border-stone-100 p-4 w-72',
            'animate-scale-in',
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          ].join(' ')}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <span className="font-display font-bold text-stone-800 text-sm select-none">
              {MONTHS[vm.m]} {vm.y}
            </span>
            <button type="button" onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-stone-400 pb-1 select-none">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="h-9" />
              const iso      = toISO(d)
              const isSel    = iso === value
              const isToday  = iso === todayISO
              const disabled = (minDate && iso < minDate) || (maxDate && iso > maxDate)
              const inRange  = rangeStart && rangeEnd && iso > rangeStart && iso < rangeEnd
              const isEdge   = iso === rangeStart || iso === rangeEnd

              const cls = [
                'h-9 w-full flex items-center justify-center text-sm font-medium transition-all relative select-none',
                isSel    ? 'bg-brand-600 text-white rounded-xl shadow-sm z-10'                   : '',
                isToday && !isSel ? 'text-brand-700 font-bold'                                    : '',
                inRange  && !isSel ? 'bg-brand-50 text-brand-800 rounded-none'                   : '',
                isEdge   && !isSel ? 'bg-brand-100 text-brand-700 rounded-xl'                    : '',
                !isSel && !inRange && !isEdge && !disabled ? 'hover:bg-stone-100 text-stone-700 rounded-xl' : '',
                disabled ? 'text-stone-300 cursor-not-allowed rounded-xl' : 'cursor-pointer',
              ].filter(Boolean).join(' ')

              return (
                <button key={i} type="button" disabled={disabled} onClick={() => select(d)} className={cls}>
                  {d.getDate()}
                  {isToday && !isSel && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
