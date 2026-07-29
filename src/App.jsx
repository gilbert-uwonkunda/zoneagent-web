import { useState, useCallback, useEffect } from 'react'
import SplashScreen from './components/SplashScreen'
import Header from './components/Header'
import MapView from './components/MapView'
import ChatPanel from './components/ChatPanel'
import { API_BASE_URL } from './constants/zoneColors'
import { queryZoneAtPoint } from './services/arcgisClient'
import { t } from './constants/i18n'
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

  // Warm up the backend as soon as the user enters the app
  // so Claude AI responses don't suffer Render cold-start delay
  useEffect(() => {
    if (!appStarted) return
    fetch(`${API_BASE_URL}/health`).catch(() => {})
  }, [appStarted])

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
