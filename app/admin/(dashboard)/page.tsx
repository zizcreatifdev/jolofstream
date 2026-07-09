import Link from "next/link"
import {
  AlertCircle,
  FolderKanban,
  GraduationCap,
  TrendingUp,
  UserPlus,
} from "lucide-react"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { KpiCard } from "@/components/admin/dashboard/kpi-card"
import {
  RevenueChart,
  type RevenuePoint,
} from "@/components/admin/dashboard/revenue-chart"
import { formatAmount, formatDate } from "@/lib/documents"

type DashboardData = {
  ca_mois_courant: number
  ca_mois_precedent: number
  projets_en_cours: number
  factures_impayees_count: number
  factures_impayees_total: number
  inscriptions_en_attente: number
  leads_cette_semaine: number
  ca_par_mois: RevenuePoint[]
  derniers_leads: Array<{
    id: string
    name: string
    organization: string | null
    notes: string | null
    createdAt: Date
  }>
  prochains_evenements: Array<{
    id: string
    title: string
    date: Date | null
    client: { id: string; name: string }
  }>
  activite_recente: Array<{
    id: string
    action: string
    entityType: string
    description: string
    createdAt: Date
    user: { firstName: string; lastName: string }
  }>
  taches_du_jour: Array<{
    id: string
    title: string
    dueDate: Date | null
    assignee: { firstName: string; lastName: string } | null
  }>
}

async function loadDashboard(): Promise<DashboardData> {
  const empty: DashboardData = {
    ca_mois_courant: 0,
    ca_mois_precedent: 0,
    projets_en_cours: 0,
    factures_impayees_count: 0,
    factures_impayees_total: 0,
    inscriptions_en_attente: 0,
    leads_cette_semaine: 0,
    ca_par_mois: [],
    derniers_leads: [],
    prochains_evenements: [],
    activite_recente: [],
    taches_du_jour: [],
  }

  try {
    const now = new Date()
    const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const startPrevious = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const start12 = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const weekStart = (() => {
      const d = new Date(now)
      const day = d.getDay()
      d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
      d.setHours(0, 0, 0, 0)
      return d
    })()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const MONTHS = [
      "Jan",
      "Fev",
      "Mar",
      "Avr",
      "Mai",
      "Juin",
      "Juil",
      "Aout",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]

    const [
      caCurrent,
      caPrevious,
      formationsCurrent,
      formationsPrevious,
      formations12,
      projets,
      facturesImpayees,
      inscriptions,
      leads,
      facturesPaid12,
      leadsList,
      evenements,
      activite,
      taches,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { totalTtc: true },
        where: {
          status: "payee",
          paidAt: { gte: startCurrentMonth, lt: endCurrentMonth },
        },
      }),
      prisma.invoice.aggregate({
        _sum: { totalTtc: true },
        where: {
          status: "payee",
          paidAt: { gte: startPrevious, lt: startCurrentMonth },
        },
      }),
      prisma.trainingRegistration.findMany({
        where: {
          status: "confirme",
          confirmedAt: { gte: startCurrentMonth, lt: endCurrentMonth },
        },
        select: { amountPaid: true, session: { select: { price: true } } },
      }),
      prisma.trainingRegistration.findMany({
        where: {
          status: "confirme",
          confirmedAt: { gte: startPrevious, lt: startCurrentMonth },
        },
        select: { amountPaid: true, session: { select: { price: true } } },
      }),
      prisma.trainingRegistration.findMany({
        where: { status: "confirme", confirmedAt: { gte: start12 } },
        select: {
          confirmedAt: true,
          amountPaid: true,
          session: { select: { price: true } },
        },
      }),
      prisma.project.count({
        where: { status: { in: ["confirme", "en_cours"] } },
      }),
      prisma.invoice.aggregate({
        _sum: { totalTtc: true },
        _count: true,
        where: {
          status: { in: ["emise", "partiellement_payee"] },
          type: { not: "avoir" },
        },
      }),
      prisma.trainingRegistration.count({ where: { status: "en_attente" } }),
      prisma.client.count({
        where: {
          acquisitionChannel: "site_web",
          createdAt: { gte: weekStart },
        },
      }),
      prisma.invoice.findMany({
        where: {
          status: "payee",
          paidAt: { gte: start12 },
          type: { not: "avoir" },
        },
        select: { totalTtc: true, paidAt: true },
      }),
      prisma.client.findMany({
        where: { acquisitionChannel: "site_web" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          name: true,
          organization: true,
          notes: true,
          createdAt: true,
        },
      }),
      prisma.project.findMany({
        where: {
          date: { gte: now },
          status: { in: ["confirme", "en_cours"] },
        },
        orderBy: { date: "asc" },
        take: 3,
        include: { client: { select: { id: true, name: true } } },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      prisma.task.findMany({
        where: {
          completed: false,
          OR: [{ dueDate: null }, { dueDate: { lte: endOfDay } }],
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
        take: 3,
        include: {
          assignee: { select: { firstName: true, lastName: true } },
        },
      }),
    ])

    const sumFormations = (
      rows: { amountPaid: number | null; session: { price: number } }[]
    ) => rows.reduce((s, r) => s + (r.amountPaid ?? r.session.price), 0)
    const recettesMoisCourant =
      (caCurrent._sum.totalTtc ?? 0) + sumFormations(formationsCurrent)
    const recettesMoisPrecedent =
      (caPrevious._sum.totalTtc ?? 0) + sumFormations(formationsPrevious)

    const series: RevenuePoint[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      series.push({ mois: MONTHS[d.getMonth()], ca: 0 })
    }
    for (const inv of facturesPaid12) {
      if (!inv.paidAt) continue
      const monthsAgo =
        (now.getFullYear() - inv.paidAt.getFullYear()) * 12 +
        (now.getMonth() - inv.paidAt.getMonth())
      const idx = 11 - monthsAgo
      if (idx >= 0 && idx < 12) series[idx].ca += inv.totalTtc
    }
    for (const f of formations12) {
      if (!f.confirmedAt) continue
      const monthsAgo =
        (now.getFullYear() - f.confirmedAt.getFullYear()) * 12 +
        (now.getMonth() - f.confirmedAt.getMonth())
      const idx = 11 - monthsAgo
      if (idx >= 0 && idx < 12) {
        series[idx].ca += f.amountPaid ?? f.session.price
      }
    }

    return {
      ca_mois_courant: recettesMoisCourant,
      ca_mois_precedent: recettesMoisPrecedent,
      projets_en_cours: projets,
      factures_impayees_count: facturesImpayees._count ?? 0,
      factures_impayees_total: facturesImpayees._sum.totalTtc ?? 0,
      inscriptions_en_attente: inscriptions,
      leads_cette_semaine: leads,
      ca_par_mois: series,
      derniers_leads: leadsList,
      prochains_evenements: evenements,
      activite_recente: activite,
      taches_du_jour: taches,
    }
  } catch (error) {
    console.warn("[admin home] DB indisponible", error)
    return empty
  }
}

function formatRelative(date: Date) {
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "a l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date)
}

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "JS"
  )
}

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions)
  const data = await loadDashboard()

  const trend =
    data.ca_mois_precedent > 0
      ? {
          value:
            ((data.ca_mois_courant - data.ca_mois_precedent) /
              data.ca_mois_precedent) *
            100,
          positive: data.ca_mois_courant >= data.ca_mois_precedent,
        }
      : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Bienvenue {session?.user?.name ?? session?.user?.email}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="CA du mois"
          value={formatAmount(data.ca_mois_courant)}
          Icon={TrendingUp}
          accent="green"
          trend={trend}
        />
        <KpiCard
          title="Projets en cours"
          value={data.projets_en_cours}
          subtitle="Confirmes + En cours"
          Icon={FolderKanban}
          accent="blue"
        />
        <KpiCard
          title="Factures impayees"
          value={data.factures_impayees_count}
          subtitle={formatAmount(data.factures_impayees_total)}
          Icon={AlertCircle}
          accent="red"
        />
        <KpiCard
          title="Inscriptions en attente"
          value={data.inscriptions_en_attente}
          subtitle="Formations a confirmer"
          Icon={GraduationCap}
          accent="yellow"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">
              Chiffre d&apos;affaires - 12 derniers mois
            </h2>
            <span className="text-xs text-zinc-500">
              Factures payees + formations confirmees
            </span>
          </div>
          <RevenueChart data={data.ca_par_mois} />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">
              Derniers leads
            </h2>
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
              <UserPlus className="h-3.5 w-3.5" />
              {data.leads_cette_semaine} cette semaine
            </span>
          </div>
          {data.derniers_leads.length === 0 ? (
            <p className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-xs text-zinc-500">
              Aucun lead recu pour le moment.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.derniers_leads.map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/admin/clients/${lead.id}`}
                    className="flex items-start gap-3 rounded-md border border-zinc-100 p-3 transition-colors hover:bg-zinc-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C8151B] text-xs font-semibold text-white">
                      {initialsOf(lead.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {lead.name}
                      </p>
                      {lead.organization && (
                        <p className="truncate text-xs text-zinc-500">
                          {lead.organization}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                        {formatRelative(lead.createdAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">
            Prochains evenements
          </h2>
          {data.prochains_evenements.length === 0 ? (
            <p className="mt-3 rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-xs text-zinc-500">
              Aucun evenement a venir.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.prochains_evenements.map((ev) => (
                <li key={ev.id}>
                  <Link
                    href={`/admin/projets/${ev.id}`}
                    className="block rounded-md border border-zinc-100 p-3 transition-colors hover:bg-zinc-50"
                  >
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {ev.title}
                    </p>
                    <p className="text-xs text-zinc-500">{ev.client.name}</p>
                    <p className="mt-1 text-xs font-semibold text-[#C8151B]">
                      {formatDate(ev.date)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">
            Activite recente
          </h2>
          {data.activite_recente.length === 0 ? (
            <p className="mt-3 rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-xs text-zinc-500">
              Aucune activite.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.activite_recente.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start gap-2 rounded-md border border-zinc-100 p-3"
                >
                  <span
                    className={
                      log.action === "CREATE"
                        ? "mt-0.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                        : log.action === "DELETE"
                          ? "mt-0.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-red-500"
                          : "mt-0.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-blue-500"
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-700">{log.description}</p>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                      {log.user.firstName} {log.user.lastName} -{" "}
                      {formatRelative(log.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">
              Taches du jour
            </h2>
            <Link
              href="/admin/journal"
              className="text-xs font-semibold text-[#C8151B] hover:underline"
            >
              Voir toutes
            </Link>
          </div>
          {data.taches_du_jour.length === 0 ? (
            <p className="mt-3 rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-xs text-zinc-500">
              Pas de tache pour aujourd&apos;hui.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.taches_du_jour.map((t) => (
                <li
                  key={t.id}
                  className="rounded-md border border-zinc-100 p-3"
                >
                  <p className="text-sm font-medium text-zinc-900">
                    {t.title}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-400">
                    {t.dueDate
                      ? `Echeance : ${formatDate(t.dueDate)}`
                      : "Sans echeance"}
                    {t.assignee
                      ? ` - ${t.assignee.firstName} ${t.assignee.lastName}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
