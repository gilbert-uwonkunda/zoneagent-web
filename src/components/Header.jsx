import { useState, useRef, useEffect, useCallback } from 'react'
import Logo from './Logo'
import { t } from '../constants/i18n'
import { API_BASE_URL } from '../constants/zoneColors'
import styles from './Header.module.css'

export default function Header({ language, onLocationSelect }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus]   = useState(null) // 'searching' | 'empty' | 'error' | null
  const [open, setOpen]       = useState(false)
  const [locating, setLocating] = useState(false)
  const timerRef = useRef(null)
  const containerRef = useRef(null)

  const search = useCallback(async (q) => {
    setStatus('searching')
    setOpen(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)},Kigali,Rwanda&format=json&limit=5&countrycodes=rw&viewbox=29.8,-2.2,30.3,-1.7&bounded=1`
      const res  = await fetch(url, { headers: { 'User-Agent': 'ZoneAgent/1.0' } })
      const data = await res.json()
      if (data.length === 0) { setStatus('empty'); setResults([]); return }
      setResults(data)
      setStatus(null)
    } catch {
      setStatus('error')
      setResults([])
    }
  }, [])

  function handleInput(e) {
    const q = e.target.value
    setQuery(q)
    clearTimeout(timerRef.current)
    if (q.trim().length < 3) { setOpen(false); return }
    timerRef.current = setTimeout(() => search(q.trim()), 500)
  }

  function handleResultClick(r) {
    onLocationSelect(parseFloat(r.lat), parseFloat(r.lon))
    setQuery('')
    setOpen(false)
  }

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const { latitude, longitude } = pos.coords
        onLocationSelect(latitude, longitude, true)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <Logo size={36} />
          <span className={styles.logoText}>ZoneAgent</span>
        </div>
      </div>

      <div className={styles.searchContainer} ref={containerRef}>
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="text"
            value={query}
            onChange={handleInput}
            placeholder={t(language, 'searchPlaceholder')}
          />
          <div className={styles.searchIcon}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
        </div>

        {open && (
          <div className={`${styles.results} ${styles.resultsActive}`}>
            {status === 'searching' && <div className={styles.status}>Searching...</div>}
            {status === 'empty'     && <div className={styles.status}>No results found</div>}
            {status === 'error'     && <div className={styles.status}>Search failed</div>}
            {!status && results.map((r, i) => (
              <div key={i} className={styles.resultItem} onClick={() => handleResultClick(r)}>
                <div className={styles.resultName}>{r.display_name.split(',')[0]}</div>
                <div className={styles.resultAddr}>{r.display_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.right}>
        <button
          className={`${styles.iconBtn} ${locating ? styles.active : ''}`}
          onClick={useMyLocation}
          disabled={locating}
          title="My Location"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
