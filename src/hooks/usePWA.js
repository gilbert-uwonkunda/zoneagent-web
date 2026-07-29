import { useState, useEffect, useCallback } from 'react'

const DISMISS_KEY = 'za_install_dismissed'

/** True when the app is running as an installed PWA rather than in a browser tab. */
export function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari predates display-mode and exposes its own flag.
    window.navigator.standalone === true
  )
}

/** iOS never fires beforeinstallprompt, so it needs manual instructions instead. */
export function isIOS() {
  const ua = window.navigator.userAgent
  // iPadOS 13+ reports itself as a Mac; touch points disambiguate it.
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (/macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1)
  )
}

/**
 * Tracks connectivity.
 *
 * navigator.onLine only reports whether a network interface exists — it says
 * nothing about whether the internet is actually reachable — so treat `false`
 * as authoritative (definitely offline) and `true` as merely optimistic.
 */
export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine !== false)

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  return online
}

/**
 * Install affordance state.
 *
 * Chromium fires `beforeinstallprompt` when the app is installable; we stash the
 * event and replay it on a user gesture, which is the only time prompt() is
 * allowed. iOS has no such API, so we surface Add-to-Home-Screen instructions.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })

  useEffect(() => {
    const onBeforeInstall = (e) => {
      // Suppress Chrome's own mini-infobar so our in-app UI owns the moment.
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // Declared before promptInstall, which calls it.
  const dismiss = useCallback(() => {
    setDismissed(true)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* private mode */ }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return false
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    // The event is single-use; Chrome re-fires it later if still installable.
    setDeferred(null)
    // Respect a decline — don't re-offer on every visit.
    if (outcome === 'dismissed') dismiss()
    return outcome === 'accepted'
  }, [deferred, dismiss])

  const iosHint = isIOS() && !installed && !dismissed
  const canInstall = Boolean(deferred) && !installed && !dismissed

  return { canInstall, iosHint, installed, promptInstall, dismiss }
}
