/**
 * SVG connection lines for the progress tree.
 * Draws the paths between nodes with anchor dots.
 */
export default function TreeConnections() {
  return (
    <svg
      className="tree-connections"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <defs>
        <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#81C784" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6f7a6b" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Root to branches (dashed = not yet connected) */}
      <path
        d="M 600 170 L 600 210 L 200 210 L 200 250"
        fill="none"
        stroke="#6f7a6b"
        strokeWidth="3"
        strokeDasharray="8,8"
      />
      <path
        d="M 600 170 L 600 250"
        fill="none"
        stroke="#6f7a6b"
        strokeWidth="3"
        strokeDasharray="8,8"
      />
      <path
        d="M 600 170 L 600 210 L 1000 210 L 1000 250"
        fill="none"
        stroke="#6f7a6b"
        strokeWidth="3"
        strokeDasharray="8,8"
      />

      {/* Logic Path (solid = unlocked connections) */}
      <path d="M 200 370 L 200 450" fill="none" stroke="#6f7a6b" strokeWidth="3" />
      <path d="M 200 570 L 200 650" fill="none" stroke="#6f7a6b" strokeWidth="3" />
      <path d="M 200 770 L 200 850" fill="none" stroke="#6f7a6b" strokeWidth="3" />

      {/* Efficiency Path */}
      <path d="M 600 370 L 600 450" fill="none" stroke="#6f7a6b" strokeWidth="3" />
      <path d="M 600 570 L 600 650" fill="none" stroke="#6f7a6b" strokeWidth="3" />

      {/* Expansion Path */}
      <path d="M 1000 370 L 1000 450" fill="none" stroke="#6f7a6b" strokeWidth="3" />
      <path d="M 1000 570 L 1000 650" fill="none" stroke="#6f7a6b" strokeWidth="3" />

      {/* Anchor dots */}
      {[
        [600, 170, 6],
        [200, 250, 4], [600, 250, 4], [1000, 250, 4],
        [200, 450, 4], [200, 650, 4],
        [600, 450, 4], [600, 650, 4],
        [1000, 450, 4], [1000, 650, 4],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#3C2A21" />
      ))}
    </svg>
  )
}
