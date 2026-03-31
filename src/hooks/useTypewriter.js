import { useRef, useCallback } from 'react'

export function formatMessage(text) {
  let f = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^[━═─-]{3,}$/gm, '<hr class="message-divider">')
    .replace(/^(YES|PERMITTED|ALLOWED)\s*/gm, '<span class="status-badge success">$1</span> ')
    .replace(/^(NO|NOT PERMITTED|PROHIBITED)\s*/gm, '<span class="status-badge error">$1</span> ')
    .replace(/^(CONDITIONAL|REQUIRES APPROVAL)\s*/gm, '<span class="status-badge warning">$1</span> ')
    .replace(/^([A-Z][A-Za-z0-9 ]{2,40}):?\s*$/gm, '<h4>$1</h4>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^[•\-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^\d+[.)]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>')
    .replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')

  if (!f.startsWith('<h4>') && !f.startsWith('<ul>') && !f.startsWith('<hr') && !f.startsWith('<span')) {
    f = '<p>' + f + '</p>'
  }
  return f
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h4>)/g, '$1')
    .replace(/(<\/h4>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1')
}

export function useTypewriter() {
  const timerRef = useRef(null)
  const sessionRef = useRef(0)

  const stop = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    sessionRef.current++
  }, [])

  const type = useCallback((el, text, onScroll, speed = 8) => {
    stop()
    const session = ++sessionRef.current
    el.innerHTML = '<div class="message-content"></div><span class="typing-cursor"></span>'
    const content = el.querySelector('.message-content')
    const cursor = el.querySelector('.typing-cursor')

    return new Promise((resolve) => {
      let i = 0
      const next = () => {
        if (session !== sessionRef.current) { resolve(false); return }
        if (i < text.length) {
          content.innerHTML = formatMessage(text.substring(0, i + 1))
          const c = text[i++]
          let d = speed
          if (c === '\n') d = speed * 3
          else if ('.!?'.includes(c)) d = speed * 4
          else if (c === ',') d = speed * 2
          onScroll?.()
          timerRef.current = setTimeout(next, d)
        } else {
          cursor?.remove()
          content.innerHTML = formatMessage(text)
          timerRef.current = null
          resolve(true)
        }
      }
      next()
    })
  }, [stop])

  return { type, stop }
}
