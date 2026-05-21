"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Pencil, PlusCircle, Star, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  OfferForm,
  type OfferFormInitial,
} from "@/components/admin/catalogue/offer-form"
import { cn } from "@/lib/utils"

type Offer = {
  id: string
  serviceType: "ceo_content" | "creator_weekend"
  name: string
  price: number | null
  priceLabel: string | null
  features: string[]
  isPopular: boolean
  displayOrder: number
  active: boolean
}

type Grouped = {
  ceo_content: Offer[]
  creator_weekend: Offer[]
}

const sectionLabels = {
  ceo_content: "CEO Content Package",
  creator_weekend: "Creator Weekend",
} as const

function formatPrice(price: number | null, label: string | null) {
  if (price === null || price === undefined) return "Sur devis"
  const formatted =
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(price) + " FCFA"
  return label ? `${formatted} ${label}` : formatted
}

export function CatalogueBoard() {
  const [data, setData] = useState<Grouped | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formInitial, setFormInitial] = useState<OfferFormInitial | undefined>(
    undefined
  )
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch("/api/catalogue", { cache: "no-store" })
      if (!r.ok) throw new Error("Erreur de chargement")
      const json = (await r.json()) as Grouped
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
      setData({ ceo_content: [], creator_weekend: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const handler = () => {
      setFormInitial(undefined)
      setFormOpen(true)
    }
    window.addEventListener("admin:primary-action", handler)
    return () => window.removeEventListener("admin:primary-action", handler)
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/catalogue/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!r.ok) {
        const j = await r.json().catch(() => null)
        setError(
          (j && typeof j.error === "string" && j.error) ||
            "Suppression impossible."
        )
      } else {
        setDeleteTarget(null)
        fetchData()
      }
    } catch {
      setError("Connexion impossible.")
    } finally {
      setDeleting(false)
    }
  }

  const sections: Array<keyof Grouped> = ["ceo_content", "creator_weekend"]

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-dashed border-[#F5B800] bg-[#F5B800]/10 px-4 py-3 text-sm text-zinc-700">
        Ces forfaits s&apos;affichent en temps reel sur le site public{" "}
        <span className="font-semibold">/services</span>. Toute modification
        est visible immediatement (revalidation 60s).
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {sections.map((section) => {
        const items = data?.[section] ?? []
        return (
          <section key={section}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">
                {sectionLabels[section]}
              </h2>
              <Button
                size="sm"
                onClick={() => {
                  setFormInitial({
                    serviceType: section,
                    priceLabel:
                      section === "ceo_content" ? "par mois" : "par session",
                    displayOrder: items.length + 1,
                  })
                  setFormOpen(true)
                }}
                className="bg-[#C8151B] text-white hover:bg-[#a01015]"
              >
                <PlusCircle className="mr-1.5 h-4 w-4" /> Ajouter un forfait
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-2xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-10 text-center text-sm text-zinc-500">
                Aucun forfait pour {sectionLabels[section]}.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((offer) => (
                  <article
                    key={offer.id}
                    className={cn(
                      "flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm",
                      offer.isPopular
                        ? "border-[#C8151B] ring-1 ring-[#C8151B]"
                        : "border-zinc-200",
                      !offer.active && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">
                          {offer.name}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          Ordre {offer.displayOrder}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {offer.isPopular && (
                          <span className="inline-flex items-center rounded-full bg-[#C8151B] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                            <Star className="mr-1 h-3 w-3 fill-current" />
                            Populaire
                          </span>
                        )}
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            offer.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-200 text-zinc-600"
                          )}
                        >
                          {offer.active ? "Actif" : "Masque"}
                        </span>
                      </div>
                    </div>

                    <p
                      className={cn(
                        "mt-3 text-2xl font-bold",
                        offer.isPopular ? "text-[#C8151B]" : "text-zinc-900"
                      )}
                    >
                      {formatPrice(offer.price, offer.priceLabel)}
                    </p>

                    <ul className="mt-4 flex-1 space-y-2 text-sm text-zinc-700">
                      {offer.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              offer.isPopular ? "text-[#C8151B]" : "text-zinc-500"
                            )}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex items-center gap-2 border-t border-zinc-100 pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormInitial({
                            id: offer.id,
                            serviceType: offer.serviceType,
                            name: offer.name,
                            price: offer.price,
                            priceLabel: offer.priceLabel,
                            features: offer.features,
                            isPopular: offer.isPopular,
                            displayOrder: offer.displayOrder,
                            active: offer.active,
                          })
                          setFormOpen(true)
                        }}
                      >
                        <Pencil className="mr-1.5 h-4 w-4" /> Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(offer)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" /> Supprimer
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )
      })}

      <OfferForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={formInitial}
        onSaved={fetchData}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce forfait ?</DialogTitle>
            <DialogDescription>
              L&apos;offre sera retiree immediatement du site public.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm text-zinc-700">
              <span className="font-semibold">{deleteTarget.name}</span>
              <span className="block text-zinc-500">
                {sectionLabels[deleteTarget.serviceType]}
              </span>
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
