import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { t } from '../constants/i18n'
import styles from './MapView.module.css'

export default function MapView({ language, onMapClick, showHint, onFabClick, showFab }) {
  const mapRef     = useRef(null)
  const markerRef  = useRef(null)
  const instanceRef = useRef(null)

  // Init map once
  useEffect(() => {
    if (instanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [-1.9441, 30.0619],
      zoom: 13,
      minZoom: 10,
      maxZoom: 20,
      zoomControl: false,
      attributionControl: true,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      attribution: '© Google',
      maxZoom: 20,
    }).addTo(map)

    setTimeout(() => map.invalidateSize(), 100)
    instanceRef.current = map

    return () => {
      map.remove()
      instanceRef.current = null
    }
  }, [])

  // Wire click handler (re-bind when callback changes)
  useEffect(() => {
    const map = instanceRef.current
    if (!map) return
    const handler = (e) => {
      placePin(e.latlng)
      onMapClick(e.latlng.lat, e.latlng.lng)
    }
    map.on('click', handler)
    return () => map.off('click', handler)
  }, [onMapClick])

  function placePin(latlng) {
    const map = instanceRef.current
    if (!map) return
    if (markerRef.current) map.removeLayer(markerRef.current)
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;background:#14B8A6;border:3px solid white;border-radius:50%;box-shadow:0 4px 12px rgba(20,184,166,0.5);display:flex;align-items:center;justify-content:center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
    markerRef.current = L.marker(latlng, { icon }).addTo(map)
  }

  // Expose flyTo for parent-triggered navigation
  useEffect(() => {
    if (!instanceRef.current) return
    MapView._flyTo = (lat, lng, zoom = 16) => {
      instanceRef.current.flyTo([lat, lng], zoom)
      setTimeout(() => placePin(L.latLng(lat, lng)), 900)
    }
    MapView._invalidate = () => instanceRef.current?.invalidateSize(true)
  })

  return (
    <div className={styles.wrap}>
      <div ref={mapRef} className={styles.map} />

      {showHint && (
        <div className={styles.hint}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className={styles.hintIcon}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span>{t(language, 'tapHint')}</span>
        </div>
      )}

      {showFab && (
        <button className={styles.fab} onClick={onFabClick} title="Open Chat">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        </button>
      )}
    </div>
  )
}
