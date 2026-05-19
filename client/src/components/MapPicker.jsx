import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Trash2 } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) })
  return null
}

export default function MapPicker({ points = [], onChange }) {
  const [nameInput, setNameInput] = useState('')
  const [pendingLatLng, setPendingLatLng] = useState(null)

  const handleMapClick = (latlng) => {
    setPendingLatLng(latlng)
    setNameInput('')
  }

  const confirmPoint = () => {
    if (!pendingLatLng) return
    const name = nameInput.trim() || `Точка ${points.length + 1}`
    onChange([...points, { name, lat: parseFloat(pendingLatLng.lat.toFixed(5)), lng: parseFloat(pendingLatLng.lng.toFixed(5)) }])
    setPendingLatLng(null)
    setNameInput('')
  }

  const removePoint = (i) => onChange(points.filter((_, j) => j !== i))

  const center = points.length > 0 ? [points[0].lat, points[0].lng] : [49.0, 31.5]
  const positions = points.map(p => [p.lat, p.lng])

  return (
    <div className="space-y-3">
      <MapContainer center={center} zoom={6} style={{ height: 320, width: '100%' }} className="rounded-2xl">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onMapClick={handleMapClick} />
        {points.map((point, i) => (
          <Marker key={i} position={[point.lat, point.lng]}>
            <Popup><b>{i + 1}. {point.name}</b><br />{point.lat}, {point.lng}</Popup>
          </Marker>
        ))}
        {pendingLatLng && (
          <Marker position={[pendingLatLng.lat, pendingLatLng.lng]} opacity={0.6}>
            <Popup>Нова точка</Popup>
          </Marker>
        )}
        {positions.length > 1 && <Polyline positions={positions} color="#2e6e59" weight={3} dashArray="8,4" />}
      </MapContainer>

      {pendingLatLng && (
        <div className="flex gap-2 animate-fade-in p-3 bg-brand-50 rounded-xl border border-brand-200">
          <input
            type="text"
            className="input-field flex-1 py-2 text-sm"
            placeholder="Назва точки (напр. Яремче)"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirmPoint()}
            autoFocus
          />
          <button onClick={confirmPoint} className="btn-primary text-sm py-2 px-4">Додати</button>
          <button onClick={() => setPendingLatLng(null)} className="btn-secondary text-sm py-2 px-3">✕</button>
        </div>
      )}

      {!pendingLatLng && (
        <p className="text-xs text-stone-400 text-center">👆 Натисніть на карту, щоб додати точку маршруту</p>
      )}

      {points.length > 0 && (
        <div className="space-y-1.5">
          {points.map((p, i) => (
            <div key={i} className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2">
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="flex-1 text-sm text-stone-700">{p.name}</span>
              <span className="text-xs text-stone-400">{p.lat}, {p.lng}</span>
              <button onClick={() => removePoint(i)} className="text-stone-300 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
