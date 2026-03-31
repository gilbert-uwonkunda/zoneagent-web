export default function Logo({ size = 36 }) {
  const id = `tg_${size}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" stroke={`url(#${id})`} strokeWidth="2" strokeDasharray="4 2" opacity="0.4"/>
      <path d="M14 14H34L20 24L34 34H14" stroke={`url(#${id})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="24" cy="24" r="3" fill={`url(#${id})`}/>
      <circle cx="24" cy="24" r="6" stroke={`url(#${id})`} strokeWidth="1.5" opacity="0.6"/>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#14B8A6"/>
          <stop offset="100%" stopColor="#5EEAD4"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
