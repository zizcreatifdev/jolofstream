import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CGV",
  description:
    "Conditions generales de vente applicables aux prestations Jolof Stream.",
}

export const revalidate = 60

async function getContent() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/parametres/cgv_content`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { value?: string | null }
    return data.value ?? null
  } catch {
    return null
  }
}

export default async function CgvPage() {
  const content =
    (await getContent()) ||
    "Conditions Generales de Vente - Jolof Stream\n\nA completer juridiquement avant publication."

  return (
    <article className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
          Conditions Generales de Vente
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Editable depuis Parametres &gt; CGV et Mentions
        </p>
        <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-zinc-700">
          {content}
        </div>
      </div>
    </article>
  )
}
