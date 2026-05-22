import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  try {
    const contacts = await prisma.marketingContact.findMany({
      where: { unsubscribed: false },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    })

    const header = [
      "Email",
      "Prenom",
      "Nom",
      "Listes",
      "Client",
      "Date inscription",
    ]
    const lines = [header.map(csvEscape).join(";")]
    for (const c of contacts) {
      lines.push(
        [
          c.email,
          c.firstName ?? "",
          c.lastName ?? "",
          (c.lists ?? []).join("|"),
          c.client?.name ?? "",
          formatDate(c.createdAt),
        ]
          .map((v) => csvEscape(String(v ?? "")))
          .join(";")
      )
    }
    const csv = lines.join("\n")
    const filename = `contacts-marketing-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`

    return new NextResponse("﻿" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[api/marketing/contacts/export]", error)
    return NextResponse.json(
      { error: "Erreur d'export" },
      { status: 500 }
    )
  }
}
