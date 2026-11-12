import type { SymbolId } from './logic'
import naiImg from '../assets/baucua/nai.webp'
import bauImg from '../assets/baucua/bau.webp'
import gaImg from '../assets/baucua/ga.webp'
import caImg from '../assets/baucua/ca.webp'
import cuaImg from '../assets/baucua/cua.webp'
import tomImg from '../assets/baucua/tom.webp'

export interface SymbolInfo {
  id: SymbolId
  name: string
  /** ảnh ô cược */
  img: string
  /** class nền cho ô cược */
  tile: string
  /** màu viền xúc xắc */
  ring: string
}

export const SYMBOLS: SymbolInfo[] = [
  { id: 'nai', img: naiImg, name: 'Nai', tile: 'from-amber-600 to-amber-900', ring: '#d97706' },
  { id: 'bau', img: bauImg, name: 'Bầu', tile: 'from-lime-600 to-emerald-900', ring: '#65a30d' },
  { id: 'ga', img: gaImg, name: 'Gà', tile: 'from-rose-600 to-rose-900', ring: '#e11d48' },
  { id: 'ca', img: caImg, name: 'Cá', tile: 'from-sky-600 to-blue-900', ring: '#0284c7' },
  { id: 'cua', img: cuaImg, name: 'Cua', tile: 'from-orange-600 to-red-900', ring: '#ea580c' },
  { id: 'tom', img: tomImg, name: 'Tôm', tile: 'from-pink-500 to-fuchsia-900', ring: '#db2777' },
]

export const SYMBOL_MAP = Object.fromEntries(SYMBOLS.map((s) => [s.id, s])) as Record<SymbolId, SymbolInfo>

/** Ảnh con vật (dùng ở xúc xắc, lịch sử, hộp cược, menu) */
export function SymbolIcon({ id, size = 48, className = '' }: { id: SymbolId; size?: number; className?: string }) {
  return (
    <img
      src={SYMBOL_MAP[id].img}
      alt=""
      aria-hidden
      draggable={false}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`inline-block rounded-[18%] object-cover ${className}`}
    />
  )
}
