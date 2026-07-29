import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { t } from '../constants/i18n'
import styles from './MapView.module.css'

// Kigali City sector boundaries — filtered to the 3 Kigali districts
const SECTORS_URL =
  'https://services5.arcgis.com/deNm5epdmeZgcm16/arcgis/rest/services/' +
  'Sector_Boundary_2022/FeatureServer/1/query?' +
  'outFields=Sector,District&' +
  "where=District%20IN%20('Nyarugenge'%2C'Gasabo'%2C'Kicukiro')&" +
  'f=geojson'

export default function MapView({ language, onMapClick, showHint, onFabClick, showFab }) {
  const mapRef      = useRef(null)
  const markerRef   = useRef(null)
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

    // Load Kigali City sector boundaries
    fetch(SECTORS_URL)
      .then(r => r.json())
      .then(geojson => {
        // Add custom tooltip style once
        if (!document.getElementById('za-sector-style')) {
          const s = document.createElement('style')
          s.id = 'za-sector-style'
          s.textContent = `.sector-label { background: transparent; border: none; box-shadow: none; color: #fff; font-size: 10px; font-weight: 700; padding: 0; white-space: nowrap; -webkit-text-stroke: 2.5px rgba(0,0,0,0.85); paint-order: stroke fill; text-shadow: none; letter-spacing: 0.3px; }`
          document.head.appendChild(s)
        }

        L.geoJSON(geojson, {
          style: {
            color: '#ffffff',
            weight: 1.2,
            opacity: 0.5,
            fillOpacity: 0,
          },
          onEachFeature: (feature, layer) => {
            const label = feature.properties?.Sector || feature.properties?.sector || ''
            if (label) {
              layer.bindTooltip(label, {
                permanent: true,
                direction: 'center',
                className: 'sector-label',
              })
            }
          },
        }).addTo(map)
      })
      .catch(() => {}) // sector layer is decorative — fail silently

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

    const marker = L.marker(latlng, { icon }).addTo(map)

    marker.on('contextmenu', () => {
      const text = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`
      navigator.clipboard.writeText(text).then(() => {
        marker.bindPopup(
          '<div style="font-size:12px;font-weight:600;white-space:nowrap;padding:2px 4px">Coordinates copied</div>',
          { closeButton: false, autoClose: true, offset: [0, -16] }
        ).openPopup()
        setTimeout(() => marker.closePopup(), 1800)
      })
    })

    markerRef.current = marker
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
