import { motion, type HTMLMotionProps } from 'motion/react'

type Variant = 'gold' | 'ghost' | 'red'

const styles: Record<Variant, string> = {
  gold: 'bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 text-red-950 shadow-[0_4px_0_#92400e] hover:brightness-110',
  red: 'bg-gradient-to-b from-red-500 to-red-700 text-white shadow-[0_4px_0_#7f1d1d] hover:brightness-110',
  ghost: 'bg-white/10 text-amber-100 hover:bg-white/20 border border-amber-200/20',
}

export function Button({ variant = 'gold', className = '', ...p }: HTMLMotionProps<'button'> & { variant?: Variant }) {
  return (
    <motion.button
      whileTap={p.disabled ? undefined : { scale: 0.95, y: 2 }}
      className={`rounded-xl px-4 py-2 font-extrabold transition disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${styles[variant]} ${className}`}
      {...p}
    />
  )
}
