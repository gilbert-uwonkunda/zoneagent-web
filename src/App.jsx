import { useState, useCallback, useRef } from 'react'
import SplashScreen from './components/SplashScreen'
import Header from './components/Header'
import MapView from './components/MapView'
import ChatPanel from './components/ChatPanel'
import { API_BASE_URL } from './constants/zoneColors'
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

    try {
      const res  = await fetch(`${API_BASE_URL}/zoning/location?lat=${lat}&lng=${lng}`)
      const data = await res.json()

      if (data.success && data.data?.zoneData) {
        setZoning({ zoneName: data.data.zoneData.zone_name, properties: data.data.zoneData })
      } else {
        setZoning({ zoneName: 'Unknown Zone' })
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
