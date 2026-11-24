import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import chenImg from '../assets/baucua/chen.webp'
import diaImg from '../assets/baucua/dia.webp'

/** idle: chờ lắc · shaking: đang lắc · betting: đã lắc, đang đặt cược · revealed: đã khui */
export type Phase = 'idle' | 'shaking' | 'betting' | 'revealed'

type Three<T> = [T, T, T]

const TILTS = [-4, 3, -2]

/** Khui xong bao lâu thì phóng to mặt xúc xắc, và giữ phóng to bao lâu (ms) */
const ZOOM_IN_MS = 950
const ZOOM_HOLD_MS = 3200

/** Vỏ xúc xắc, kích thước do class truyền vào */
function Die({ face, border, className }: { face: ReactNode; border?: string; className: string }) {
  return (
    <div className={`grid place-items-center overflow-hidden border-2 bg-stone-100 ${className}`} style={{ borderColor: border ?? '#d6d3d1' }}>
      {face}
    </div>
  )
}

/*
 * Bố cục (theo % khung, khung tỉ lệ 100:80):
 *  - Đĩa: rộng 100%, nằm sát đáy khung.
 *  - Chén: rộng 76%, miệng chén úp xuống lòng đĩa.
 *  - Xúc xắc: 2 con trên, 1 con dưới, đặt ở lòng đĩa (chỉ render khi đã khui).
 *  - Khui xong: phóng to 3 mặt ra giữa khung vài giây cho dễ nhìn (bấm để đóng sớm).
 */

/** Đĩa + chén úp. faces = nội dung mặt 3 xúc xắc, borders = màu viền từng con */
export function Bowl({
  phase,
  faces,
  borders,
  roundKey,
}: {
  phase: Phase
  faces: Three<ReactNode>
  borders?: Three<string | undefined>
  /** đổi mỗi ván để hiệu ứng xúc xắc chạy lại */
  roundKey: number
}) {
  const controls = useAnimationControls()
  const revealed = phase === 'revealed'
  const [zoom, setZoom] = useState(false)

  useEffect(() => {
    if (revealed) {
      // nhấc chén lên rồi đưa ra sau
      void controls.start({
        y: ['0%', '-38%', '-60%'],
        x: ['0%', '0%', '30%'],
        rotate: [0, -6, 14],
        opacity: [1, 1, 0],
        transition: { duration: 0.7, times: [0, 0.45, 1], ease: 'easeInOut' },
      })
      const a = window.setTimeout(() => setZoom(true), ZOOM_IN_MS)
      const b = window.setTimeout(() => setZoom(false), ZOOM_IN_MS + ZOOM_HOLD_MS)
      return () => {
        window.clearTimeout(a)
        window.clearTimeout(b)
        setZoom(false)
      }
    }
    void controls.start({ y: '0%', x: '0%', rotate: 0, opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } })
  }, [revealed, controls])

  const small = (i: number) => (
    <motion.div
      key={`${roundKey}-s${i}`}
      initial={{ scale: 0.5, y: -10, opacity: 0 }}
      animate={{ scale: 1, y: 0, rotate: TILTS[i], opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.25 + i * 0.12 }}
    >
      <Die face={faces[i]} border={borders?.[i]} className="size-[16.5cqw] rounded-md shadow-[0_4px_8px_rgba(0,0,0,.3)]" />
    </motion.div>
  )

  return (
    <motion.div
      className="@container relative mx-auto aspect-[100/80] w-full max-w-[30rem] select-none"
      animate={
        phase === 'shaking'
          ? { x: [0, -10, 9, -8, 7, -4, 0], y: [0, -6, 2, -7, 3, -2, 0], rotate: [0, -3, 2.5, -2, 2, -1, 0] }
          : { x: 0, y: 0, rotate: 0 }
      }
      transition={phase === 'shaking' ? { duration: 0.35, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.25 }}
    >
      {/* bóng đổ dưới đĩa */}
      <div className="absolute inset-x-[6%] bottom-[-2%] h-[14%] rounded-[50%] bg-black/25 blur-md" />

      {/* Đĩa */}
      <img src={diaImg} alt="" draggable={false} className="absolute bottom-0 left-0 w-full" />

      {/* Xúc xắc — chỉ có trong DOM khi đã khui */}
      {revealed && (
        <div className="absolute inset-x-0 top-[63%] flex -translate-y-1/2 flex-col items-center gap-[1.5cqw]">
          <div className="flex gap-[1.5cqw]">
            {small(0)}
            {small(1)}
          </div>
          {small(2)}
        </div>
      )}

      {/* Chén úp */}
      <motion.img
        src={chenImg}
        alt=""
        draggable={false}
        animate={controls}
        className="absolute bottom-[14%] left-[12%] z-10 w-[76%] drop-shadow-[0_10px_12px_rgba(0,0,0,.25)]"
      />

      {/* Phóng to kết quả */}
      <AnimatePresence>
        {revealed && zoom && (
          <motion.div
            key={`${roundKey}-zoom`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setZoom(false)}
            className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center gap-[4%] rounded-md bg-white/75 backdrop-blur-[2px]"
          >
            {faces.map((f, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22, delay: i * 0.08 }}
                className="aspect-square w-[29%]"
              >
                <Die face={f} border={borders?.[i]} className="size-full rounded-lg border-[3px] shadow-[0_10px_24px_rgba(0,0,0,.25)]" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
