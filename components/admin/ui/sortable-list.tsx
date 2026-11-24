"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Liste reordonnable : glisser-deposer HTML5 sur bureau, fleches pour le
// clavier et le mobile. onMove(from, to) recoit les positions.
export function SortableList<T>({
  items,
  getKey,
  onMove,
  renderItem,
  label,
  itemLabel,
  actions,
  className,
}: {
  items: T[]
  getKey: (item: T, index: number) => string
  onMove: (from: number, to: number) => void
  renderItem: (item: T, index: number) => React.ReactNode
  label: string
  itemLabel: string
  actions?: (item: T, index: number) => React.ReactNode
  className?: string
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  return (
    <ol className={cn("space-y-2", className)} aria-label={label}>
      {items.map((item, i) => (
        <li
          key={getKey(item, i)}
          draggable
          onDragStart={(e) => {
            // Glisser seulement depuis la poignee ou le fond, pas depuis un champ
            const target = e.target as HTMLElement
            if (target.closest("input, textarea, select, [contenteditable=true]")) {
              e.preventDefault()
              return
            }
            setDragIndex(i)
            e.dataTransfer.effectAllowed = "move"
          }}
          onDragOver={(e) => {
            if (dragIndex === null) return
            e.preventDefault()
            setOverIndex(i)
          }}
          onDragLeave={() => setOverIndex((o) => (o === i ? null : o))}
          onDrop={(e) => {
            e.preventDefault()
            if (dragIndex !== null && dragIndex !== i) onMove(dragIndex, i)
            setDragIndex(null)
            setOverIndex(null)
          }}
          onDragEnd={() => {
            setDragIndex(null)
            setOverIndex(null)
          }}
          className={cn(
            "flex items-start gap-2 rounded-lg border bg-white p-3",
            overIndex === i && dragIndex !== i ? "border-zinc-900" : "border-zinc-200",
            dragIndex === i && "opacity-50"
          )}
        >
          <GripVertical className="mt-2 h-5 w-5 shrink-0 cursor-grab text-zinc-400" aria-hidden="true" />
          <span className="mt-2 w-5 shrink-0 text-sm font-semibold text-zinc-500">{i + 1}</span>
          <div className="min-w-0 flex-1">{renderItem(item, i)}</div>
          <div className="flex shrink-0 flex-wrap items-start gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onMove(i, i - 1)}
              disabled={i === 0}
              aria-label={`Monter ${itemLabel} ${i + 1}`}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onMove(i, i + 1)}
              disabled={i === items.length - 1}
              aria-label={`Descendre ${itemLabel} ${i + 1}`}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            {actions?.(item, i)}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
