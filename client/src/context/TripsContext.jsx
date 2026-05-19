import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import { normalizeTrip } from '../utils/tripItinerary'
import { useAuth } from './AuthContext'

const TripsContext = createContext(null)

export function TripsProvider({ children }) {
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setTrips([])
      return
    }
    setLoading(true)
    api.getTrips()
      .then(data => setTrips(data.map(normalizeTrip)))
      .catch(err => console.error('getTrips failed', err))
      .finally(() => setLoading(false))
  }, [user])

  const addTrip = async (trip) => {
    try {
      const newTrip = await api.createTrip({ ...trip, authorId: user?.id })
      const normalized = normalizeTrip(newTrip)
      setTrips(prev => [normalized, ...prev])
      return normalized
    } catch (err) {
      console.error('createTrip failed', err)
      return null
    }
  }

  const updateTrip = async (id, updates) => {
    const current = trips.find(t => String(t.id) === String(id))
    if (!current) return false
    const merged = normalizeTrip({ ...current, ...updates })
    try {
      const updated = await api.updateTrip(id, merged)
      const normalized = normalizeTrip(updated)
      setTrips(prev => prev.map(t => String(t.id) === String(id) ? normalized : t))
      return true
    } catch (err) {
      console.error('updateTrip failed', err)
      return false
    }
  }

  const deleteTrip = async (id) => {
    try {
      await api.deleteTrip(id)
      setTrips(prev => prev.filter(t => String(t.id) !== String(id)))
      return true
    } catch (err) {
      console.error('deleteTrip failed', err)
      return false
    }
  }

  const getTripById = useCallback(
    (id) => trips.find(t => String(t.id) === String(id)),
    [trips],
  )

  return (
    <TripsContext.Provider value={{ trips, loading, addTrip, updateTrip, deleteTrip, getTripById }}>
      {children}
    </TripsContext.Provider>
  )
}

export const useTrips = () => useContext(TripsContext)
