import { useState, useCallback, useEffect } from 'react'
import SplashScreen from './components/SplashScreen'
import Header from './components/Header'
import MapView from './components/MapView'
import ChatPanel from './components/ChatPanel'
import { API_BASE_URL } from './constants/zoneColors'
import { queryZoneAtPoint } from './services/arcgisClient'
import { t } from './constants/i18n'
import { useOnline } from './hooks/usePWA'
import styles from './App.module.css'

export default function App() {
  const [appStarted, setAppStarted]   = useState(false)
  const [language, setLanguage]       = useState('en')
  const [chatOpen, setChatOpen]       = useState(false)
  const [showFab, setShowFab]         = useState(false)
  const [showHint, setShowHint]       = useState(true)
  const [location, setLocation]       = useState(null)
  const [zoning, setZoning]           = useState(null)
  const [loadingZone, setLoadingZone] = useState(false)
  const online = useOnline()

  // Warm up the backend as soon as the user enters the app so Claude responses
  // don't pay the Render free-tier cold start (~50s after 15 min idle).
  // Pointless while offline, so skip it and retry when connectivity returns.
  useEffect(() => {
    if (!appStarted || !online) return
    fetch(`${API_BASE_URL}/health`).catch(() => {})
  }, [appStarted, online])

  function enterApp() {
    setAppStarted(true)
    setTimeout(() => MapView._invalidate?.(), 200)
  }

  const handleMapClick = useCallback(async (lat, lng) => {
    setShowHint(false)
    setShowFab(false)
    setChatOpen(true)

    setLocation({ latitude: lat, longitude: lng })
    setZoning(null)
    setLoadingZone(true)

    // Kigali City Province exact bounds (N:-1.800758 S:-2.071114 E:30.278203 W:29.989891)
    const inKigali = lat > -2.08 && lat < -1.79 && lng > 29.97 && lng < 30.29

    if (!inKigali) {
      setZoning({ zoneName: t(language, 'outsideKigali').split('\n')[0] })
      setLoadingZone(false)
      return
    }

    try {
      const zoneData = await queryZoneAtPoint(lat, lng)

      if (zoneData) {
        setZoning({ zoneName: zoneData.zone_name, properties: zoneData })
      } else {
        // Inside Kigali but not in the zoning layer — unzoned/unclassified area
        setZoning({ zoneName: 'Unzoned Area', properties: { zone_name: 'Unzoned Area', source: 'no_feature' } })
      }
    } catch {
      setZoning({ zoneName: 'Unknown Zone' })
    } finally {
      setLoadingZone(false)
    }
  }, [language])

  const handleLocationSelect = useCallback((lat, lng, fromGPS = false) => {
    if (fromGPS) {
      const inKigali = lat > -2.2 && lat < -1.7 && lng > 29.8 && lng < 30.3
      if (!inKigali) {
        setChatOpen(true)
        setZoning({ zoneName: 'Outside Kigali' })
        setLocation({ latitude: lat, longitude: lng })
        return
      }
    }
    MapView._flyTo?.(lat, lng, 16)
    setTimeout(() => handleMapClick(lat, lng), 1000)
  }, [handleMapClick])

  function closeChat() {
    setChatOpen(false)
    if (location) setShowFab(true)
    if (!location) setShowHint(true)
  }

  if (!appStarted) {
    return (
      <SplashScreen
        language={language}
        onLanguageChange={setLanguage}
        onEnter={enterApp}
      />
    )
  }

  return (
    <div className={styles.app}>
      {!online && (
        <div className={styles.offlineBanner} role="status" aria-live="polite">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M24 8.98A16.88 16.88 0 0012 4C7.31 4 3.07 5.9 0 8.98L12 21l2.8-2.8v-1.6l-1.4-1.4-1.4 1.4-7.3-7.3a12.9 12.9 0 0116.6 0l-1.6 1.6 1.4 1.4L24 8.98zM19 12l-1.4 1.4L21 16.8 22.4 15.4 19 12zm-2.8 4.2l-1.4 1.4 3.4 3.4 1.4-1.4-3.4-3.4z"/>
          </svg>
          <span>{t(language, 'offlineBanner')}</span>
        </div>
      )}
      <MapView
        language={language}
        onMapClick={handleMapClick}
        showHint={showHint && !chatOpen}
        showFab={showFab && !chatOpen}
        onFabClick={() => setChatOpen(true)}
      />
      <Header
        language={language}
        onLocationSelect={handleLocationSelect}
      />
      <ChatPanel
        language={language}
        location={location}
        zoning={zoning}
        loadingZone={loadingZone}
        open={chatOpen}
        onClose={closeChat}
      />
    </div>
  )
}
