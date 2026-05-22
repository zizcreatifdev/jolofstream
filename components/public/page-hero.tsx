"use client"

import { motion } from "framer-motion"

export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
}) {
  return (
    <section className="relative overflow-hidden bg-ink pb-20 pt-40 text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_90%_50%,rgba(200,21,27,0.22),transparent_55%),radial-gradient(circle_at_10%_80%,rgba(245,184,0,0.08),transparent_50%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {eyebrow && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
            className="mb-5 flex items-center gap-3"
          >
            <span aria-hidden className="block h-px w-5 bg-[#C8151B]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C8151B]">
              {eyebrow}
            </span>
          </motion.div>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
          className="font-display font-normal leading-[1.05] tracking-tight text-white"
          style={{ fontSize: "clamp(42px, 5vw, 72px)" }}
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.1,
              ease: "easeOut" as const,
            }}
            className="mt-6 max-w-[540px] text-[17px] font-light leading-[1.8] text-white/50"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  )
}
