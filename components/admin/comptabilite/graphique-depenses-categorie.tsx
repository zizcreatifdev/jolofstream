"use client"

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import {
  EXPENSE_CATEGORIES_COLORS,
  EXPENSE_CATEGORIES_LABELS,
  formatFCFA,
} from "@/lib/comptabilite"

export type DepenseCategorie = { categorie: string; montant: number }

export function GraphiqueDepensesCategorie({
  data,
}: {
  data: DepenseCategorie[]
}) {
  const total = data.reduce((s, d) => s + d.montant, 0)

  if (total === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
        Aucune depense enregistree.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: EXPENSE_CATEGORIES_LABELS[d.categorie] ?? d.categorie,
    value: d.montant,
    color: EXPENSE_CATEGORIES_COLORS[d.categorie] ?? "#6B7280",
    pourcentage: total > 0 ? (d.montant / total) * 100 : 0,
  }))

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value, name, item) => {
              const payload =
                (item && (item.payload as { pourcentage?: number })) || {}
              const pct = payload.pourcentage ?? 0
              return [
                `${formatFCFA(Number(value) || 0)} (${pct.toFixed(1)}%)`,
                String(name),
              ]
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            iconType="square"
            verticalAlign="bottom"
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Depenses
        </p>
        <p className="mt-1 text-lg font-bold text-zinc-900">
          {formatFCFA(total)}
        </p>
      </div>
    </div>
  )
}
