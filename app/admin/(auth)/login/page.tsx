"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, type Variants } from "framer-motion"
import { AlertCircle, Eye, EyeOff, Loader2, Lock } from "lucide-react"

import { Logo } from "@/components/admin/logo"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
})

type LoginForm = z.infer<typeof loginSchema>

const formContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const formItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
}

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError("Email ou mot de passe incorrect")
    } else {
      router.push("/admin")
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* COLONNE GAUCHE (desktop) */}
      <aside className="relative hidden h-screen flex-col justify-between overflow-hidden bg-[#161110] p-12 text-white lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_15%,rgba(200,21,27,0.28),transparent_60%),radial-gradient(ellipse_40%_40%_at_10%_85%,rgba(245,184,0,0.08),transparent_50%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative">
          <Logo variant="blancJaune" width={160} height={48} href="/" />
        </div>

        <div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="font-display font-normal leading-[1.1] tracking-tight text-white"
            style={{ fontSize: "clamp(32px, 3vw, 48px)" }}
          >
            Capturez l&apos;instant,
            <br />
            <span className="italic text-[#F5B800]">
              diffusez l&apos;emotion.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: "easeOut" as const,
            }}
            className="mt-6 max-w-[360px] text-[15px] font-light leading-relaxed text-white/40"
          >
            La plateforme de gestion Jolof Stream. Reservee aux cofondateurs.
          </motion.p>
        </div>

        <div className="relative border-t border-white/[0.06] pt-6">
          <div className="grid grid-cols-3 gap-8">
            <Stat value="+200" label="evenements" />
            <Stat value="HD" label="qualite" />
            <Stat value="Dakar" label="base" />
          </div>
        </div>
      </aside>

      {/* COLONNE DROITE (formulaire) */}
      <section
        className={cn(
          "flex h-screen items-center overflow-y-auto px-6 py-12",
          "bg-[#161110] text-white lg:bg-[#FAF8F5] lg:text-ink"
        )}
      >
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="mx-auto w-full max-w-[440px]"
        >
          <motion.div
            variants={formContainer}
            initial="hidden"
            animate="show"
          >
            {/* Logo mobile uniquement */}
            <motion.div variants={formItem} className="mb-10 lg:hidden">
              <Logo variant="blancJaune" width={140} height={42} href="/" />
            </motion.div>

            {/* Eyebrow */}
            <motion.div
              variants={formItem}
              className="mb-4 flex items-center gap-3"
            >
              <span aria-hidden className="block h-px w-4 bg-[#C8151B]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C8151B]">
                Espace administration
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              variants={formItem}
              className={cn(
                "font-display font-normal leading-[1.1] tracking-tight",
                "text-white lg:text-ink"
              )}
              style={{ fontSize: "32px" }}
            >
              Bon retour
              <em className="italic text-[#C8151B] [font-style:italic]">
                {" "}
                parmi nous.
              </em>
            </motion.h1>

            {/* Sous-titre */}
            <motion.p
              variants={formItem}
              className={cn(
                "mt-2 text-sm font-light",
                "text-white/40 lg:text-ink-3"
              )}
            >
              Connectez-vous pour acceder au dashboard.
            </motion.p>

            {/* Formulaire */}
            <motion.form
              variants={formItem}
              onSubmit={handleSubmit(onSubmit)}
              className="mt-10 space-y-5"
              noValidate
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className={cn(
                    "mb-2 block text-[13px] font-semibold tracking-snug",
                    "text-white/80 lg:text-ink-2"
                  )}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@jolofstream.com"
                  {...register("email")}
                  className={cn(
                    "w-full rounded-[10px] px-4 py-3.5 text-sm font-normal outline-none transition-all duration-150",
                    "border bg-white/[0.04] border-white/15 text-white placeholder:text-white/30",
                    "focus:border-[#C8151B] focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(200,21,27,0.18)]",
                    "lg:border-[rgba(22,17,16,0.12)] lg:bg-white lg:text-ink lg:placeholder:text-ink-4",
                    "lg:focus:border-[#C8151B] lg:focus:shadow-[0_0_0_3px_rgba(200,21,27,0.08)]"
                  )}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400 lg:text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password avec toggle */}
              <div>
                <label
                  htmlFor="password"
                  className={cn(
                    "mb-2 block text-[13px] font-semibold tracking-snug",
                    "text-white/80 lg:text-ink-2"
                  )}
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="********"
                    {...register("password")}
                    className={cn(
                      "w-full rounded-[10px] px-4 py-3.5 pr-12 text-sm font-normal outline-none transition-all duration-150",
                      "border bg-white/[0.04] border-white/15 text-white placeholder:text-white/30",
                      "focus:border-[#C8151B] focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(200,21,27,0.18)]",
                      "lg:border-[rgba(22,17,16,0.12)] lg:bg-white lg:text-ink lg:placeholder:text-ink-4",
                      "lg:focus:border-[#C8151B] lg:focus:shadow-[0_0_0_3px_rgba(200,21,27,0.08)]"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    className={cn(
                      "absolute right-4 top-1/2 -translate-y-1/2 transition-colors",
                      "text-white/40 hover:text-white lg:text-ink-4 lg:hover:text-ink"
                    )}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400 lg:text-red-600">
                    {errors.password.message}
                  </p>
                )}
                <div className="mt-2 text-right">
                  <a
                    href="/admin/login?reset=true"
                    className={cn(
                      "text-[13px] transition-colors",
                      "text-white/40 hover:text-[#F5B800] lg:text-ink-4 lg:hover:text-[#C8151B]"
                    )}
                  >
                    Mot de passe oublie ?
                  </a>
                </div>
              </div>

              {/* Message erreur */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex items-center gap-3 rounded-[10px] border px-4 py-3",
                    "border-red-500/20 bg-red-500/10 lg:border-red-100 lg:bg-red-50"
                  )}
                >
                  <AlertCircle
                    className="h-4 w-4 shrink-0 text-red-400 lg:text-red-500"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm font-medium text-red-300 lg:text-red-600">
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Bouton submit */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#C8151B] px-5 py-3.5 text-[15px] font-semibold text-white transition-all duration-150",
                  "hover:-translate-y-px hover:bg-[#8F0E12] hover:shadow-[0_8px_24px_rgba(200,21,27,0.3)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8151B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161110] lg:focus-visible:ring-offset-[#FAF8F5]",
                  "disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </button>
            </motion.form>

            {/* Pied de page */}
            <motion.div
              variants={formItem}
              className={cn(
                "mt-8 border-t pt-6",
                "border-white/[0.06] lg:border-[rgba(22,17,16,0.06)]"
              )}
            >
              <p
                className={cn(
                  "flex items-center justify-center gap-2 text-xs font-light",
                  "text-white/40 lg:text-ink-4"
                )}
              >
                <Lock className="h-3 w-3" strokeWidth={1.5} />
                Acces securise - Session de 7 jours
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl leading-none text-white">{value}</p>
      <p className="mt-2 text-xs font-light text-white/30">{label}</p>
    </div>
  )
}
