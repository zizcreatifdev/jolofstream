"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight text-white">
            Jolof <span className="text-[#C8151B]">Stream</span>
          </span>
          <p className="text-zinc-400 text-sm mt-1">Espace administration</p>
        </div>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">Connexion</CardTitle>
            <CardDescription className="text-zinc-400">
              Acces reserve aux cofondateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@jolofstream.com"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#C8151B]"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-200">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#C8151B]"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-red-400 text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>
              {error && (
                <div className="bg-red-950 border border-red-800 rounded-md px-3 py-2">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C8151B] hover:bg-[#a01015] text-white font-medium"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
              <div className="text-center">
                <a
                  href="/admin/login?reset=true"
                  className="text-zinc-500 text-sm hover:text-[#F5B800] transition-colors"
                >
                  Mot de passe oublie ?
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
