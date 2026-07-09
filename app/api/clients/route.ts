import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CSV_BOM, formatCsv } from "@/lib/csv-export"
import {
  acquisitionLabels,
  clientStatusLabels,
  clientTypeLabels,
  type AcquisitionChannel,
  type ClientStatus,
  type ClientType,
} from "@/lib/clients"

const clientSchema = z.object({
  type: z.enum(["entreprise", "particulier", "createur", "association"]),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  organization: z.string().optional(),
  acquisitionChannel: z.string().optional(),
  status: z
    .enum(["prospect", "client", "actif", "inactif", "vip"])
    .default("prospect"),
  tvaExempt: z.boolean().default(false),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 500

function buildWhere(searchParams: URLSearchParams) {
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? ""
  const type = searchParams.get("type") ?? ""
  return {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              {
                organization: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {},
      status ? { status } : {},
      type ? { type } : {},
    ],
  }
}

function formatFrDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") ?? ""
    const where = buildWhere(searchParams)

    if (format === "csv") {
      const clients = await prisma.client.findMany({
        where,
        orderBy: { createdAt: "desc" },
      })
      const header = [
        "Nom",
        "Email",
        "Telephone",
        "Type",
        "Statut",
        "Canal acquisition",
        "Organisation",
        "Tags",
        "Date creation",
      ]
      const rows: (string | number)[][] = [header]
      for (const c of clients) {
        rows.push([
          c.name,
          c.email ?? "",
          c.phone ?? "",
          clientTypeLabels[c.type as ClientType] ?? c.type,
          clientStatusLabels[c.status as ClientStatus] ?? c.status,
          c.acquisitionChannel
            ? acquisitionLabels[c.acquisitionChannel as AcquisitionChannel] ??
              c.acquisitionChannel
            : "",
          c.organization ?? "",
          (c.tags ?? []).join(", "),
          formatFrDate(c.createdAt),
        ])
      }
      const csv = CSV_BOM + formatCsv(rows)
      const filename = `clients-${new Date().toISOString().slice(0, 10)}.csv`
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv;charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      })
    }

    const pageRaw = Number(searchParams.get("page") ?? "1")
    const limitRaw = Number(searchParams.get("limit") ?? String(DEFAULT_LIMIT))
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(MAX_LIMIT, Math.floor(limitRaw))
        : DEFAULT_LIMIT
    const skip = (page - 1) * limit

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: { projects: true, quotes: true, invoices: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ])

    return NextResponse.json({
      clients,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.error("[api/clients GET]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = clientSchema.parse(body)

    const client = await prisma.client.create({ data })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "Client",
        entityId: client.id,
        description: `Client cree : ${client.name}`,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", issues: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error("[api/clients POST]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
