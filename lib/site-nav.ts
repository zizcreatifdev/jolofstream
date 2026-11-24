// Navigation et "scenes" du site public (en-tete, menu, transition)

export type SiteScene = { number: string; label: string }

type SceneRoute = SiteScene & { path: string }

const SCENE_ROUTES: SceneRoute[] = [
  { path: "/", number: "01", label: "ACCUEIL" },
  { path: "/services", number: "02", label: "SERVICES" },
  { path: "/formations", number: "03", label: "FORMATIONS" },
  { path: "/portfolio", number: "04", label: "PORTFOLIO" },
  { path: "/a-propos", number: "05", label: "À PROPOS" },
  { path: "/contact", number: "06", label: "CONTACT" },
  { path: "/mentions-legales", number: "07", label: "MENTIONS LÉGALES" },
  { path: "/cgv", number: "08", label: "CGV" },
]

function matches(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/"
  return pathname === path || pathname.startsWith(`${path}/`)
}

// Scene d'une URL ; null hors des pages connues (aucun libelle affiche)
export function sceneFor(pathname: string): SiteScene | null {
  if (matches(pathname, "/formations/reserver")) {
    return { number: "03", label: "RÉSERVATION" }
  }
  const route = SCENE_ROUTES.find((r) => matches(pathname, r.path))
  return route ? { number: route.number, label: route.label } : null
}

export function sceneText(scene: SiteScene): string {
  return `SCÈNE ${scene.number} · ${scene.label}`
}

// "Formations" reste actif sur toutes les URL qui commencent par /formations
export function isNavActive(pathname: string, href: string): boolean {
  return matches(pathname, href)
}

export const MAIN_NAV = [
  { href: "/services", label: "Services" },
  { href: "/formations", label: "Formations" },
  { href: "/portfolio", label: "Portfolio" },
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
