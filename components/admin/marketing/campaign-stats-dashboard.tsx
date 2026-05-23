"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  MousePointerClick,
  RefreshCw,
  Send,
  TrendingUp,
  Users,
  UserX,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type StatsResponse = {
  destinataires: number
  envoyes: number
  ouverts: number
  ouverts_uniques: number
  taux_ouverture: number
  cliques: number
  cliques_uniques: number
  taux_clic: number
  desabonnes: number
  series: Array<{ jour: string; ouvertures: number; clics: number }>
}

function formatJour(iso: string): string {
  const [, m, d] = iso.split("-")
  return `${d}/${m}`
}

export function CampaignStatsDashboard({ id }: { id: string }) {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/marketing/campagnes/${id}/stats`, {
        cache: "no-store",
      })
      if (!r.ok) throw new Error("Erreur de chargement")
      const data = (await r.json()) as StatsResponse
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error ?? "Statistiques indisponibles."}
      </div>
    )
  }

  const chartData = stats.series.map((s) => ({
    ...s,
    jour: formatJour(s.jour),
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">
          Statistiques d&apos;envoi
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={cn("mr-1.5 h-3.5 w-3.5", refreshing && "animate-spin")}
          />
          {refreshing ? "Actualisation..." : "Actualiser"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Destinataires"
          value={String(stats.destinataires)}
          sub={`${stats.envoyes} envoye${stats.envoyes > 1 ? "s" : ""}`}
          Icon={Users}
          accent="zinc"
        />
        <KpiCard
          label="Taux ouverture"
          value={`${stats.taux_ouverture}%`}
          sub={`${stats.ouverts_uniques} unique${stats.ouverts_uniques > 1 ? "s" : ""} - ${stats.ouverts} total`}
          Icon={TrendingUp}
          accent="green"
        />
        <KpiCard
          label="Taux de clic"
          value={`${stats.taux_clic}%`}
          sub={`${stats.cliques_uniques} unique${stats.cliques_uniques > 1 ? "s" : ""} - ${stats.cliques} total`}
          Icon={MousePointerClick}
          accent="blue"
        />
        <KpiCard
          label="Desabonnes"
          value={String(stats.desabonnes)}
          sub="sur les listes ciblees"
          Icon={UserX}
          accent="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">
              Activite des 14 derniers jours
            </h3>
            <p className="text-xs text-zinc-500">
              Ouvertures et clics par jour
            </p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e4e4e7"
                vertical={false}
              />
              <XAxis
                dataKey="jour"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                cursor={{ fill: "rgba(200,21,27,0.05)" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e4e4e7",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: 4 }} />
              <Bar
                dataKey="ouvertures"
                fill="#C8151B"
                radius={[3, 3, 0, 0]}
                name="Ouvertures"
              />
              <Bar
                dataKey="clics"
                fill="#3B82F6"
                radius={[3, 3, 0, 0]}
                name="Clics"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            Recapitulatif
          </h3>
          <ul className="divide-y divide-zinc-100 text-sm">
            <StatRow
              Icon={Send}
              label="Envoyes"
              value={stats.envoyes}
              percent={null}
              base={stats.envoyes}
            />
            <StatRow
              Icon={TrendingUp}
              label="Ouverts uniques"
              value={stats.ouverts_uniques}
              percent={stats.taux_ouverture}
              base={stats.envoyes}
            />
            <StatRow
              Icon={MousePointerClick}
              label="Cliques"
              value={stats.cliques}
              percent={stats.taux_clic}
              base={stats.envoyes}
            />
            <StatRow
              Icon={UserX}
              label="Desabonnes"
              value={stats.desabonnes}
              percent={
                stats.envoyes > 0
                  ? Math.round((stats.desabonnes / stats.envoyes) * 100)
                  : null
              }
              base={stats.envoyes}
            />
          </ul>
          {stats.envoyes === 0 && (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
              La campagne n&apos;a pas encore ete envoyee. Les taux seront
              calcules apres envoi.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

type Accent = "zinc" | "green" | "red" | "blue"

const ACCENTS: Record<Accent, { stripe: string; bg: string; text: string }> = {
  zinc: { stripe: "bg-zinc-400", bg: "bg-zinc-100", text: "text-zinc-700" },
  green: {
    stripe: "bg-emerald-500",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
  },
  red: { stripe: "bg-[#C8151B]", bg: "bg-red-100", text: "text-[#C8151B]" },
  blue: { stripe: "bg-blue-500", bg: "bg-blue-100", text: "text-blue-700" },
}

function KpiCard({
  label,
  value,
  sub,
  Icon,
  accent = "zinc",
}: {
  label: string
  value: string
  sub?: string
  Icon: typeof Users
  accent?: Accent
}) {
  const a = ACCENTS[accent]
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <span
        aria-hidden
        className={cn("absolute inset-x-0 top-0 h-1", a.stripe)}
      />
      <div className="flex items-start justify-between p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {label}
          </p>
          <p className="mt-1 truncate text-2xl font-bold text-zinc-900">
            {value}
          </p>
          {sub && (
            <p className="mt-1 truncate text-[11px] text-zinc-500">{sub}</p>
          )}
        </div>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            a.bg,
            a.text
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

function StatRow({
  Icon,
  label,
  value,
  percent,
  base,
}: {
  Icon: typeof Users
  label: string
  value: number
  percent: number | null
  base: number
}) {
  return (
    <li className="flex items-center justify-between py-2">
      <span className="inline-flex items-center gap-2 text-zinc-700">
        <Icon className="h-4 w-4 text-zinc-400" /> {label}
      </span>
      <span className="text-right">
        <span className="font-semibold text-zinc-900">{value}</span>
        {percent !== null && base > 0 && (
          <span className="ml-1.5 text-xs text-zinc-500">({percent}%)</span>
        )}
      </span>
    </li>
  )
}
