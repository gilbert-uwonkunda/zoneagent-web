import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { jsPDF } from 'jspdf'
import { t } from '../constants/i18n'
import { ZONE_COLORS, API_BASE_URL } from '../constants/zoneColors'
import { useTypewriter, formatMessage } from '../hooks/useTypewriter'
import { useDraggable } from '../hooks/useDraggable'
import styles from './ChatPanel.module.css'

const SESSION_ID = 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
const isDesktop = () => window.innerWidth >= 768

const ChatPanel = forwardRef(function ChatPanel(
  { language, location, zoning, open, onClose },
  ref
) {
  const panelRef   = useRef(null)
  const headerRef  = useRef(null)
  const messagesRef = useRef(null)
  const inputRef   = useRef(null)

  const [messages, setMessages]         = useState([])
  const [sending, setSending]           = useState(false)
  const [showActions, setShowActions]   = useState(false)
  const [lastResponse, setLastResponse] = useState(null)
  const [inputVal, setInputVal]         = useState('')

  const { type: typewrite, stop: stopTypewriter } = useTypewriter()
  const { onMouseDown } = useDraggable(panelRef, headerRef, isDesktop())

  const scrollBottom = useCallback(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [])

  // Clear messages when new location tapped
  useEffect(() => {
    if (!zoning || !location) return
    stopTypewriter()
    setMessages([])
    setShowActions(false)
    setLastResponse(null)
    // Show welcome system message then typewrite welcome
    const welcomeText = t(language, 'welcome', zoning.zoneName)
    addAnimatedMessage(welcomeText)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoning, location])

  function addAnimatedMessage(text) {
    const id = Date.now()
    setMessages(prev => [...prev, { id, type: 'assistant', text: null, animating: true }])
    // Use a timeout to ensure DOM element is available
    setTimeout(() => {
      const el = document.getElementById(`msg-${id}`)
      if (!el) return
      typewrite(el, text, scrollBottom).then(() => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, text, animating: false } : m))
      })
    }, 30)
  }

  function addMessage(type, text) {
    setMessages(prev => [...prev, { id: Date.now(), type, text, animating: false }])
    setTimeout(scrollBottom, 50)
  }

  async function sendMessage() {
    const question = inputVal.trim()
    if (!question || !zoning || !location || sending) return

    addMessage('user', question)
    setInputVal('')
    setSending(true)

    try {
      const res = await fetch(`${API_BASE_URL}/ai/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          lat: location.latitude,
          lng: location.longitude,
          sessionId: SESSION_ID,
          language,
        }),
      })
      let data
      try { data = await res.json() } catch { throw new Error('Invalid server response') }
      setSending(false)

      if (data.success && data.data) {
        setLastResponse({ response: data.data.response, question })
        addAnimatedMessage(data.data.response)
        setShowActions(true)
      } else {
        addMessage('assistant', t(language, 'error'))
      }
    } catch {
      setSending(false)
      addMessage('assistant', t(language, 'error'))
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function handleInputChange(e) {
    setInputVal(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  async function downloadPDF() {
    if (!zoning || !lastResponse) return
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()
    const m = 20, cw = pw - m * 2

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, pw, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22); doc.setFont('helvetica', 'bold')
    doc.text('ZoneAgent', m, 18)
    doc.setFontSize(11); doc.setFont('helvetica', 'normal')
    doc.text(t(language, 'reportTitle'), m, 28)
    doc.setFillColor(20, 184, 166); doc.rect(0, 40, pw, 3, 'F')

    let y = 55
    doc.setTextColor(15, 23, 42); doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text(t(language, 'locationLabel').toUpperCase(), m, y); y += 8
    doc.setTextColor(51, 65, 85); doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text(`Zone: ${zoning.zoneName}`, m, y); y += 6
    doc.text(`Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`, m, y); y += 6
    doc.text(`${t(language, 'dateLabel')}: ${new Date().toLocaleDateString()}`, m, y); y += 12
    doc.setDrawColor(226, 232, 240); doc.line(m, y, pw - m, y); y += 12

    if (lastResponse.question) {
      doc.setTextColor(15, 23, 42); doc.setFontSize(12); doc.setFont('helvetica', 'bold')
      doc.text(t(language, 'questionLabel').toUpperCase(), m, y); y += 8
      doc.setTextColor(51, 65, 85); doc.setFontSize(10); doc.setFont('helvetica', 'italic')
      const qLines = doc.splitTextToSize(`"${lastResponse.question}"`, cw)
      doc.text(qLines, m, y); y += qLines.length * 5 + 10
      doc.line(m, y, pw - m, y); y += 12
    }

    doc.setTextColor(15, 23, 42); doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text(t(language, 'analysisLabel').toUpperCase(), m, y); y += 10
    doc.setTextColor(51, 65, 85); doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    const clean = lastResponse.response.replace(/[^\x00-\x7F]/g, '').trim()
    doc.splitTextToSize(clean, cw).forEach(line => {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.text(line, m, y); y += 5
    })

    y += 15
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setFillColor(241, 245, 249); doc.roundedRect(m, y, cw, 30, 3, 3, 'F'); y += 10
    doc.setTextColor(15, 23, 42); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text(t(language, 'contactLabel'), m + 5, y); y += 6
    doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 65, 85)
    doc.text('City of Kigali: 3260 | kigalicity.gov.rw', m + 5, y); y += 25
    doc.setTextColor(148, 163, 184); doc.setFontSize(8)
    doc.text(doc.splitTextToSize(t(language, 'disclaimer'), cw), m, y)

    const pages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(148, 163, 184)
      doc.text(`${t(language, 'generatedBy')} | Page ${i}/${pages}`, pw / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
    }
    doc.save(`ZoneAgent_${zoning.zoneName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  function shareReport() {
    if (!zoning || !lastResponse) return
    const text = `ZoneAgent Report\n\nZone: ${zoning.zoneName}\nLocation: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}\n\n${lastResponse.response.substring(0, 400)}...\n\nCity of Kigali: 3260`
    if (navigator.share) {
      navigator.share({ title: 'ZoneAgent Report', text }).catch(() => navigator.clipboard.writeText(text))
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Copied!'))
    }
  }

  const zoneColor = zoning ? (ZONE_COLORS[zoning.zoneName] || '#64748B') : '#64748B'

  return (
    <div ref={panelRef} className={`${styles.panel} ${open ? styles.open : ''}`}>
      {/* Header */}
      <div ref={headerRef} className={styles.header} onMouseDown={onMouseDown}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div className={styles.info}>
          <div className={styles.zoneName}>
            <span className={styles.zoneDot} style={{ background: zoneColor }} />
            <span>{zoning?.zoneName || 'Loading...'}</span>
          </div>
          {location && (
            <div className={styles.coords}>
              {location.latitude.toFixed(6)}°, {location.longitude.toFixed(6)}°
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className={styles.messages}>
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.message} ${styles[msg.type]}`}>
            {msg.animating
              ? <div id={`msg-${msg.id}`} />
              : <div className="message-content" dangerouslySetInnerHTML={{ __html: formatMessage(msg.text || '') }} />
            }
          </div>
        ))}
        {sending && (
          <div className={styles.typingIndicator}>
            <span/><span/><span/>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className={styles.actions}>
          <button className={`${styles.actionBtn} ${styles.primary}`} onClick={downloadPDF}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            <span>{t(language, 'download')}</span>
          </button>
          <button className={styles.actionBtn} onClick={shareReport}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
            </svg>
            <span>{t(language, 'share')}</span>
          </button>
        </div>
      )}

      {/* Input */}
      <div className={styles.inputArea}>
        <textarea
          ref={inputRef}
          className={styles.chatInput}
          value={inputVal}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={t(language, 'askPlaceholder')}
          rows={1}
          disabled={sending}
        />
        <button className={styles.sendBtn} onClick={sendMessage} disabled={sending || !inputVal.trim()}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  )
})

export default ChatPanel
