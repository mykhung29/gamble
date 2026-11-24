import { motion, type HTMLMotionProps } from 'motion/react'

type Variant = 'gold' | 'ghost' | 'red'

const styles: Record<Variant, string> = {
  gold: 'bg-gold text-white hover:bg-gold-hi border border-gold',
  red: 'bg-transparent text-down border border-down/60 hover:bg-down/10',
  ghost: 'bg-panel-2 text-ink border border-line hover:border-line-strong hover:bg-panel-3',
}

export function Button({ variant = 'gold', className = '', ...p }: HTMLMotionProps<'button'> & { variant?: Variant }) {
  return (
    <motion.button
      whileTap={p.disabled ? undefined : { scale: 0.985 }}
      className={`h-9 rounded-sm px-3 text-sm font-semibold whitespace-nowrap sm:px-4 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
      {...p}
    />
  )
}
