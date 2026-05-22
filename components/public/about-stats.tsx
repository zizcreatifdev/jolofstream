"use client"

import { motion } from "framer-motion"

const defaultStats = [
  { value: "50+", label: "evenements diffuses" },
  { value: "3", label: "plateformes simultanees" },
  { value: "HD", label: "qualite garantie" },
  { value: "2026", label: "annee de lancement" },
]

export function AboutStatsGrid({
  items,
}: {
  items?: Array<{ value: string; label: string }>
}) {
  const stats = items && items.length > 0 ? items : defaultStats
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={`${stat.label}-${index}`}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            ease: "easeOut" as const,
          }}
          className="rounded-xl border border-zinc-100 bg-zinc-50 p-6 text-center"
        >
          <p className="text-4xl font-bold text-[#C8151B]">{stat.value}</p>
          <p className="mt-2 text-sm text-zinc-500">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  )
}
