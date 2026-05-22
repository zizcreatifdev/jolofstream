import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type AccentColor = "red" | "blue" | "green" | "yellow" | "zinc"

const ACCENTS: Record<
  AccentColor,
  { bg: string; text: string; stripe: string }
> = {
  red: {
    bg: "bg-red-100",
    text: "text-[#C8151B]",
    stripe: "bg-[#C8151B]",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    stripe: "bg-blue-500",
  },
  green: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    stripe: "bg-emerald-500",
  },
  yellow: {
    bg: "bg-[#F5B800]/20",
    text: "text-[#8a6500]",
    stripe: "bg-[#F5B800]",
  },
  zinc: {
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    stripe: "bg-zinc-400",
  },
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  Icon,
  accent = "zinc",
}: {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; positive: boolean }
  Icon: LucideIcon
  accent?: AccentColor
}) {
  const accentClasses = ACCENTS[accent]
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <span
        aria-hidden
        className={cn("absolute inset-x-0 top-0 h-1", accentClasses.stripe)}
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {title}
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-zinc-900">
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
            )}
          </div>
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              accentClasses.bg,
              accentClasses.text
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        </div>
        {trend && (
          <p
            className={cn(
              "mt-4 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend.positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            )}
          >
            {trend.positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {trend.value.toFixed(1)}% vs mois precedent
          </p>
        )}
      </div>
    </div>
  )
}
