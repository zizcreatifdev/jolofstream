import type { PageHeroFocal } from "@/lib/site-content"

// Rendu commun des en-têtes de page avec image (site public et aperçu admin).
// Fichier dans components/ : les classes arbitraires doivent être vues par
// Tailwind (lib/ n'est pas analysé).

// Voile de lisibilité (D-205, D-216) : contraste AA du surtitre, du titre et
// du chapeau vérifié sur une image blanche, ainsi que pour la navigation
// placée en haut de l'image
export const PAGE_HERO_SCRIM =
  "bg-[linear-gradient(to_top,rgba(5,3,3,0.94)_0%,rgba(5,3,3,0.84)_55%,rgba(5,3,3,0.72)_100%)]"

export const PAGE_HERO_POSITION: Record<PageHeroFocal, string> = {
  top: "object-top",
  center: "object-center",
  bottom: "object-bottom",
}
