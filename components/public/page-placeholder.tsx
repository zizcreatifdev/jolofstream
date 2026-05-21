import Link from "next/link"

export function PagePlaceholder({
  title,
  intro,
  prompt,
}: {
  title: string
  intro: string
  prompt: string
}) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wider text-zinc-600">
          {prompt}
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-zinc-600 md:text-lg">
          {intro}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Retour a l&apos;accueil
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-[#C8151B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a01015]"
          >
            Demander un devis
          </Link>
        </div>
      </div>
    </section>
  )
}
