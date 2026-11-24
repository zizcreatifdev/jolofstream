"use client"

import { useId } from "react"
import { motion } from "framer-motion"

// Repli d'une slide sans video ni image : la scene de la maquette (scene,
// deux faisceaux de lumiere qui balancent, public en silhouette).
export function HeroStage({ animated }: { animated: boolean }) {
  const gradientId = `hero-beam-${useId().replace(/:/g, "")}`
  // Durees differentes : les deux faisceaux se desynchronisent
  const sway = (duration: number) =>
    animated
      ? {
          animate: { rotate: [-7, 7, -7] },
          transition: { duration, repeat: Infinity, ease: "easeInOut" as const },
        }
      : {}

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-[linear-gradient(160deg,#2A0B0B,#050303)]"
    >
      <motion.div
        className="absolute inset-0 origin-[60%_50%] opacity-[0.55]"
        initial={false}
        animate={animated ? { scale: [1.05, 1.22] } : { scale: 1.05 }}
        transition={
          animated
            ? { duration: 24, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
            : { duration: 0 }
        }
      >
        <svg
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
          className="block h-full w-full"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFE7A3" stopOpacity="0.45" />
              <stop offset="1" stopColor="#FFE7A3" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.polygon
            points="420,0 470,0 760,640 520,640"
            fill={`url(#${gradientId})`}
            style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
            {...sway(9)}
          />
          <motion.polygon
            points="1100,0 1150,0 1260,640 980,640"
            fill={`url(#${gradientId})`}
            style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
            {...sway(11)}
          />
          <g fill="#000">
            <ellipse cx="1020" cy="560" rx="52" ry="64" />
            <circle cx="1020" cy="470" r="34" />
            <rect x="950" y="590" width="140" height="190" rx="6" fill="#1A1110" />
            <rect x="950" y="616" width="140" height="12" fill="#C8151B" />
            {[
              [60, 830, 44], [200, 815, 40], [340, 835, 46], [480, 818, 40],
              [620, 836, 46], [760, 818, 40], [900, 836, 46], [1040, 816, 40],
              [1180, 834, 46], [1320, 818, 40], [1460, 834, 46], [1590, 820, 42],
            ].map(([cx, cy, r]) => (
              <circle key={cx} cx={cx} cy={cy} r={r} />
            ))}
            <rect x="0" y="860" width="1600" height="40" />
          </g>
        </svg>
      </motion.div>
    </div>
  )
}
