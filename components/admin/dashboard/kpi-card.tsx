import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type AccentColor = "red" | "blue" | "green" | "yellow" | "zinc"

const ACCENTS: Record<AccentColor, { bg: string; text: string }> = {
  red: { bg: "bg-red-100", text: "text-[#C8151B]" },
  blue: { bg: "bg-blue-100", text: "text-blue-700" },
  green: { bg: "bg-emerald-100", text: "text-emerald-700" },
  yellow: { bg: "bg-[#F5B800]/20", text: "text-[#8a6500]" },
  zinc: { bg: "bg-zinc-100", text: "text-zinc-700" },
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
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
          )}
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
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
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            trend.positive ? "text-emerald-600" : "text-red-600"
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
  )
}
