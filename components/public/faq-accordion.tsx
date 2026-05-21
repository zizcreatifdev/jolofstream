"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export type FaqItem = {
  question: string
  answer: string
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white">
      {items.map((item, index) => {
        const open = openIndex === index
        return (
          <li key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
            >
              <span>{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" as const }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-600">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        )
      })}
    </ul>
  )
}
