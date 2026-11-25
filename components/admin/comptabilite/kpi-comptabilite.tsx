"use client"

import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatFCFA, formatMarge } from "@/lib/comptabilite"

export type ComptabiliteKpisData = {
  recettes: { total: number; ce_mois: number; mois_precedent: number }
  depenses: { total: number; ce_mois: number }
  benefice: { total: number; ce_mois: number; marge: number }
  factures_impayees: { count: number; total: number }
}

export function KpiComptabilite({ data }: { data: ComptabiliteKpisData }) {
  const trend =
    data.recettes.mois_precedent > 0
      ? ((data.recettes.ce_mois - data.recettes.mois_precedent) /
          data.recettes.mois_precedent) *
        100
      : null
  const beneficePositif = data.benefice.total >= 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Recettes totales"
        value={formatFCFA(data.recettes.total)}
        subtitle={`Ce mois : ${formatFCFA(data.recettes.ce_mois)}`}
        Icon={TrendingUp}
        accent="green"
        trend={trend !== null ? trend : undefined}
      />
      <KpiCard
        title="Dépenses totales"
        value={formatFCFA(data.depenses.total)}
        subtitle={`Ce mois : ${formatFCFA(data.depenses.ce_mois)}`}
        Icon={TrendingDown}
        accent="red"
      />
      <KpiCard
        title="Bénéfice net"
        value={formatFCFA(data.benefice.total)}
        subtitle={`Marge : ${formatMarge(data.benefice.marge)}`}
        Icon={DollarSign}
        accent={beneficePositif ? "green" : "red"}
      />
      <KpiCard
        title="Factures impayées"
        value={formatFCFA(data.factures_impayees.total)}
        subtitle={`${data.factures_impayees.count} facture${data.factures_impayees.count > 1 ? "s" : ""} en attente`}
        Icon={AlertCircle}
        accent="orange"
      />
    </div>
  )
}

type Accent = "red" | "green" | "blue" | "yellow" | "zinc" | "orange"

const ACCENTS: Record<
  Accent,
  { bg: string; text: string }
> = {
  red: { bg: "bg-red-100", text: "text-[#C8151B]" },
  green: { bg: "bg-emerald-100", text: "text-emerald-700" },
  blue: { bg: "bg-blue-100", text: "text-blue-700" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-700" },
  zinc: { bg: "bg-zinc-100", text: "text-zinc-700" },
  orange: { bg: "bg-orange-100", text: "text-orange-700" },
}

function KpiCard({
  title,
  value,
  subtitle,
  trend,
  Icon,
  accent = "zinc",
}: {
  title: string
  value: string
  subtitle?: string
  trend?: number
  Icon: typeof TrendingUp
  accent?: Accent
}) {
  const accentClasses = ACCENTS[accent]
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {title}
            </p>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight text-zinc-900">
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 truncate text-xs text-zinc-500">{subtitle}</p>
            )}
          </div>
          <span
            className={cn(
              "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              accentClasses.bg,
              accentClasses.text
            )}
          >
            <Icon className="relative h-5 w-5" />
          </span>
        </div>
        {trend !== undefined && (
          <p
            className={cn(
              "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            )}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend).toFixed(1)}% vs mois précédent
          </p>
        )}
      </div>
    </div>
  )
}
