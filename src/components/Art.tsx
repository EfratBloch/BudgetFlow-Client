// Every picture in the app is drawn here as inline SVG - no image files, so content filters
// have nothing to block and the drawings stay sharp at any size. The motion is plain CSS.

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="logoCoin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2CC9C1" />
          <stop offset="1" stopColor="#0B7F86" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="29" r="23" fill="url(#logoCoin)" />
      <circle cx="32" cy="29" r="18" fill="none" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth="2" />
      <g className="logo-leaf">
        <path d="M32 43V26" stroke="#FFF6E5" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 29c0-7 5-11 12-11 0 7-5 11-12 11z" fill="#FFF6E5" />
        <path d="M32 33c-6 0-10-3-10-9 6 0 10 3 10 9z" fill="#E9FBF8" />
      </g>
      <path className="logo-wave" d="M6 57c9-6 17-6 26 0s17 6 26 0" stroke="#F6C445" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// A chair - our symbol for a meeting. It rocks gently; faster when its card is hovered.
export function Chair({ size = 64, color = '#0E9F9A' }: { size?: number; color?: string }) {
  return (
    <svg className="chair" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <ellipse cx="32" cy="58" rx="18" ry="3" fill="#0B4F5C" opacity=".12" className="chair-shadow" />
      <g className="chair-body">
        <rect x="18" y="8" width="28" height="22" rx="7" fill={color} />
        <rect x="22" y="12" width="20" height="3" rx="1.5" fill="#FFFFFF" opacity=".45" />
        <rect x="14" y="30" width="36" height="8" rx="4" fill={color} />
        <rect x="14" y="30" width="36" height="3" rx="1.5" fill="#FFFFFF" opacity=".3" />
        <path d="M19 38l-3 18M45 38l3 18" stroke="#0B4F5C" strokeWidth="4" strokeLinecap="round" />
        <path d="M24 38v12M40 38v12" stroke="#0B4F5C" strokeWidth="3" strokeLinecap="round" opacity=".6" />
      </g>
    </svg>
  )
}

// A circle of chairs around a table - the hero drawing on the home page
export function MeetingCircle() {
  const seats = [0, 60, 120, 180, 240, 300]
  const colors = ['#0E9F9A', '#14B8C4', '#2BA88A', '#F6C445', '#3A86C8', '#4FB3A9']
  return (
    <svg className="meeting-circle" viewBox="0 0 320 320" aria-hidden="true">
      <circle cx="160" cy="160" r="150" fill="#E6F7F5" />
      <circle cx="160" cy="160" r="118" fill="none" stroke="#0E9F9A" strokeOpacity=".15" strokeWidth="2" strokeDasharray="6 10" className="spin-slow" />
      <g className="table-bob">
        <circle cx="160" cy="160" r="46" fill="#FFFFFF" stroke="#0E9F9A" strokeWidth="4" />
        <text x="160" y="152" textAnchor="middle" fontSize="22">🎯</text>
        <text x="160" y="182" textAnchor="middle" fontSize="13" fill="#0B4F5C" fontWeight="700">מפגש</text>
      </g>
      {seats.map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x = 160 + Math.cos(rad) * 98
        const y = 160 + Math.sin(rad) * 98
        return (
          <g key={angle} transform={`translate(${x - 22} ${y - 22})`}>
            <g className="seat" style={{ animationDelay: `${i * 0.25}s` }}>
              <rect x="10" y="2" width="24" height="18" rx="6" fill={colors[i]} />
              <rect x="6" y="20" width="32" height="8" rx="4" fill={colors[i]} />
              <path d="M11 28l-2 14M33 28l2 14" stroke="#0B4F5C" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </g>
        )
      })}
      <g className="float-a">
        <circle cx="52" cy="58" r="10" fill="#F6C445" />
        <text x="52" y="63" textAnchor="middle" fontSize="12" fontWeight="800" fill="#7A5600">₪</text>
      </g>
      <g className="float-b">
        <circle cx="272" cy="250" r="12" fill="#F6C445" />
        <text x="272" y="255" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7A5600">₪</text>
      </g>
    </svg>
  )
}

// A projector for the equipment store
export function Projector({ size = 56 }: { size?: number }) {
  return (
    <svg className="projector" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path className="beam" d="M44 26 L62 14 L62 42 L44 32 Z" fill="#F6C445" opacity=".45" />
      <rect x="6" y="22" width="40" height="22" rx="6" fill="#0B4F5C" />
      <circle cx="38" cy="33" r="7" fill="#14B8C4" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="16" cy="30" r="2.5" fill="#2CC9C1" />
      <path d="M14 44l-3 8M38 44l3 8" stroke="#0B4F5C" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

// A wallet with coins popping out, for the budget screens
export function Wallet({ size = 56 }: { size?: number }) {
  return (
    <svg className="wallet" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle className="coin-pop" cx="24" cy="14" r="7" fill="#F6C445" />
      <circle className="coin-pop delay" cx="38" cy="10" r="6" fill="#F8D36E" />
      <rect x="8" y="20" width="48" height="34" rx="8" fill="#0E9F9A" />
      <rect x="36" y="31" width="20" height="12" rx="4" fill="#0B7F86" />
      <circle cx="44" cy="37" r="2.5" fill="#F6C445" />
    </svg>
  )
}

// People for the participants screen
export function Group({ size = 56 }: { size?: number }) {
  return (
    <svg className="group-art" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g className="person p1">
        <circle cx="18" cy="24" r="7" fill="#2BA88A" />
        <path d="M6 50c0-9 5-15 12-15s12 6 12 15z" fill="#2BA88A" />
      </g>
      <g className="person p2">
        <circle cx="46" cy="24" r="7" fill="#3A86C8" />
        <path d="M34 50c0-9 5-15 12-15s12 6 12 15z" fill="#3A86C8" />
      </g>
      <g className="person p3">
        <circle cx="32" cy="18" r="8" fill="#0E9F9A" />
        <path d="M18 52c0-11 6-17 14-17s14 6 14 17z" fill="#0E9F9A" />
      </g>
    </svg>
  )
}
