import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { t } from '../constants/i18n'
import { ZONE_COLORS, API_BASE_URL } from '../constants/zoneColors'
import { getZoneParams, ZONE_TYPE_COLORS } from '../constants/zoneParams'
import { useTypewriter, formatMessage } from '../hooks/useTypewriter'
import { useDraggable } from '../hooks/useDraggable'
import styles from './ChatPanel.module.css'

const SESSION_ID = 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
const isDesktop = () => window.innerWidth >= 768

// Monotonic message ids. Date.now() collides when two messages are added in the
// same millisecond, which breaks React keys and makes getElementById(`msg-${id}`)
// resolve to the wrong element during the typewriter animation.
let msgSeq = 0
const nextMsgId = () => ++msgSeq

const ChatPanel = forwardRef(function ChatPanel(
  { language, location, zoning, loadingZone, open, onClose },
  ref
) {
  const panelRef   = useRef(null)
  const headerRef  = useRef(null)
  const messagesRef = useRef(null)
  const inputRef   = useRef(null)

  const [messages, setMessages]         = useState([])
  const [sending, setSending]           = useState(false)
  const [showActions, setShowActions]   = useState(false)
  const [showChips, setShowChips]       = useState(false)
  const [lastResponse, setLastResponse] = useState(null)
  const [inputVal, setInputVal]         = useState('')

  const { type: typewrite, stop: stopTypewriter } = useTypewriter()
  const { onMouseDown } = useDraggable(panelRef, headerRef, isDesktop())

  const scrollBottom = useCallback(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [])

  // Show welcome only when real zone data arrives (not loading state)
  useEffect(() => {
    if (!zoning || !location || loadingZone) return
    stopTypewriter()
    setMessages([])
    setShowActions(false)
    setShowChips(false)
    setLastResponse(null)
    const welcomeText = t(language, 'welcome', zoning.zoneName)
    addAnimatedMessage(welcomeText)
    setShowChips(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoning, location])

  function addAnimatedMessage(text) {
    const id = nextMsgId()
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
    setMessages(prev => [...prev, { id: nextMsgId(), type, text, animating: false }])
    setTimeout(scrollBottom, 50)
  }

  async function sendMessage(override) {
    // Only a string override (a suggestion chip) replaces the input value —
    // guards against an event object being passed in from an onClick handler.
    const raw = typeof override === 'string' ? override : inputVal
    const question = raw.trim()
    if (!question || !zoning || !location || sending) return

    addMessage('user', question)
    setInputVal('')
    setShowChips(false)
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
      let data = null
      try { data = await res.json() } catch { /* non-JSON body — handled below */ }
      setSending(false)

      if (res.ok && data?.success && data.data) {
        setLastResponse({ response: data.data.response, question })
        addAnimatedMessage(data.data.response)
        setShowActions(true)
      } else {
        // Surface the server's own message (rate limit, validation) when there is
        // one — a bare t('error') hides "please wait before asking again".
        addMessage('assistant', data?.message || data?.error || t(language, 'error'))
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

    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pw   = doc.internal.pageSize.getWidth()   // 210
    const ph   = doc.internal.pageSize.getHeight()  // 297
    const m    = 18
    const cw   = pw - m * 2
    const refNo = `ZA-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const dateStr = new Date().toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' })
    const params   = getZoneParams(zoning.zoneName)
    const zoneType = params?.type || 'Zone'
    const typeColor = ZONE_TYPE_COLORS[zoneType] || ZONE_TYPE_COLORS['Infrastructure']

    // ── Helper: draw page footer ──────────────────────────────────────────────
    function drawFooter(pageNum, total) {
      doc.setPage(pageNum)
      doc.setFillColor(15, 23, 42)
      doc.rect(0, ph - 12, pw, 12, 'F')
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 175)
      doc.text(`${t(language, 'generatedBy')}  |  Ref: ${refNo}  |  Page ${pageNum}/${total}`, pw / 2, ph - 4.5, { align: 'center' })
      doc.setTextColor(20, 184, 166)
      doc.text('zoneagent.live', m, ph - 4.5)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PAGE 1 — SITE INTELLIGENCE
    // ═══════════════════════════════════════════════════════════════════════════

    // --- Header band ---
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, pw, 38, 'F')
    // Teal left accent bar
    doc.setFillColor(20, 184, 166)
    doc.rect(0, 0, 4, 38, 'F')
    // Logo text
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22); doc.setFont('helvetica', 'bold')
    doc.text('ZoneAgent', m + 4, 16)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 175)
    doc.text('Spatial Intelligence Platform — City of Kigali', m + 4, 24)
    // Report label right-aligned
    doc.setTextColor(20, 184, 166); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.text('ZONING COMPLIANCE REPORT', pw - m, 16, { align: 'right' })
    doc.setTextColor(148, 163, 175); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
    doc.text(`Ref: ${refNo}`, pw - m, 22, { align: 'right' })
    doc.text(dateStr, pw - m, 28, { align: 'right' })
    // Bottom teal line
    doc.setFillColor(20, 184, 166); doc.rect(0, 38, pw, 1.5, 'F')

    let y = 50

    // --- Zone identification card ---
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(m, y, cw, 32, 3, 3, 'F')
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3)
    doc.roundedRect(m, y, cw, 32, 3, 3, 'S')

    // Zone type badge
    doc.setFillColor(typeColor.r, typeColor.g, typeColor.b)
    doc.roundedRect(m + 6, y + 6, 28, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'bold')
    doc.text(zoneType.toUpperCase(), m + 20, y + 11.5, { align: 'center' })

    // Zone code (large)
    doc.setTextColor(15, 23, 42); doc.setFontSize(22); doc.setFont('helvetica', 'bold')
    const codeText = zoning.properties?.zone_code || zoning.zoneName.split('-')[0] || zoning.zoneName
    doc.text(codeText, m + 6, y + 28)

    // Zone full name
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
    doc.text(zoning.zoneName, m + 42, y + 14)
    // Subtype
    if (params?.subtype) {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139)
      doc.text(params.subtype, m + 42, y + 21)
    }
    // Area
    if (zoning.properties?.area_ha) {
      doc.setFontSize(8.5); doc.setTextColor(100, 116, 139)
      doc.text(`Site area context: ${Number(zoning.properties.area_ha).toFixed(2)} ha`, m + 42, y + 28)
    }

    y += 40

    // --- Location details ---
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
    doc.text('SITE LOCATION', m, y); y += 5
    doc.setDrawColor(20, 184, 166); doc.setLineWidth(0.5); doc.line(m, y, m + 40, y); y += 5

    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 65, 85)
    doc.text(`Coordinates:   ${location.latitude.toFixed(6)}°N,  ${location.longitude.toFixed(6)}°E`, m, y); y += 5.5
    if (zoning.properties?.level_1) {
      doc.text(`Classification:  ${zoning.properties.level_1}${zoning.properties.level_2 ? ' › ' + zoning.properties.level_2 : ''}`, m, y); y += 5.5
    }
    doc.text(`Report date:   ${dateStr}`, m, y); y += 10

    // --- Development parameters table ---
    if (params) {
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
      doc.text('DEVELOPMENT PARAMETERS', m, y); y += 5
      doc.setDrawColor(20, 184, 166); doc.setLineWidth(0.5); doc.line(m, y, m + 65, y); y += 3

      autoTable(doc, {
        startY: y,
        margin: { left: m, right: m },
        head: [['Parameter', 'Standard', 'Parameter', 'Standard']],
        body: [
          ['Max. FAR',          params.far,      'Max. Coverage',   params.coverage],
          ['Max. Floors',       params.floors,   'Min. Plot Size',  params.minPlot],
          ['Min. Landscaping',  params.landscape,'Density',         params.density],
        ],
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [20, 184, 166],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left',
        },
        bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 38 },
          1: { cellWidth: 38 },
          2: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 38 },
          3: { cellWidth: 38 },
        },
        theme: 'striped',
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.2,
      })

      y = doc.lastAutoTable.finalY + 10
    }

    // --- Permitted / conditional uses summary ---
    const usesData = {
      R1:  { permitted: ['Single family houses', 'Home Occupation'], conditional: ['Apartments (G+2+)', 'Restaurants/Hotels', 'Commercial (O-C2 overlay)'], prohibited: ['Industrial uses', 'Major infrastructure'] },
      R1A: { permitted: ['Single & multi-family houses', 'Townhouses/Row houses', 'Home Occupation'], conditional: ['Restaurants/Hotels', 'Commercial (O-C2)'], prohibited: ['Residential >G+2', 'Industrial'] },
      R1B: { permitted: ['Single family houses', 'Row housing', 'Multifamily residential'], conditional: ['Restaurants', 'Commercial (O-C2)', 'Micro Enterprise'], prohibited: ['Industrial', 'Major infrastructure'] },
      R2:  { permitted: ['Single family', 'Rowhouses', 'Apartments', 'Home Occupation'], conditional: ['Restaurants', 'Hotels', 'Commercial (O-C2)', 'Micro Enterprise'], prohibited: ['Industrial', 'Major infrastructure'] },
      R3:  { permitted: ['Single family', 'Row housing', 'Low-rise apartments'], conditional: ['Restaurants', 'Hotels', 'Commercial (O-C2)', 'Micro Enterprise'], prohibited: ['Industrial', 'Major infrastructure'] },
      R4:  { permitted: ['High-rise apartments', 'Mixed residential'], conditional: ['Hotels', 'Offices', 'Commercial'], prohibited: ['Heavy industrial', 'Major infrastructure'] },
      C1:  { permitted: ['Commercial/Retail', 'Restaurants', 'Offices (1F+)', 'Residential'], conditional: ['Hotels', 'Petrol stations', 'Car repair'], prohibited: ['Large commercial complex', 'Industrial'] },
      C3:  { permitted: ['Commercial/Retail', 'Offices', 'Hotels'], conditional: ['Residential', 'Petrol stations', 'Car dealerships'], prohibited: ['Heavy industrial', 'Major residential (standalone)'] },
      I1:  { permitted: ['Light manufacturing', 'Warehousing', 'Workshop'], conditional: ['Office', 'Worker accommodation', 'Ancillary retail'], prohibited: ['Residential', 'Heavy/polluting industry'] },
      I2:  { permitted: ['General manufacturing', 'Heavy warehousing'], conditional: ['Office', 'Worker accommodation'], prohibited: ['Residential', 'Commercial retail'] },
    }
    const zCode = zoning.properties?.zone_code || zoning.zoneName.split('-')[0]
    const uses  = usesData[zCode]

    if (uses && y < ph - 60) {
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
      doc.text('LAND USE SUMMARY', m, y); y += 5
      doc.setDrawColor(20, 184, 166); doc.setLineWidth(0.5); doc.line(m, y, m + 50, y); y += 3

      autoTable(doc, {
        startY: y,
        margin: { left: m, right: m },
        head: [['Permitted Uses', 'Conditional Uses', 'Prohibited Uses']],
        body: [[
          uses.permitted.join('\n'),
          uses.conditional.join('\n'),
          uses.prohibited.join('\n'),
        ]],
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85], valign: 'top' },
        columnStyles: {
          0: { textColor: [5, 150, 105] },   // green for permitted
          1: { textColor: [217, 119, 6] },   // amber for conditional
          2: { textColor: [220, 38, 38] },   // red for prohibited
        },
        theme: 'grid',
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.2,
      })
      y = doc.lastAutoTable.finalY + 8
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PAGE 2 — AI ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════
    doc.addPage()

    // Header bar (compact)
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, pw, 22, 'F')
    doc.setFillColor(20, 184, 166); doc.rect(0, 0, 4, 22, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text('ZoneAgent', m + 4, 10)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 175)
    doc.text('AI Zoning Analysis', m + 4, 17)
    doc.setTextColor(20, 184, 166); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.text(zoning.zoneName, pw - m, 10, { align: 'right' })
    doc.setTextColor(148, 163, 175); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
    doc.text(dateStr, pw - m, 17, { align: 'right' })
    doc.setFillColor(20, 184, 166); doc.rect(0, 22, pw, 1, 'F')

    y = 32

    // Question
    if (lastResponse.question) {
      doc.setFillColor(241, 245, 249)
      const qLines = doc.splitTextToSize(`"${lastResponse.question}"`, cw - 12)
      const qH = qLines.length * 5 + 12
      doc.roundedRect(m, y, cw, qH, 2, 2, 'F')
      doc.setTextColor(20, 184, 166); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
      doc.text('QUESTION', m + 6, y + 6)
      doc.setTextColor(51, 65, 85); doc.setFontSize(9); doc.setFont('helvetica', 'italic')
      doc.text(qLines, m + 6, y + 12)
      y += qH + 8
    }

    // Analysis
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
    doc.text('AI ANALYSIS', m, y); y += 5
    doc.setDrawColor(20, 184, 166); doc.setLineWidth(0.5); doc.line(m, y, m + 35, y); y += 6

    const clean = lastResponse.response
      .replace(/\*\*/g, '')
      .replace(/^#+\s*/gm, '')
      .replace(/^[•\-]\s*/gm, '• ')
      .replace(/[^\x00-\x7F]/g, '')
      .trim()

    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 65, 85)
    const analysisLines = doc.splitTextToSize(clean, cw)
    analysisLines.forEach(line => {
      if (y > ph - 50) {
        doc.addPage()
        doc.setFillColor(15, 23, 42); doc.rect(0, 0, pw, 14, 'F')
        doc.setFillColor(20, 184, 166); doc.rect(0, 0, 4, 14, 'F')
        doc.setTextColor(148, 163, 175); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
        doc.text('ZoneAgent — continued', m + 4, 9)
        y = 22
      }
      doc.text(line, m, y)
      y += line.trim() === '' ? 3 : 5
    })

    // --- Next Steps / Permit checklist ---
    y += 6
    if (y > ph - 65) { doc.addPage(); y = 22 }

    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
    doc.text('RECOMMENDED NEXT STEPS', m, y); y += 5
    doc.setDrawColor(20, 184, 166); doc.setLineWidth(0.5); doc.line(m, y, m + 65, y); y += 6

    const steps = [
      'Submit a development concept to the City of Kigali One Stop Centre (OSC)',
      'Apply for a construction permit via Kubaka (kubaka.gov.rw)',
      'Commission a licensed surveyor to produce a site plan',
      'Ensure design complies with setback, FAR, and landscaping requirements',
      'Consult the relevant district office for any site-specific overlay conditions',
    ]
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 65, 85)
    steps.forEach(step => {
      doc.setDrawColor(20, 184, 166); doc.setFillColor(255, 255, 255); doc.setLineWidth(0.4)
      doc.rect(m, y - 3.5, 4, 4, 'S')
      doc.text(step, m + 7, y); y += 7
    })

    y += 4

    // --- Official contacts card ---
    if (y > ph - 50) { doc.addPage(); y = 22 }
    doc.setFillColor(15, 23, 42)
    doc.roundedRect(m, y, cw, 36, 3, 3, 'F')
    doc.setFillColor(20, 184, 166); doc.roundedRect(m, y, 3, 36, 2, 2, 'F')

    doc.setTextColor(20, 184, 166); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.text('OFFICIAL CONTACTS', m + 8, y + 8)
    doc.setTextColor(255, 255, 255); doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
    doc.text('City of Kigali One Stop Centre (OSC)', m + 8, y + 15)
    doc.setTextColor(148, 163, 175); doc.setFontSize(8)
    doc.text('Phone: +250 789 448 873  |  Email: onestopcenter@kigalicity.gov.rw', m + 8, y + 21)
    doc.text('Apply for permits: kubaka.gov.rw  |  Website: kigalicity.gov.rw', m + 8, y + 27)
    doc.setTextColor(100, 116, 139); doc.setFontSize(7)
    doc.text('AI Platform: zoneagent.live', m + 8, y + 33)
    y += 44

    // --- Disclaimer ---
    doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(148, 163, 175)
    const disc = t(language, 'disclaimer')
    doc.splitTextToSize(disc, cw).forEach(line => { doc.text(line, m, y); y += 4.5 })

    // ── Footers on all pages ──────────────────────────────────────────────────
    const total = doc.internal.getNumberOfPages()
    for (let i = 1; i <= total; i++) drawFooter(i, total)

    const slug = zoning.zoneName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
    doc.save(`ZoneAgent_${slug}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  function shareReport() {
    if (!zoning || !lastResponse) return
    const text = `ZoneAgent Report\n\nZone: ${zoning.zoneName}\nLocation: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}\n\n${lastResponse.response.substring(0, 400)}...\n\nCity of Kigali OSC: +250 789 448 873 | kubaka.gov.rw`
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
            {loadingZone
              ? <span className={styles.loadingDot} />
              : <span className={styles.zoneDot} style={{ background: zoneColor }} />
            }
            <span>{loadingZone ? t(language, 'loading') : (zoning?.zoneName || '—')}</span>
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
          <div className={styles.thinkingBubble}>
            <div className={styles.thinkingIcon}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <div className={styles.thinkingText}>
              <span className={styles.thinkingLabel}>Analyzing your plot against 2020 Master Plan...</span>
              <div className={styles.thinkingDots}>
                <span/><span/><span/>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested question chips */}
      {showChips && !sending && (
        <div className={styles.chips}>
          {t(language, 'chips').map((chip, i) => (
            <button
              key={i}
              className={styles.chip}
              onClick={() => sendMessage(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

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
        <button className={styles.sendBtn} onClick={() => sendMessage()} disabled={sending || !inputVal.trim()}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  )
})

export default ChatPanel
