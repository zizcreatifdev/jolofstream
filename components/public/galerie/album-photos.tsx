"use client"

import { useState } from "react"

import type { PublicPhoto } from "@/lib/gallery-public"
import { PhotoViewer } from "@/components/public/galerie/photo-viewer"

// Grille d'un album en colonnes CSS (aucun recadrage) : miniatures servies
// telles quelles, en chargement différé, avec largeur et hauteur pour éviter
// les décalages. Chaque photo ouvre la visionneuse.
export function AlbumPhotos({ photos, albumTitle }: { photos: PublicPhoto[]; albumTitle: string }) {
  const [index, setIndex] = useState<number | null>(null)
  return (
    <>
      <ul className="columns-1 gap-4 min-[560px]:columns-2 min-[1000px]:columns-3">
        {photos.map((photo, i) => {
          const scale = Math.min(1, 800 / Math.max(photo.width, photo.height))
          return (
            <li key={photo.id} className="mb-4 break-inside-avoid">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-haspopup="dialog"
                className="group relative block w-full overflow-hidden rounded-md bg-cine-bg3"
              >
                <span className="sr-only">Agrandir : </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbUrl}
                  alt={photo.alt}
                  width={Math.round(photo.width * scale)}
                  height={Math.round(photo.height * scale)}
                  loading={i < 3 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </button>
            </li>
          )
        })}
      </ul>
      <PhotoViewer photos={photos} index={index} albumTitle={albumTitle} onChange={setIndex} onClose={() => setIndex(null)} />
    </>
  )
}
