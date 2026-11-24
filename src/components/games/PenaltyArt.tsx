import { motion } from 'motion/react'
import { BALL0, COL_CENTERS, GOAL, PITCH, type Shot } from '../../game/penalty'

/*
 * Đồ hoạ sân Penalty, hệ toạ độ viewBox 400 x 320 (khớp src/game/penalty.ts).
 * Thứ tự vẽ: Defs -> Stadium -> Pitch -> GoalBack -> KeeperShadow -> Keeper -> GoalFront -> bóng -> Vignette
 */

const { w: W, h: H } = PITCH
const GROUND = GOAL.bottom

/** Khung sau của lưới (chiều sâu khung thành) */
const BACK = { x1: GOAL.x1 + 13, x2: GOAL.x2 - 13, top: GOAL.top + 11, bottom: GOAL.bottom - 9 }

/* ---------- đám đông: chấm màu cố định (sinh 1 lần) ---------- */
const CROWD_COLORS = ['#c0392b', '#f5f5f5', '#2c3e50', '#e1b12c', '#7f8c8d', '#2d6cdf', '#b33771', '#f1c27d', '#6d4c41']
const CROWD = (() => {
  const dots: { x: number; y: number; r: number; c: string }[] = []
  let seed = 7
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let row = 0; row < 11; row++) {
    const y = 10 + row * 9.5
    for (let x = -4; x < W + 8; x += 6.2) {
      dots.push({ x: x + rnd() * 4 + (row % 2) * 3, y: y + rnd() * 3, r: 2.1 + rnd() * 0.9, c: CROWD_COLORS[Math.floor(rnd() * CROWD_COLORS.length)] })
    }
  }
  return dots
})()

/* ---------- sọc cỏ phối cảnh: xa hẹp, gần rộng ---------- */
const STRIPES = (() => {
  const edges: number[] = [GROUND]
  let y = GROUND
  let hgt = 11
  while (y < H) {
    y += hgt
    edges.push(Math.min(y, H))
    hgt *= 1.22
  }
  return edges
})()

export function PitchDefs() {
  return (
    <defs>
      <linearGradient id="pk-stand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0f1722" />
        <stop offset="1" stopColor="#273445" />
      </linearGradient>
      <linearGradient id="pk-led" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0b1a2e" />
        <stop offset="1" stopColor="#13294a" />
      </linearGradient>
      <linearGradient id="pk-grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2b7a43" />
        <stop offset="1" stopColor="#3f9e5a" />
      </linearGradient>
      <linearGradient id="pk-post" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#c9ced6" />
        <stop offset="0.45" stopColor="#ffffff" />
        <stop offset="1" stopColor="#aab1bb" />
      </linearGradient>
      <linearGradient id="pk-bar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#b8bec7" />
      </linearGradient>
      <pattern id="pk-net" width="7" height="7" patternUnits="userSpaceOnUse">
        <path d="M0 3.5 L3.5 0 L7 3.5 L3.5 7 Z" fill="none" stroke="#ffffff" strokeOpacity={0.5} strokeWidth={0.55} />
      </pattern>
      <linearGradient id="pk-jersey" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f7c948" />
        <stop offset="0.55" stopColor="#f0b323" />
        <stop offset="1" stopColor="#c98a0b" />
      </linearGradient>
      <radialGradient id="pk-ball" cx="38%" cy="32%" r="70%">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.6" stopColor="#eceff2" />
        <stop offset="1" stopColor="#a9b0b9" />
      </radialGradient>
      <radialGradient id="pk-vignette" cx="50%" cy="55%" r="75%">
        <stop offset="0.6" stopColor="#000000" stopOpacity={0} />
        <stop offset="1" stopColor="#000000" stopOpacity={0.35} />
      </radialGradient>
      <radialGradient id="pk-light" cx="50%" cy="0%" r="80%">
        <stop offset="0" stopColor="#ffffff" stopOpacity={0.18} />
        <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
      </radialGradient>
      <filter id="pk-soft" x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation="0.7" />
      </filter>
    </defs>
  )
}

/** Khán đài + bảng LED */
export function Stadium() {
  return (
    <g>
      <rect width={W} height={GROUND} fill="url(#pk-stand)" />
      <g filter="url(#pk-soft)" opacity={0.6}>
        {CROWD.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} />
        ))}
      </g>
      {/* đèn sân chiếu xuống */}
      <rect width={W} height={GROUND} fill="url(#pk-light)" />
      {/* bảng LED */}
      <rect y={GROUND - 24} width={W} height={20} fill="url(#pk-led)" />
      <rect y={GROUND - 24} width={W} height={1.2} fill="#c8a24c" fillOpacity={0.8} />
      {[0, 1, 2, 3].map((i) => (
        <text
          key={i}
          x={50 + i * 100}
          y={GROUND - 10}
          textAnchor="middle"
          fontSize={8}
          fontWeight={700}
          letterSpacing={2}
          fill="#c8a24c"
          fillOpacity={0.9}
        >
          GAME VUI VẺ
        </text>
      ))}
      <rect y={GROUND - 4} width={W} height={4} fill="#1d4d2e" />
    </g>
  )
}

/** Mặt cỏ + vạch vôi phối cảnh */
export function Pitch() {
  return (
    <g>
      <rect y={GROUND} width={W} height={H - GROUND} fill="url(#pk-grass)" />
      {STRIPES.slice(0, -1).map((y, i) =>
        i % 2 ? <rect key={i} y={y} width={W} height={STRIPES[i + 1] - y} fill="#000000" fillOpacity={0.07} /> : null,
      )}
      <g stroke="#ffffff" strokeOpacity={0.85} strokeWidth={1.6} fill="none" strokeLinejoin="round">
        <line x1={0} y1={GROUND} x2={W} y2={GROUND} />
        {/* vòng 5m50 */}
        <path d={`M140 ${GROUND} L128 ${GROUND + 22} L272 ${GROUND + 22} L260 ${GROUND}`} />
        {/* vòng cấm */}
        <path d={`M52 ${GROUND} L18 ${GROUND + 82} L382 ${GROUND + 82} L348 ${GROUND}`} />
        {/* vòng cung */}
        <path d={`M158 ${GROUND + 82} Q200 ${GROUND + 104} 242 ${GROUND + 82}`} />
      </g>
      <ellipse cx={BALL0.x} cy={BALL0.y + 9} rx={3.2} ry={1.4} fill="#ffffff" />
      {/* bóng đổ của khung thành */}
      <path d={`M${GOAL.x1} ${GROUND} L${GOAL.x2} ${GROUND} L${GOAL.x2 + 22} ${GROUND + 9} L${GOAL.x1 + 22} ${GROUND + 9} Z`} fill="#000000" fillOpacity={0.12} />
    </g>
  )
}

/** Lưới phía sau thủ môn (lưới sau, lưới hông, lưới nóc) */
export function GoalBack({ ripple }: { ripple: boolean }) {
  return (
    <motion.g
      animate={ripple ? { scaleY: [1, 1.025, 0.99, 1], scaleX: [1, 1.012, 1] } : {}}
      transition={{ duration: 0.5 }}
      style={{ transformOrigin: '200px 90px' }}
    >
      {/* nền lưới hơi tối để bóng/thủ môn nổi */}
      <rect x={BACK.x1} y={BACK.top} width={BACK.x2 - BACK.x1} height={BACK.bottom - BACK.top} fill="#0f1722" fillOpacity={0.35} />
      <rect x={BACK.x1} y={BACK.top} width={BACK.x2 - BACK.x1} height={BACK.bottom - BACK.top} fill="url(#pk-net)" />
      {/* hông trái, hông phải, nóc */}
      <path d={`M${GOAL.x1} ${GOAL.top} L${BACK.x1} ${BACK.top} L${BACK.x1} ${BACK.bottom} L${GOAL.x1} ${GROUND} Z`} fill="url(#pk-net)" />
      <path d={`M${GOAL.x2} ${GOAL.top} L${BACK.x2} ${BACK.top} L${BACK.x2} ${BACK.bottom} L${GOAL.x2} ${GROUND} Z`} fill="url(#pk-net)" />
      <path d={`M${GOAL.x1} ${GOAL.top} L${GOAL.x2} ${GOAL.top} L${BACK.x2} ${BACK.top} L${BACK.x1} ${BACK.top} Z`} fill="url(#pk-net)" />
      {/* khung sau mảnh */}
      <g stroke="#e5e7eb" strokeOpacity={0.7} strokeWidth={1}>
        <line x1={BACK.x1} y1={BACK.top} x2={BACK.x2} y2={BACK.top} />
        <line x1={BACK.x1} y1={BACK.top} x2={BACK.x1} y2={BACK.bottom} />
        <line x1={BACK.x2} y1={BACK.top} x2={BACK.x2} y2={BACK.bottom} />
        <line x1={BACK.x1} y1={BACK.bottom} x2={GOAL.x1} y2={GROUND} />
        <line x1={BACK.x2} y1={BACK.bottom} x2={GOAL.x2} y2={GROUND} />
        <line x1={BACK.x1} y1={BACK.bottom} x2={BACK.x2} y2={BACK.bottom} />
      </g>
    </motion.g>
  )
}

/** Cột dọc + xà ngang (vẽ sau thủ môn) */
export function GoalFront() {
  return (
    <g>
      <rect x={GOAL.x1 - 5} y={GOAL.top - 5} width={5} height={GROUND - GOAL.top + 5} fill="url(#pk-post)" />
      <rect x={GOAL.x2} y={GOAL.top - 5} width={5} height={GROUND - GOAL.top + 5} fill="url(#pk-post)" />
      <rect x={GOAL.x1 - 5} y={GOAL.top - 5} width={GOAL.x2 - GOAL.x1 + 10} height={5} fill="url(#pk-bar)" />
    </g>
  )
}

/** Tư thế bay người của thủ môn */
function keeperPose(shot: Shot | null) {
  if (!shot) return { x: 0, y: 0, rotate: 0 }
  const kc = shot.keeperCol
  return { x: COL_CENTERS[kc] - BALL0.x, y: shot.keeperHigh ? -24 : kc === 1 ? -4 : 12, rotate: kc === 0 ? -74 : kc === 2 ? 74 : 0 }
}
const keeperTransition = (shot: Shot | null) => (shot ? { duration: 0.42, delay: 0.1, ease: 'easeOut' as const } : { duration: 0.3 })

/** Bóng đổ thủ môn: ở yên dưới đất, chỉ trượt ngang */
export function KeeperShadow({ shot }: { shot: Shot | null }) {
  const p = keeperPose(shot)
  return (
    <motion.ellipse
      cx={BALL0.x}
      cy={GROUND - 1}
      rx={20}
      ry={3.5}
      fill="#000000"
      fillOpacity={0.25}
      initial={false}
      animate={{ x: p.x, scaleX: shot && shot.keeperCol !== 1 ? 1.8 : 1 }}
      transition={keeperTransition(shot)}
    />
  )
}

/** Thủ môn: gốc toạ độ ở giữa 2 bàn chân */
export function Keeper({ shot }: { shot: Shot | null }) {
  return (
    <g transform={`translate(${BALL0.x} ${GROUND - 2})`}>
      <motion.g initial={false} animate={keeperPose(shot)} transition={keeperTransition(shot)} style={{ transformOrigin: '0px -45px' }}>
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* chân: đùi (quần) + ống quyển (tất) */}
          <path d="M-6 -40 L-12 -23" stroke="#151b26" strokeWidth={9} />
          <path d="M6 -40 L12 -23" stroke="#151b26" strokeWidth={9} />
          <path d="M-12 -23 L-14 -5" stroke="#e8a913" strokeWidth={7} />
          <path d="M12 -23 L14 -5" stroke="#e8a913" strokeWidth={7} />
          {/* tay: vai -> khuỷu -> cổ tay, giơ chếch lên */}
          <path d="M-13 -72 L-27 -73 L-37 -83" stroke="url(#pk-jersey)" strokeWidth={7} />
          <path d="M13 -72 L27 -73 L37 -83" stroke="url(#pk-jersey)" strokeWidth={7} />
        </g>
        {/* giày */}
        <ellipse cx={-15} cy={-3} rx={6} ry={3.4} fill="#0b0f16" />
        <ellipse cx={15} cy={-3} rx={6} ry={3.4} fill="#0b0f16" />
        {/* quần */}
        <path d="M-13 -48 H13 L14 -37 Q7 -35 1 -38 H-1 Q-7 -35 -14 -37 Z" fill="#151b26" />
        {/* áo */}
        <path d="M-15 -76 Q0 -80 15 -76 L13 -46 Q0 -43 -13 -46 Z" fill="url(#pk-jersey)" />
        <path d="M-4 -78 L0 -73 L4 -78" fill="none" stroke="#151b26" strokeWidth={1.4} />
        <text x={0} y={-56} textAnchor="middle" fontSize={11} fontWeight={800} fill="#151b26" fillOpacity={0.85}>
          1
        </text>
        {/* găng */}
        <g fill="#f8fafc" stroke="#16a34a" strokeWidth={1.4}>
          <ellipse cx={-38.5} cy={-86.5} rx={6} ry={6.6} />
          <ellipse cx={38.5} cy={-86.5} rx={6} ry={6.6} />
        </g>
        {/* cổ + đầu + tóc */}
        <rect x={-3.2} y={-82} width={6.4} height={6} fill="#d9a07a" />
        <ellipse cx={0} cy={-88} rx={7.6} ry={8.6} fill="#e8b48a" />
        <path d="M-7.8 -89 Q-7 -98.5 0 -98 Q7.5 -98.5 7.8 -89 Q4 -93 0 -93 Q-4 -93 -7.8 -89 Z" fill="#2b1d14" />
      </motion.g>
    </g>
  )
}

/** Quả bóng tại gốc toạ độ */
export function Ball() {
  return (
    <g>
      <circle r={BALL0.r} fill="url(#pk-ball)" />
      <g fill="#1f2937">
        <path d="M0 -4.6 L4.4 -1.4 L2.7 3.7 L-2.7 3.7 L-4.4 -1.4 Z" />
        <path d="M-1.6 -12.9 L1.6 -12.9 L2.4 -10.6 L0 -8.9 L-2.4 -10.6 Z" opacity={0.85} />
        <path d="M11.4 -5.6 L12.8 -2.5 L11 0 L8.8 -2 L9.4 -5 Z" opacity={0.8} />
        <path d="M-11.4 -5.6 L-12.8 -2.5 L-11 0 L-8.8 -2 L-9.4 -5 Z" opacity={0.8} />
        <path d="M6.2 9.6 L8.7 8 L9.4 10.2 L7.6 11.8 Z" opacity={0.7} />
        <path d="M-6.2 9.6 L-8.7 8 L-9.4 10.2 L-7.6 11.8 Z" opacity={0.7} />
      </g>
      <g stroke="#4b5563" strokeWidth={0.7} strokeOpacity={0.7}>
        <path d="M0 -4.6 L0 -8.9 M4.4 -1.4 L8.8 -2 M2.7 3.7 L6.2 9.6 M-2.7 3.7 L-6.2 9.6 M-4.4 -1.4 L-8.8 -2" />
      </g>
      <circle r={BALL0.r} fill="none" stroke="#000000" strokeOpacity={0.15} strokeWidth={0.8} />
    </g>
  )
}

/** Tối 4 góc cho có chiều sâu */
export function Vignette() {
  return <rect width={W} height={H} fill="url(#pk-vignette)" pointerEvents="none" />
}
