import { AnimatePresence, motion } from 'motion/react'
import { fmt } from '../format'

/** Dòng trạng thái / kết quả thắng thua dưới bát hoặc bàn */
export function StatusBanner({
  result,
  text,
  delay = 0.6,
}: {
  /** noBet = ván này không cược, chỉ hiện kết quả */
  result: { net: number; label?: string; noBet?: boolean } | null
  text: string
  delay?: number
}) {
  const tone = !result || result.noBet ? '' : result.net > 0 ? 'border-up/50 text-up' : result.net < 0 ? 'border-down/50 text-down' : 'border-line-strong text-mute'
  return (
    <div className="flex min-h-11 w-full items-center justify-center text-center">
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="res"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay, duration: 0.2 }}
            className={`flex w-full items-center justify-between gap-3 rounded-sm border bg-panel-2 px-3 py-2 ${result.noBet ? 'border-line' : tone}`}
          >
            <span className="min-w-0 truncate text-xs text-mute">{result.label ?? 'Kết quả'}</span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {result.noBet ? <span className="text-dim">Không cược</span> : result.net > 0 ? `+${fmt(result.net)}` : result.net < 0 ? fmt(result.net) : 'Hoà vốn'}
            </span>
          </motion.div>
        ) : (
          <motion.p key={text} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-mute">
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
