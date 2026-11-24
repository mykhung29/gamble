import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import chenImg from '../assets/baucua/chen.webp'
import { CUP_PAYOUT, PK_PAYOUT, XS_CANG_PAYOUT, XS_DE_PAYOUT } from '../config'
import { fmt } from '../format'
import { HORSES } from '../game/horses'
import { SYMBOL_MAP } from '../game/symbols'
import { HorseSprite } from './games/HorseArt'
import { PipFace } from './games/TaiXiu'

export type GameId = 'baucua' | 'taixiu' | 'baicao' | 'xoso' | 'penalty' | 'doanly' | 'duangua'

export const GAME_NAMES: Record<GameId, string> = { baucua: 'Bầu Cua', taixiu: 'Tài Xỉu', baicao: 'Bài Cào', xoso: 'Xổ Số', penalty: 'Penalty', doanly: 'Đoán Ly', duangua: 'Đua Ngựa' }

function MiniDie({ children }: { children: ReactNode }) {
  return <div className="grid size-14 place-items-center overflow-hidden rounded-sm border border-stone-300 bg-stone-100 shadow-md sm:size-16">{children}</div>
}

function MiniCard({ label, suit, red, x }: { label: string; suit: string; red?: boolean; x: number }) {
  return (
    <div
      className={`absolute flex h-20 w-14 flex-col items-start rounded-sm border border-zinc-300 bg-white p-1.5 text-sm leading-none font-bold shadow-md sm:h-24 sm:w-16 ${red ? 'text-red-600' : 'text-zinc-900'}`}
      style={{ translate: `${x}px 0` }}
    >
      <span>{label}</span>
      <span>{suit}</span>
    </div>
  )
}

const ART: Record<GameId, ReactNode> = {
  baucua: (
    <div className="flex gap-2">
      {(['cua', 'bau', 'tom'] as const).map((id) => (
        <MiniDie key={id}>
          <img src={SYMBOL_MAP[id].img} alt="" draggable={false} className="size-full object-cover" />
        </MiniDie>
      ))}
    </div>
  ),
  taixiu: (
    <div className="flex gap-2">
      {[6, 4, 5].map((v, i) => (
        <MiniDie key={i}>
          <PipFace value={v} />
        </MiniDie>
      ))}
    </div>
  ),
  baicao: (
    <div className="relative grid h-24 w-40 place-items-center">
      <MiniCard label="K" suit="♠" x={-36} />
      <MiniCard label="Q" suit="♥" red x={0} />
      <MiniCard label="J" suit="♦" red x={36} />
    </div>
  ),
  xoso: (
    <div className="flex gap-1">
      {['8', '2', '7', '0', '9', '5'].map((d, i) => (
        <div key={i} className={`grid size-10 place-items-center rounded-full sm:size-12 ${i >= 4 ? 'ball-gold' : i === 3 ? 'ball-gold-soft' : 'ball'}`}>
          <span className="grid size-[62%] place-items-center rounded-full bg-white/90 text-sm font-bold text-zinc-800 tabular-nums sm:text-base">{d}</span>
        </div>
      ))}
    </div>
  ),
  doanly: (
    <div className="relative flex items-end gap-2 pb-1">
      {[0, 1, 2].map((i) => (
        <img
          key={i}
          src={chenImg}
          alt=""
          draggable={false}
          className={`w-12 drop-shadow-md sm:w-20 ${i === 1 ? '-translate-y-4 sm:-translate-y-6' : ''}`}
        />
      ))}
      <span className="absolute bottom-1 left-1/2 size-4 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff7d6,#f2c94c_35%,#a8731a)] shadow sm:size-5" />
    </div>
  ),
  duangua: (
    <div className="relative h-24 w-44">
      {[0, 3, 1].map((h, i) => (
        <div key={h} className="absolute w-20" style={{ left: `${[34, 4, 62][i]}%`, top: `${i * 22}%`, translate: '-25% 0' }}>
          <HorseSprite horse={HORSES[h]} num={h + 1} className="w-full" />
        </div>
      ))}
    </div>
  ),
  penalty: (
    <svg viewBox="0 0 160 96" className="h-24 w-40 overflow-hidden rounded-sm" aria-hidden>
      <rect width={160} height={60} fill="#1b2533" />
      <rect y={50} width={160} height={10} fill="#13294a" />
      <rect x={0} y={60} width={160} height={36} fill="#339552" />
      <rect x={0} y={78} width={160} height={18} fill="#2f8a4c" />
      <rect x={28} y={14} width={104} height={46} fill="#94a3b8" fillOpacity={0.25} />
      <g stroke="#ffffff" strokeOpacity={0.45} strokeWidth={0.8}>
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`v${i}`} x1={28 + i * 10.4} y1={14} x2={28 + i * 10.4} y2={60} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <line key={`h${i}`} x1={28} y1={14 + i * 11.5} x2={132} y2={14 + i * 11.5} />
        ))}
      </g>
      <path d="M26 61 V12 H134 V61" fill="none" stroke="#ffffff" strokeWidth={4} />
      <circle cx={80} cy={82} r={8} fill="#fafafa" stroke="#9ca3af" />
      <path d="M80 79 L83 81 L82 84.5 L78 84.5 L77 81 Z" fill="#1f2937" />
    </svg>
  ),
}

const INFO: Record<GameId, { desc: string; rule: string; tone: string; hot?: boolean }> = {
  baucua: { desc: '6 linh vật · 3 xúc xắc', rule: 'Trả 1:1 mỗi mặt trùng', tone: 'from-[#fbeaea]', hot: true },
  taixiu: { desc: 'Tài / Xỉu / Chẵn / Lẻ / Bão', rule: 'Trả 1:1 · Bão 1:30', tone: 'from-[#e8edf6]', hot: true },
  baicao: { desc: 'Ba lá đấu nhà cái', rule: 'Trả 1:1 · Hoà trả vốn', tone: 'from-[#e5f2ea]' },
  doanly: { desc: 'Theo dõi bóng dưới 3 ly đang tráo', rule: `Trả 1:${String(CUP_PAYOUT).replace('.', ',')}`, tone: 'from-[#f6efe3]' },
  penalty: { desc: 'Vuốt để sút, qua thủ môn là thắng', rule: `Trả 1:${String(PK_PAYOUT).replace('.', ',')}`, tone: 'from-[#e3f1e7]' },
  duangua: { desc: '6 ngựa đua, chọn con về nhất', rule: 'Kèo đổi theo từng ván', tone: 'from-[#e4efe0]' },
  xoso: { desc: 'Đoán số cuối giải đặc biệt', rule: `Đề 1:${XS_DE_PAYOUT} · Càng 1:${XS_CANG_PAYOUT}`, tone: 'from-[#fbf3e1]' },
}

export function GameMenu({
  onPick,
  played,
}: {
  onPick: (id: GameId) => void
  played: Record<GameId, { rounds: number; net: number }>
}) {
  // 'penalty' tạm ẩn — thêm lại vào danh sách để hiện
  const ids: GameId[] = ['baucua', 'taixiu', 'xoso', 'duangua', 'doanly', 'baicao']
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-2 gap-2">
        {ids.map((id, i) => {
          const p = played[id]
          return (
            <motion.button
              key={id}
              onClick={() => onPick(id)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.2 }}
              className="group flex flex-col overflow-hidden rounded-md border border-line bg-panel text-left transition-colors hover:border-gold/60"
            >
              <div className={`relative flex h-28 items-center justify-center overflow-hidden border-b border-line bg-gradient-to-br to-panel-2 sm:h-44 ${INFO[id].tone}`}>
                <div className="scale-[.5] min-[360px]:scale-[.6] min-[380px]:scale-[.7] sm:scale-100">{ART[id]}</div>
                {INFO[id].hot && (
                  <span className="absolute top-2 left-2 rounded-xs bg-down px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wider text-white">HOT</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold sm:text-base">{GAME_NAMES[id]}</div>
                  <div className="mt-0.5 truncate text-[11px] text-mute sm:text-xs">
                    <span className="hidden sm:inline">{INFO[id].desc} · </span>
                    {INFO[id].rule}
                  </div>
                </div>
                <span className="hidden shrink-0 rounded-sm border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors group-hover:border-gold group-hover:bg-gold group-hover:text-white sm:inline-block">
                  Vào chơi
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-line bg-panel-2/50 px-3 py-1.5 text-[11px] sm:text-xs">
                <span className="text-dim">{p.rounds > 0 ? `${p.rounds} ván gần đây` : 'Chưa có ván nào'}</span>
                {p.rounds > 0 && (
                  <span className={`font-semibold tabular-nums ${p.net > 0 ? 'text-up' : p.net < 0 ? 'text-down' : 'text-mute'}`}>
                    {p.net > 0 ? '+' : ''}
                    {fmt(p.net)}
                  </span>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
