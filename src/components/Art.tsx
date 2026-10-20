// Every picture in the app is drawn here as inline SVG - no image files, so content filters
// have nothing to block and the drawings stay sharp at any size. The motion is plain CSS.
import type { JSX } from 'react'
import type { MeetingType } from '../api/types'

// ---------- Line icons (24x24, drawn with currentColor) ----------

const icons = {
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18',
  chevronDown: 'M6 9l6 6 6-6',
  arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  home: 'M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5',
  users:
    'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.1 2.4 3.5 5.2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-4 3.7-6 7.5-6s6.7 2 7.5 6',
  calendar: 'M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM4 10h16M8.5 3v4M15.5 3v4',
  wallet:
    'M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3M4 7.5v10A2.5 2.5 0 0 0 6.5 20H20v-4M4 7.5A2.5 2.5 0 0 0 6.5 10H20v3M20 13h-3.5a1.5 1.5 0 0 0 0 3H20z',
  coins:
    'M9 10.5c3.3 0 6-1.3 6-3s-2.7-3-6-3-6 1.3-6 3 2.7 3 6 3zM3 7.5v4c0 1.7 2.7 3 6 3M3 11.5v4c0 1.7 2.7 3 6 3M15 13.5c3.3 0 6-1.3 6-3M9 15.5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3',
  box: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9',
  edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4',
  trash:
    'M4 7h16M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  sparkle:
    'M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7zM19 16c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5z',
  transfer: 'M4 8h13M13 4l4 4-4 4M20 16H7M11 12l-4 4 4 4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  phone: 'M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5L16 14l4 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  logout: 'M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 8l-4 4 4 4M6 12h10',
  sort: 'M7 4v16M3.5 16.5L7 20l3.5-3.5M17 20V4M13.5 7.5L17 4l3.5 3.5',
  note: 'M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 20zM14.5 3.5V8h4.5M9 12h6M9 15.5h6',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  wrench: 'M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2zM6 15l-2.5 2.5',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  megaphone: 'M4 10v4a1 1 0 0 0 1 1h3l8 4V5L8 9H5a1 1 0 0 0-1 1zM8 15l1.5 5h2.5l-1.3-4.5M19 9.5a3 3 0 0 1 0 5',
  cake: 'M4 20h16M5 20v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6M5 15.5c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0M12 12V8.5M12 6c.9-1 .9-2 0-3-.9 1-.9 2 0 3z',
  talk: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v5a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3.3A2.5 2.5 0 0 1 4 11.5zM17 8h.5A2.5 2.5 0 0 1 20 10.5v5a2.5 2.5 0 0 1-1 2V20l-3-2.5h-4.5A2.5 2.5 0 0 1 9.5 16',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z',
} as const

export type IconName = keyof typeof icons

export function Icon({
  name,
  size = 18,
  className = '',
  strokeWidth = 1.9,
}: {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={icons[name]} />
    </svg>
  )
}

// ---------- The logo: two flowing lines in a rounded tile ----------

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F472B6" />
          <stop offset="1" stopColor="#BE185D" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#logoBg)" />
      <path className="logo-flow" d="M14 40c8-10 14-10 20-4s12 6 18-6" stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M14 28c8-9 14-9 20-3s12 5 18-5" stroke="#FFFFFF" strokeOpacity=".45" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle className="logo-spark" cx="50" cy="15" r="4" fill="#7DD3FC" />
    </svg>
  )
}

// ---------- Art tiles: a glowing gradient tile with a line icon, in the page accent ----------

export function ArtTile({ icon, size = 64 }: { icon: IconName; size?: number }) {
  return (
    <span className="art-tile" style={{ width: size, height: size, borderRadius: size * 0.32 }}>
      <Icon name={icon} size={Math.round(size * 0.48)} strokeWidth={1.7} />
    </span>
  )
}

// ---------- Meeting type icons: one colourful drawing per type ----------

// A four-pointed sparkle centred on (x, y)
const sparkle = (x: number, y: number, s: number) =>
  `M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`

// Activity: a megaphone with sparkles
function MegaphoneArt() {
  return (
    <>
      <path d="M13 25.5h5v13h-5a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3z" fill="#FFFFFF" opacity=".8" />
      <path d="M18 25.5L37 15v34L18 38.5z" fill="#FFFFFF" />
      <ellipse cx="37.5" cy="32" rx="3.4" ry="17" fill="#BAE6FD" />
      <path d="M19.5 39l3.3 10a2 2 0 0 0 1.9 1.4h2.8a1.2 1.2 0 0 0 1.1-1.6L25 39.6" fill="#FFFFFF" opacity=".8" />
      <path className="sp sp1" d={sparkle(50, 17, 5.5)} fill="#FCD34D" />
      <path className="sp sp2" d={sparkle(54.5, 32, 4)} fill="#FFFFFF" />
      <path className="sp sp3" d={sparkle(49, 46.5, 3.3)} fill="#FCD34D" />
    </>
  )
}

// Birthday: a cake with one candle
function CakeArt() {
  return (
    <>
      <rect x="13" y="33" width="38" height="17" rx="4.5" fill="#FFFFFF" />
      <path d="M13 38c3.2 3 6.3 3 9.5 0s6.3-3 9.5 0 6.3 3 9.5 0 6.3-3 9.5 0v-.5a4.5 4.5 0 0 0-4.5-4.5h-29A4.5 4.5 0 0 0 13 37.5z" fill="#FBCFE8" />
      <rect x="19" y="24.5" width="26" height="8.5" rx="3" fill="#FFFFFF" opacity=".88" />
      <rect x="30.5" y="15" width="3" height="9.5" rx="1.5" fill="#FFFFFF" />
      <path className="flame" d="M32 5.5c3 3.4 3.6 6 2.2 7.6a3 3 0 0 1-4.4 0C28.4 11.5 29 8.9 32 5.5z" fill="#FCD34D" />
    </>
  )
}

// Guides meeting: two speech bubbles
function TalkArt() {
  return (
    <>
      <path d="M26 33h12l7 5.5V33a5 5 0 0 0 5-5v-6a5 5 0 0 0-5-5h-2" fill="#FFFFFF" opacity=".55" />
      <path d="M10 16a5 5 0 0 1 5-5h20a5 5 0 0 1 5 5v11a5 5 0 0 1-5 5H21l-7 6v-6.3A5 5 0 0 1 10 27z" fill="#FFFFFF" />
      <circle className="dot d1" cx="18" cy="21.5" r="2.2" fill="#0284C7" />
      <circle className="dot d2" cx="25" cy="21.5" r="2.2" fill="#0284C7" />
      <circle className="dot d3" cx="32" cy="21.5" r="2.2" fill="#0284C7" />
    </>
  )
}

// Special event: a star with sparkles
function StarArt() {
  return (
    <>
      <path d="M32 10l6.2 13.3 14.5 1.7-10.7 9.9 2.9 14.4L32 42 19.1 49.3 22 34.9 11.3 25l14.5-1.7z" fill="#FFFFFF" />
      <path className="sp sp1" d={sparkle(52, 12, 4)} fill="#FDE68A" />
      <path className="sp sp2" d={sparkle(12, 50, 3.4)} fill="#FFFFFF" />
    </>
  )
}

const typeArt: Record<MeetingType, () => JSX.Element> = {
  Activity: MegaphoneArt,
  Birthday: CakeArt,
  GuidesMeeting: TalkArt,
  SpecialEvent: StarArt,
}

const typeColors: Record<MeetingType, [string, string]> = {
  Activity: ['#F9A8D4', '#DB2777'],
  Birthday: ['#FCA5A5', '#DC2626'],
  GuidesMeeting: ['#7DD3FC', '#0284C7'],
  SpecialEvent: ['#FDA4AF', '#BE123C'],
}

export function TypeIcon({ type, size = 56 }: { type: MeetingType; size?: number }) {
  const Art = typeArt[type]
  const [from, to] = typeColors[type]
  return (
    <svg className={`type-icon type-icon-${type}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`typeBg-${type}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="20" fill={`url(#typeBg-${type})`} />
      <Art />
    </svg>
  )
}

// ---------- Three chairs that rock gently - our sign for a meeting ----------

function ChairShape({ x, color, delay }: { x: number; color: string; delay: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <ellipse cx="16" cy="46" rx="11" ry="2" fill="#0F2A2E" opacity=".1" />
      <g className="chair-body" style={{ animationDelay: `${delay}s` }}>
        <rect x="7" y="6" width="18" height="16" rx="5" fill={color} />
        <rect x="10" y="9" width="12" height="2.4" rx="1.2" fill="#FFFFFF" opacity=".45" />
        <rect x="4" y="22" width="24" height="6" rx="3" fill={color} />
        <path d="M8 28l-2 16M24 28l2 16" stroke="#0F2A2E" strokeOpacity=".55" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </g>
  )
}

export function Chairs({ color, size = 72 }: { color: string; size?: number }) {
  return (
    <svg className="chairs" width={size} height={size * 0.5} viewBox="0 0 96 48" aria-hidden="true">
      <ChairShape x={0} color={color} delay={0} />
      <ChairShape x={32} color={color} delay={0.35} />
      <ChairShape x={64} color={color} delay={0.7} />
    </svg>
  )
}

// ---------- Home page hero: money orbiting a central pot ----------

export function FlowOrbit() {
  return (
    <svg className="flow-orbit" viewBox="0 0 360 360" aria-hidden="true">
      <defs>
        <radialGradient id="orbCore" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#F9A8D4" />
          <stop offset=".55" stopColor="#EC4899" />
          <stop offset="1" stopColor="#BE185D" />
        </radialGradient>
        <linearGradient id="orbRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EC4899" stopOpacity=".6" />
          <stop offset="1" stopColor="#0EA5E9" stopOpacity=".12" />
        </linearGradient>
      </defs>
      <circle cx="180" cy="180" r="160" fill="none" stroke="url(#orbRing)" strokeWidth="1.5" />
      <circle cx="180" cy="180" r="118" fill="none" stroke="url(#orbRing)" strokeWidth="1.5" strokeDasharray="2 9" />
      <circle cx="180" cy="180" r="78" fill="none" stroke="url(#orbRing)" strokeWidth="1.5" />

      <g className="orbit o1">
        <circle cx="180" cy="20" r="14" fill="#7DD3FC" />
        <text x="180" y="25" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0C4A6E">
          ₪
        </text>
      </g>
      <g className="orbit o2">
        <rect x="285" y="167" width="26" height="26" rx="8" fill="#0EA5E9" />
        <path d="M292 180l4 4 8-8" stroke="#FFFFFF" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="orbit o3">
        <circle cx="180" cy="102" r="9" fill="#EF4444" />
      </g>

      <circle cx="180" cy="180" r="48" fill="url(#orbCore)" className="orb-core" />
      <path d="M154 188c8-10 14-10 20-4s12 6 18-6" stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M154 174c8-9 14-9 20-3s12 5 18-5" stroke="#FFFFFF" strokeOpacity=".5" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// ---------- A faint line pattern behind each page title, different per page ----------

export function HeroPattern({ theme }: { theme: string }) {
  let content: JSX.Element
  switch (theme) {
    case 'participants':
      content = (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={60 + i * 48} cy={80 + (i % 2 ? 18 : -18)} r={34} />
          ))}
        </>
      )
      break
    case 'meetings':
      content = (
        <>
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M0 ${40 + i * 26}C60 ${10 + i * 26} 110 ${80 + i * 26} 170 ${50 + i * 26}S260 ${20 + i * 26} 300 ${50 + i * 26}`} />
          ))}
        </>
      )
      break
    case 'equipment':
      content = (
        <>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path key={i} d={`M${i * 46 - 60} 160L${i * 46 + 20} 0`} />
          ))}
        </>
      )
      break
    case 'guides':
      content = (
        <>
          {[30, 60, 90, 120, 150, 180].map((r) => (
            <circle key={r} cx="300" cy="160" r={r} />
          ))}
        </>
      )
      break
    case 'additions':
      content = (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={70 + i * 36} y={126 - i * 20} width="20" height={34 + i * 20} rx="6" />
          ))}
        </>
      )
      break
    case 'branch': {
      const nodes = [
        [60, 50],
        [125, 28],
        [190, 72],
        [252, 38],
        [105, 112],
        [205, 128],
        [282, 100],
      ]
      const links = [
        [0, 1],
        [1, 2],
        [2, 3],
        [0, 4],
        [4, 2],
        [2, 5],
        [5, 6],
        [3, 6],
      ]
      content = (
        <>
          {links.map(([a, b]) => (
            <line key={`${a}-${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />
          ))}
          {nodes.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" className="node" />
          ))}
        </>
      )
      break
    }
    default:
      content = (
        <>
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M0 ${100 + i * 14}C80 ${50 + i * 14} 150 ${140 + i * 14} 300 ${60 + i * 14}`} />
          ))}
        </>
      )
  }
  return (
    <svg className="hero-pattern" viewBox="0 0 300 160" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      {content}
    </svg>
  )
}

// The soft colour drifting slowly behind every page
export function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="aurora-blob b1" />
      <span className="aurora-blob b2" />
      <span className="aurora-blob b3" />
      <span className="aurora-blob b4" />
    </div>
  )
}
