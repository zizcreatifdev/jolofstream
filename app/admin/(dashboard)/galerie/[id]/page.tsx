import { prisma } from "@/lib/prisma"
import { AlbumEditor } from "@/components/admin/galerie/album-editor"

export const dynamic = "force-dynamic"

export default async function AlbumPage({ params }: { params: { id: string } }) {
  const programs = await prisma.trainingProgram.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  })
  return (
    <AlbumEditor albumId={params.id} programs={programs} />
  )
}
