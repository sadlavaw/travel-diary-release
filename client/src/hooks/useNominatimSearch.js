import { useState, useEffect, useRef } from 'react'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

/**
 * Debounced Nominatim search (usage policy: moderate request rate, identify app).
 * @param {string} query
 * @param {{ debounceMs?: number, countryCodes?: string | null, minChars?: number }} opts
 *   countryCodes e.g. "ua" or "ua,pl" — omit for global search
 */
export function useNominatimSearch(query, opts = {}) {
  const { debounceMs = 400, countryCodes = null, minChars = 2 } = opts
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debounceTimerRef = useRef(null)
  const abortRef = useRef(null)
  const reqIdRef = useRef(0)

  useEffect(() => {
    const q = (query || '').trim()
    if (q.length < minChars) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = window.setTimeout(() => {
      const myId = ++reqIdRef.current
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()

      const params = new URLSearchParams({
        format: 'json',
        limit: '8',
        q,
        addressdetails: '0',
      })
      if (countryCodes) params.set('countrycodes', countryCodes)

      const url = `${NOMINATIM}?${params.toString()}`
      setLoading(true)
      setError(null)

      fetch(url, {
        signal: abortRef.current.signal,
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'uk,en',
        },
      })
        .then(r => {
          if (!r.ok) throw new Error(String(r.status))
          return r.json()
        })
        .then(data => {
          if (reqIdRef.current !== myId) return
          const mapped = (Array.isArray(data) ? data : []).map(item => ({
            name: item.display_name || item.name || '',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            placeId: item.place_id,
          })).filter(x => !Number.isNaN(x.lat) && !Number.isNaN(x.lng))
          setResults(mapped)
        })
        .catch(e => {
          if (e.name === 'AbortError') return
          if (reqIdRef.current !== myId) return
          setError(e.message || 'Помилка')
          setResults([])
        })
        .finally(() => {
          if (reqIdRef.current === myId) setLoading(false)
        })
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [query, debounceMs, countryCodes, minChars])

  return { results, loading, error }
}
