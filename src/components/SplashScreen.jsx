import { useState } from 'react'
import Logo from './Logo'
import { t } from '../constants/i18n'
import styles from './SplashScreen.module.css'

const LANGUAGES = [
  { code: 'en', name: 'English',     flag: <FlagEN /> },
  { code: 'rw', name: 'Kinyarwanda', flag: <FlagRW /> },
  { code: 'fr', name: 'Français',    flag: <FlagFR /> },
]

export default function SplashScreen({ onEnter, language, onLanguageChange }) {
  return (
    <div className={styles.splash}>
      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <Logo size={72} />
          <span className={styles.logoText}>ZoneAgent</span>
        </div>
        <p className={styles.tagline}>Zero Trips. Instant Compliance.</p>

        <div className={styles.langSection}>
          <div className={styles.langLabel}>{t(language, 'chooseLanguage')}</div>
          <div className={styles.langOptions}>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                className={`${styles.langCard} ${language === l.code ? styles.active : ''}`}
                onClick={() => onLanguageChange(l.code)}
              >
                {l.flag}
                <span className={styles.langName}>{l.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.steps}>
          {[1, 2, 3].map(n => (
            <div key={n} className={styles.step}>
              <div className={styles.stepNum}>{n}</div>
              <div>
                <div className={styles.stepTitle}>{t(language, `step${n}Title`)}</div>
                <div className={styles.stepDesc}>{t(language, `step${n}Desc`)}</div>
              </div>
            </div>
          ))}
        </div>

        <button className={styles.enterBtn} onClick={onEnter}>
          <span>{t(language, 'enterApp')}</span>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function FlagEN() {
  return (
    <svg viewBox="0 0 60 30" width="32" height="16" style={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
      <clipPath id="fen"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#00247d"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#fen)" stroke="#cf142b" strokeWidth="4"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#cf142b" strokeWidth="6"/>
    </svg>
  )
}

function FlagRW() {
  return (
    <svg viewBox="0 0 60 40" width="32" height="21" style={{ borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
      <rect width="60" height="20" fill="#00A1DE"/>
      <rect y="20" width="60" height="10" fill="#FAD201"/>
      <rect y="30" width="60" height="10" fill="#20603D"/>
      <g transform="translate(47,10)">
        <circle r="5" fill="#FAD201"/>
        {Array.from({ length: 24 }, (_, i) => (
          <rect key={i} x="-0.5" y="-9" width="1" height="4" fill="#FAD201" transform={`rotate(${i * 15})`}/>
        ))}
      </g>
    </svg>
  )
}

function FlagFR() {
  return (
    <svg viewBox="0 0 30 20" width="32" height="21" style={{ borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
      <rect width="10" height="20" fill="#002395"/>
      <rect x="10" width="10" height="20" fill="#fff"/>
      <rect x="20" width="10" height="20" fill="#ED2939"/>
    </svg>
  )
}
