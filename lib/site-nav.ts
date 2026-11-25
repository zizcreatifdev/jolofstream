// Navigation et "scenes" du site public (en-tete, menu, transition)

export type SiteScene = { number: string; label: string }

type SceneRoute = SiteScene & { path: string }

// Ordre de navigation : le numéro de scène en découle (HUD, surtitres)
const SCENE_ORDER: Array<{ path: string; label: string }> = [
  { path: "/", label: "ACCUEIL" },
  { path: "/services", label: "SERVICES" },
  { path: "/formations", label: "FORMATIONS" },
  { path: "/portfolio", label: "PORTFOLIO" },
  { path: "/galerie", label: "GALERIE" },
  { path: "/a-propos", label: "À PROPOS" },
  { path: "/contact", label: "CONTACT" },
  { path: "/mentions-legales", label: "MENTIONS LÉGALES" },
  { path: "/cgv", label: "CGV" },
]

const SCENE_ROUTES: SceneRoute[] = SCENE_ORDER.map((r, i) => ({ ...r, number: String(i + 1).padStart(2, "0") }))

function matches(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/"
  return pathname === path || pathname.startsWith(`${path}/`)
}

// Scene d'une URL ; null hors des pages connues (aucun libelle affiche)
export function sceneFor(pathname: string): SiteScene | null {
  if (matches(pathname, "/formations/reserver")) {
    const formations = SCENE_ROUTES.find((r) => r.path === "/formations")
    return { number: formations?.number ?? "03", label: "RÉSERVATION" }
  }
  const route = SCENE_ROUTES.find((r) => matches(pathname, r.path))
  return route ? { number: route.number, label: route.label } : null
}

export function sceneText(scene: SiteScene): string {
  return `SCÈNE ${scene.number} · ${scene.label}`
}

// Libellé de scène en casse normale (« À propos »), repli du surtitre vide
export function sceneLabel(slug: string): string {
  const route = SCENE_ROUTES.find((r) => r.path === `/${slug}`)
  if (!route) return ""
  const lower = route.label.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

// Surtitre d'une page : « Scène NN · surtitre » (numéro calculé)
export function sceneKicker(pathname: string, kicker: string | null | undefined): string {
  const scene = sceneFor(pathname)
  const text = kicker?.trim() ?? ""
  if (!scene) return text
  return text ? `Scène ${scene.number} · ${text}` : `Scène ${scene.number}`
}

// "Formations" reste actif sur toutes les URL qui commencent par /formations
export function isNavActive(pathname: string, href: string): boolean {
  return matches(pathname, href)
}

export const MAIN_NAV = [
  { href: "/services", label: "Services" },
  { href: "/formations", label: "Formations" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/galerie", label: "Galerie" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
] as const

export const MENU_NAV = [{ href: "/", label: "Accueil" }, ...MAIN_NAV].map(
  (item, index) => ({ ...item, number: String(index + 1).padStart(2, "0") })
)

// Chapitres de /services (ancres des offres, utilisees par le pied de page)
export const SERVICE_CHAPTERS = [
  { href: "/services#captation-streaming-live", label: "Captation et streaming" },
  { href: "/services#ceo-content-package", label: "CEO Content" },
  { href: "/services#creator-weekend", label: "Creator Weekend" },
  { href: "/services#gestion-reseaux", label: "Publication réseaux" },
] as const
