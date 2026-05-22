"use client"

import { useState } from "react"
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

import { formatFCFA } from "@/lib/comptabilite"
import { cn } from "@/lib/utils"

export type MonthPoint = { mois: string; montant: number }

function formatAxis(value: number) {
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

const SERIES_COLORS = {
  recettes: "#C8151B",
  depenses: "#D4D4D8",
  benefice: "#10B981",
} as const

type SerieKey = "recettes" | "depenses" | "benefice"

export function GraphiqueRevenus({
  recettes,
  depenses,
}: {
  recettes: MonthPoint[]
  depenses: MonthPoint[]
}) {
  const [visible, setVisible] = useState<Record<SerieKey, boolean>>({
    recettes: true,
    depenses: true,
    benefice: true,
  })

  // Merge series par mois
  const data = recettes.map((r, i) => {
    const d = depenses[i]?.montant ?? 0
    return {
      mois: r.mois,
      recettes: r.montant,
      depenses: d,
      benefice: r.montant - d,
    }
  })

  const toggle = (key: SerieKey) =>
    setVisible((v) => ({ ...v, [key]: !v[key] }))

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {(["recettes", "depenses", "benefice"] as SerieKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150",
              visible[key]
                ? "border-zinc-300 bg-zinc-50 text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-400 line-through"
            )}
          >
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: SERIES_COLORS[key] }}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis
            dataKey="mois"
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatAxis}
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            cursor={{ fill: "rgba(200,21,27,0.05)" }}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value, name) => [
              formatFCFA(Number(value) || 0),
              String(name).charAt(0).toUpperCase() + String(name).slice(1),
            ]}
            labelStyle={{ color: "#18181b", fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: 8 }} />
          {visible.recettes && (
            <Bar
              dataKey="recettes"
              fill={SERIES_COLORS.recettes}
              radius={[4, 4, 0, 0]}
            />
          )}
          {visible.depenses && (
            <Bar
              dataKey="depenses"
              fill={SERIES_COLORS.depenses}
              radius={[4, 4, 0, 0]}
            />
          )}
          {visible.benefice && (
            <Bar
              dataKey="benefice"
              fill={SERIES_COLORS.benefice}
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
