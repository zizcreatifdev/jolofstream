"use client"

import { motion } from "framer-motion"

export function PageHero({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24 text-white sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(200,21,27,0.22),transparent_55%),radial-gradient(circle_at_85%_70%,rgba(245,184,0,0.1),transparent_55%)]" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
          className="text-5xl font-bold tracking-tighter md:text-6xl lg:text-7xl"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.1,
              ease: "easeOut" as const,
            }}
            className="mx-auto mt-5 max-w-2xl text-base text-zinc-300 md:text-lg"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  )
}
