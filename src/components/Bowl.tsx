import { useEffect, type ReactNode } from "react";
import { motion, useAnimationControls } from "motion/react";

/** idle: chờ lắc · shaking: đang lắc · betting: đã lắc, đang đặt cược · revealed: đã khui */
export type Phase = "idle" | "shaking" | "betting" | "revealed";

const TILTS = [-8, 6, -3];

/** Hiệu ứng xúc xắc bật ra khi khui */
export function DieShell({
  index,
  revealed,
  border,
  children,
}: {
  index: number;
  revealed: boolean;
  border?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={revealed ? { scale: 0.3, rotate: 180, opacity: 0 } : false}
      animate={{ scale: 1, rotate: TILTS[index], opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 14,
        delay: revealed ? 0.15 + index * 0.18 : 0,
      }}
      className="grid size-[4.5rem] place-items-center overflow-hidden rounded-2xl border-[3px] bg-gradient-to-br from-white to-stone-200 shadow-[0_6px_0_rgba(0,0,0,.25),0_10px_20px_rgba(0,0,0,.3)] sm:size-20"
      style={{ borderColor: border ?? "#d6d3d1" }}
    >
      {children}
    </motion.div>
  );
}

/** Đĩa + bát úp. children = 3 xúc xắc (2 trên, 1 dưới) */
/** overlay: thứ hiển thị đè lên mép trên bát (vd. đồng hồ đếm ngược), không rung theo bát */
export function Bowl({
  phase,
  hint,
  dice,
  overlay,
}: {
  phase: Phase;
  hint?: string;
  dice: [ReactNode, ReactNode, ReactNode];
  overlay?: ReactNode;
}) {
  const controls = useAnimationControls();
  const revealed = phase === "revealed";

  useEffect(() => {
    if (revealed) {
      void controls.start({
        x: 170,
        y: -130,
        rotate: 28,
        opacity: 0,
        transition: { duration: 0.55, ease: "easeIn" },
      });
    } else {
      void controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 240, damping: 22 },
      });
    }
  }, [revealed, controls]);

  return (
    <div className="relative">
      <motion.div
        className="relative size-56 sm:size-72"
        animate={
          phase === "shaking"
            ? {
                x: [0, -16, 14, -12, 10, -6, 0],
                y: [0, -8, 4, -10, 6, -4, 0],
                rotate: [0, -5, 4, -3, 5, -2, 0],
                scale: 1.04,
              }
            : { x: 0, y: 0, rotate: 0, scale: 1 }
        }
        transition={
          phase === "shaking"
            ? { duration: 0.4, repeat: Infinity }
            : { duration: 0.3 }
        }
      >
        {/* Đĩa sứ */}
        <div className="absolute inset-0 rounded-full border-[10px] border-sky-800 bg-[radial-gradient(circle_at_40%_35%,#ffffff,#e7e5e4_60%,#a8a29e)] shadow-[0_20px_40px_rgba(0,0,0,.5)]">
          <div className="absolute inset-3 rounded-full border-2 border-dashed border-sky-700/40" />
        </div>

        {/* Xúc xắc — chỉ hiện khi đã khui */}
        {revealed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="flex gap-2">
              {dice[0]}
              {dice[1]}
            </div>
            {dice[2]}
          </div>
        )}

        {/* Bát úp */}
        <motion.div
          animate={controls}
          className="absolute -inset-2 rounded-full border-4 border-amber-300 bg-[radial-gradient(circle_at_35%_30%,#fde68a_0%,#d97706_18%,#9a3412_50%,#431407_100%)] shadow-[0_25px_50px_rgba(0,0,0,.6),inset_0_-10px_30px_rgba(0,0,0,.5)]"
        >
          <div className="absolute inset-6 rounded-full border-2 border-amber-300/40" />
          <div className="absolute inset-12 rounded-full border border-amber-300/25" />
          <div className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-amber-200 bg-[radial-gradient(circle_at_35%_30%,#fef3c7,#b45309_70%)] shadow-lg">
            <span className="text-2xl">🧧</span>
          </div>
          {hint && (
            <motion.div
              className="absolute bottom-8 w-full text-center text-xs font-semibold text-amber-100/90"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              {hint}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
      {overlay && (
        <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          {overlay}
        </div>
      )}
    </div>
  );
}
