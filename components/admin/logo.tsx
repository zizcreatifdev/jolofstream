"use client"

import Image from "next/image"
import Link from "next/link"

type LogoVariant = "couleur" | "blanc" | "blancJaune"

interface LogoProps {
  variant?: LogoVariant
  width?: number
  height?: number
  href?: string
  className?: string
}

export function Logo({
  variant = "blancJaune",
  width = 140,
  height = 42,
  href = "/admin",
  className = "",
}: LogoProps) {
  const src = `/logos/Logo_JolofStream_${variant}.png`

  const img = (
    <Image
      src={src}
      alt="Jolof Stream"
      width={width}
      height={height}
      className={className}
      priority
      onError={(e) => {
        const target = e.target as HTMLImageElement
        target.style.display = "none"
      }}
    />
  )

  if (href) {
    return <Link href={href}>{img}</Link>
  }

  return img
}
