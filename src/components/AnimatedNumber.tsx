import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { fmt } from '../format'

export function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => fmt(v))
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.7, ease: 'easeOut' })
    return () => c.stop()
  }, [value, mv])
  return <motion.span>{text}</motion.span>
}
