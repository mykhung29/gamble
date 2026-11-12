import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { fmt } from '../format'
import { SymbolIcon } from '../game/symbols'
import { PipFace } from './games/TaiXiu'

export type GameId = 'baucua' | 'taixiu' | 'baicao'

export const GAME_NAMES: Record<GameId, string> = { baucua: 'Bầu Cua', taixiu: 'Tài Xỉu', baicao: 'Bài Cào' }

function MiniDie({ children, rotate }: { children: ReactNode; rotate: number }) {
  return (
    <div className="grid size-14 place-items-center rounded-xl border-2 border-stone-300 bg-gradient-to-br from-white to-stone-200 shadow-lg" style={{ rotate: `${rotate}deg` }}>
      {children}
    </div>
  )
}

function MiniCard({ label, suit, red, rotate, y }: { label: string; suit: string; red?: boolean; rotate: number; y: number }) {
  return (
    <div
      className={`absolute grid h-20 w-14 place-items-center rounded-lg border border-zinc-300 bg-white font-extrabold shadow-lg ${red ? 'text-red-600' : 'text-zinc-900'}`}
      style={{ rotate: `${rotate}deg`, translate: `${rotate * 2.2}px ${y}px` }}
    >
      <span className="text-xl leading-none">
        {label}
        <br />
        {suit}
      </span>
    </div>
  )
}

const ART: Record<GameId, ReactNode> = {
  baucua: (
    <div className="flex gap-2">
      <MiniDie rotate={-10}>
        <SymbolIcon id="cua" size={36} />
      </MiniDie>
      <MiniDie rotate={4}>
        <SymbolIcon id="bau" size={36} />
      </MiniDie>
      <MiniDie rotate={-3}>
        <SymbolIcon id="tom" size={36} />
      </MiniDie>
    </div>
  ),
  taixiu: (
    <div className="flex gap-2">
      {[6, 4, 5].map((v, i) => (
        <MiniDie key={i} rotate={[-8, 6, -2][i]}>
          <PipFace value={v} />
        </MiniDie>
      ))}
    </div>
  ),
  baicao: (
    <div className="relative grid h-24 w-40 place-items-center">
      <MiniCard label="K" suit="♠" rotate={-14} y={6} />
      <MiniCard label="Q" suit="♥" red rotate={0} y={0} />
      <MiniCard label="J" suit="♦" red rotate={14} y={6} />
    </div>
  ),
}

const INFO: Record<GameId, { desc: string; bg: string }> = {
  baucua: { desc: 'Lắc 3 xúc xắc 6 con vật · ra mấy con ăn mấy lần', bg: 'from-red-600 via-red-800 to-red-950' },
  taixiu: { desc: 'Đoán tổng 3 xúc xắc · Tài 11–17 / Xỉu 4–10', bg: 'from-slate-600 via-slate-800 to-zinc-950' },
  baicao: { desc: 'Đấu 3 lá với nhà cái · Sáp > Ba Tây > 9 nút', bg: 'from-emerald-600 via-green-800 to-emerald-950' },
}

export function GameMenu({ onPick, played }: { onPick: (id: GameId) => void; played: Record<GameId, { rounds: number; net: number }> }) {
  const ids: GameId[] = ['baucua', 'taixiu', 'baicao']
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <motion.h2
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="gold-text font-display text-5xl drop-shadow sm:text-6xl"
        >
          Chọn trò chơi
        </motion.h2>
        <p className="mt-1 text-sm text-amber-100/60">Cả 3 trò dùng chung số điểm</p>
      </div>

      <div className="grid w-full max-w-5xl gap-4 sm:grid-cols-3 sm:gap-5">
        {ids.map((id, i) => {
          const p = played[id]
          return (
            <motion.button
              key={id}
              onClick={() => onPick(id)}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08 * i, type: 'spring', stiffness: 220, damping: 20 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`group relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl border-2 border-amber-400/50 bg-gradient-to-b p-5 text-center shadow-2xl hover:border-yellow-300 hover:shadow-[0_0_40px_rgba(250,204,21,.35)] ${INFO[id].bg}`}
            >
              <div className="pattern absolute inset-0 opacity-50" />
              <div className="relative grid h-28 place-items-center transition-transform group-hover:scale-110">{ART[id]}</div>
              <div className="relative font-display text-4xl text-amber-50 drop-shadow">{GAME_NAMES[id]}</div>
              <p className="relative text-sm text-amber-100/80">{INFO[id].desc}</p>
              <div className="relative text-xs text-amber-200/60">
                {p.rounds > 0 ? (
                  <>
                    {p.rounds} ván gần đây ·{' '}
                    <span className={p.net > 0 ? 'text-yellow-300' : p.net < 0 ? 'text-zinc-400' : ''}>
                      {p.net > 0 ? '+' : ''}
                      {fmt(p.net)}
                    </span>
                  </>
                ) : (
                  'Chưa chơi ván nào'
                )}
              </div>
              <span className="relative mt-1 rounded-xl bg-gradient-to-b from-yellow-300 to-amber-500 px-5 py-2 font-extrabold text-red-950 shadow-[0_4px_0_#92400e]">
                Chơi ngay →
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
