import type { HorseInfo } from '../../game/horses'

/** Ngựa nhìn ngang, quay sang phải. run = đang phi (chân và thân chuyển động) */
export function HorseSprite({ horse, num, run = false, pace = 0.32, className = '' }: { horse: HorseInfo; num: number; run?: boolean; pace?: number; className?: string }) {
  const { coat, silk } = horse
  const dark = 'rgba(0,0,0,.35)'
  return (
    <svg
      viewBox="0 0 64 44"
      className={`horse overflow-visible ${run ? 'run' : ''} ${className}`}
      style={{ ['--pace' as string]: `${pace}s` }}
      aria-hidden
    >
      <ellipse cx={32} cy={41} rx={18} ry={2.2} fill="rgba(0,0,0,.22)" />
      <g className="horse-body">
        {/* chân phía xa (tối hơn) */}
        <g stroke={coat} strokeWidth={3.2} strokeLinecap="round">
          <line className="leg leg-b" x1={23} y1={24} x2={23} y2={38} />
          <line className="leg leg-a" x1={42} y1={23} x2={42} y2={38} />
        </g>
        <g stroke={dark} strokeWidth={3.2} strokeLinecap="round">
          <line className="leg leg-b" x1={23} y1={24} x2={23} y2={38} />
          <line className="leg leg-a" x1={42} y1={23} x2={42} y2={38} />
        </g>
        {/* đuôi */}
        <path className="tail" d="M18 17 C11 16 7 22 4 29" fill="none" stroke={coat} strokeWidth={3.4} strokeLinecap="round" />
        <path className="tail" d="M18 17 C11 16 7 22 4 29" fill="none" stroke={dark} strokeWidth={3.4} strokeLinecap="round" />
        {/* chân phía gần */}
        <g stroke={coat} strokeWidth={3.4} strokeLinecap="round">
          <line className="leg leg-a" x1={20} y1={24} x2={20} y2={38} />
          <line className="leg leg-b" x1={39} y1={23} x2={39} y2={38} />
        </g>
        {/* thân, cổ, đầu */}
        <ellipse cx={30} cy={20.5} rx={14} ry={7.5} fill={coat} />
        <path d="M37 17 L45 6.5 L51 9.5 L44.5 22 Z" fill={coat} />
        <path d="M44 6 Q49 2.5 54 6 L59.5 11.5 Q60.5 14.2 57.5 14.3 L49.5 12.5 Z" fill={coat} />
        <path d="M46.5 5 L47.6 1.2 L49.6 4.6 Z" fill={coat} />
        <path d="M45 5.5 L38.5 16.5" stroke={dark} strokeWidth={2.2} strokeLinecap="round" />
        <circle cx={52} cy={7.6} r={0.95} fill="#111" />
        <path d="M57.8 12.4 L51 9.5 L45.5 12" fill="none" stroke="#1f1f1f" strokeWidth={0.7} />
        {/* khăn yên + số */}
        <rect x={23} y={15} width={11} height={9} rx={1.2} fill="#fff" stroke={silk} strokeWidth={1.2} />
        <text x={28.5} y={22} textAnchor="middle" fontSize={7} fontWeight={800} fill="#111" fontFamily="ui-sans-serif, system-ui">
          {num}
        </text>
        {/* nài ngựa */}
        <path d="M32 13 L35.5 18.5" stroke="#f5f5f4" strokeWidth={2.6} strokeLinecap="round" />
        <ellipse cx={34} cy={9.6} rx={4.6} ry={3.4} transform="rotate(-25 34 9.6)" fill={silk} />
        <path d="M36 10 L44 12" stroke={silk} strokeWidth={2} strokeLinecap="round" />
        <circle cx={38.2} cy={4.6} r={2.7} fill={silk} />
        <path d="M37 3.2 A2.7 2.7 0 0 1 40.9 4.8 L38.2 4.6 Z" fill="rgba(255,255,255,.55)" />
      </g>
    </svg>
  )
}
