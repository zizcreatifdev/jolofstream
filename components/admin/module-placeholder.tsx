export function ModulePlaceholder({
  title,
  prompt,
  description,
}: {
  title: string
  prompt: string
  description: string
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
      <p className="mt-1 text-zinc-500">{description}</p>
      <p className="mt-4 text-sm text-zinc-400">
        Module en cours de developpement - {prompt}
      </p>
    </div>
  )
}
