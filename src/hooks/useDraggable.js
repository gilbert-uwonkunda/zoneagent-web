import { useRef, useCallback, useEffect } from 'react'

export function useDraggable(panelRef, handleRef, enabled) {
  const state = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 })

  const onMouseMove = useCallback((e) => {
    if (!state.current.dragging || !panelRef.current) return
    const { startLeft, startTop, startX, startY } = state.current
    const panel = panelRef.current
    const rect = panel.getBoundingClientRect()
    let newLeft = startLeft + (e.clientX - startX)
    let newTop  = startTop  + (e.clientY - startY)
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth  - rect.width))
    newTop  = Math.max(0, Math.min(newTop,  window.innerHeight - rect.height))
    panel.style.left   = newLeft + 'px'
    panel.style.top    = newTop  + 'px'
    panel.style.bottom = 'auto'
    panel.style.right  = 'auto'
  }, [panelRef])

  const onMouseUp = useCallback(() => {
    if (!state.current.dragging) return
    state.current.dragging = false
    panelRef.current?.classList.remove('dragging')
    const rect = panelRef.current?.getBoundingClientRect()
    if (rect) {
      localStorage.setItem('za_panel_pos', JSON.stringify({ left: rect.left, top: rect.top }))
    }
  }, [panelRef])

  const onMouseDown = useCallback((e) => {
    if (!enabled || !panelRef.current) return
    if (e.target.closest('button')) return
    const rect = panelRef.current.getBoundingClientRect()
    state.current = { dragging: true, startX: e.clientX, startY: e.clientY, startLeft: rect.left, startTop: rect.top }
    panelRef.current.classList.add('dragging')
    panelRef.current.style.left   = rect.left + 'px'
    panelRef.current.style.top    = rect.top  + 'px'
    panelRef.current.style.bottom = 'auto'
    panelRef.current.style.right  = 'auto'
    e.preventDefault()
  }, [enabled, panelRef])

  useEffect(() => {
    if (!enabled) return
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
    }
  }, [enabled, onMouseMove, onMouseUp])

  // Restore saved position
  useEffect(() => {
    if (!enabled || !panelRef.current) return
    try {
      const saved = JSON.parse(localStorage.getItem('za_panel_pos'))
      if (saved && saved.left < window.innerWidth - 100 && saved.top < window.innerHeight - 100) {
        panelRef.current.style.left   = saved.left + 'px'
        panelRef.current.style.top    = saved.top  + 'px'
        panelRef.current.style.bottom = 'auto'
        panelRef.current.style.right  = 'auto'
      }
    } catch (_) {}
  }, [enabled, panelRef])

  return { onMouseDown }
}
