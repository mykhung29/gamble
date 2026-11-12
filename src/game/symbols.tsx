import type { SymbolId } from './logic'

export interface SymbolInfo {
  id: SymbolId
  name: string
  emoji: string
  /** class nền cho ô cược */
  tile: string
  /** màu viền xúc xắc */
  ring: string
}

export const SYMBOLS: SymbolInfo[] = [
  { id: 'nai', name: 'Nai', emoji: '🦌', tile: 'from-amber-600 to-amber-900', ring: '#d97706' },
  { id: 'bau', name: 'Bầu', emoji: '', tile: 'from-lime-600 to-emerald-900', ring: '#65a30d' },
  { id: 'ga', name: 'Gà', emoji: '🐓', tile: 'from-rose-600 to-rose-900', ring: '#e11d48' },
  { id: 'ca', name: 'Cá', emoji: '🐟', tile: 'from-sky-600 to-blue-900', ring: '#0284c7' },
  { id: 'cua', name: 'Cua', emoji: '🦀', tile: 'from-orange-600 to-red-900', ring: '#ea580c' },
  { id: 'tom', name: 'Tôm', emoji: '🦐', tile: 'from-pink-500 to-fuchsia-900', ring: '#db2777' },
]

export const SYMBOL_MAP = Object.fromEntries(SYMBOLS.map((s) => [s.id, s])) as Record<SymbolId, SymbolInfo>

/** Không có emoji quả bầu -> tự vẽ SVG */
function Gourd({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M32 4 C30 8 30 10 31 13" stroke="#5b3a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M33 9 C38 4 45 6 46 9 C41 11 37 11 33 9Z" fill="#4d7c0f" />
      <ellipse cx="32" cy="23" rx="10" ry="11" fill="#84cc16" />
      <ellipse cx="32" cy="45" rx="17" ry="16" fill="#65a30d" />
      <path d="M22 32 Q32 37 42 32" stroke="#4d7c0f" strokeWidth="2" fill="none" />
      <ellipse cx="27" cy="19" rx="3" ry="5" fill="#d9f99d" opacity=".7" />
      <ellipse cx="24" cy="41" rx="4" ry="7" fill="#d9f99d" opacity=".5" />
    </svg>
  )
}

export function SymbolIcon({ id, size = 48 }: { id: SymbolId; size?: number }) {
  if (id === 'bau') return <Gourd size={size} />
  return (
    <span style={{ fontSize: size * 0.85, lineHeight: 1 }} className="inline-block drop-shadow" aria-hidden>
      {SYMBOL_MAP[id].emoji}
    </span>
  )
}
