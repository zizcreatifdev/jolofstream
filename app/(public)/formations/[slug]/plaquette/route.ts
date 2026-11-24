import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "no-store" }

// Lien public stable de la plaquette d'un programme :
// /formations/[slug]/plaquette           telechargement (nom de fichier choisi)
// /formations/[slug]/plaquette?mode=view affichage dans le navigateur
// 404 si le programme est masque ou la plaquette non publiee.
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const program = await prisma.trainingProgram
    .findUnique({
      where: { slug: params.slug },
      select: {
        published: true,
        brochurePublished: true,
        brochureUrl: true,
        brochureFileName: true,
        slug: true,
      },
    })
    .catch(() => null)

  if (!program || !program.published || !program.brochurePublished || !program.brochureUrl) {
    return new NextResponse("Plaquette introuvable", {
      status: 404,
      headers: { ...NO_STORE, "Content-Type": "text/plain; charset=utf-8" },
    })
  }

  const target = new URL(program.brochureUrl)
  if (req.nextUrl.searchParams.get("mode") !== "view") {
    target.searchParams.set("download", program.brochureFileName || `${program.slug}.pdf`)
  }
  return NextResponse.redirect(target.toString(), { status: 302, headers: NO_STORE })
}
