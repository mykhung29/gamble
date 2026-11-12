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
  return (
    <div className="flex min-h-14 items-center justify-center text-center">
      <AnimatePresence mode="wait">
        {result?.noBet ? (
          <motion.div
            key="nobet"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', delay }}
            className="rounded-2xl bg-black/40 px-5 py-2 text-lg font-bold text-amber-100"
          >
            {result.label && <span className="mr-2">{result.label} ·</span>}
            <span className="opacity-60">Ván này bạn không cược</span>
          </motion.div>
        ) : result ? (
          <motion.div
            key="res"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', delay }}
            className={`rounded-2xl px-5 py-2 text-xl font-extrabold shadow-lg sm:text-2xl ${
              result.net > 0 ? 'bg-yellow-300 text-red-900' : result.net < 0 ? 'bg-zinc-800 text-zinc-200' : 'bg-sky-700 text-white'
            }`}
          >
            {result.label && <span className="mr-2 opacity-80">{result.label} ·</span>}
            {result.net > 0 ? `🎉 Thắng +${fmt(result.net)}` : result.net < 0 ? `😢 Thua ${fmt(result.net)}` : '🤝 Hoà vốn'}
          </motion.div>
        ) : (
          <motion.p key={text} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-amber-100/80">
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
