"use client"

import { useEffect, useState } from "react"

export type PdfCompany = {
  companyName?: string
  companyAddress?: string
  companyEmail?: string
  companyPhone?: string
  companyNinea?: string
  companyRc?: string
  pdfFooterText?: string
}

const KEYS =
  "company_name,company_address,company_email,company_phone,company_ninea,company_rc,pdf_footer_text"

export function usePdfCompany(): PdfCompany {
  const [company, setCompany] = useState<PdfCompany>({})

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const r = await fetch(`/api/parametres?keys=${KEYS}`, {
          cache: "no-store",
        })
        if (!r.ok) return
        const data = (await r.json()) as Record<string, string>
        if (cancelled) return
        setCompany({
          companyName: data.company_name || undefined,
          companyAddress: data.company_address || undefined,
          companyEmail: data.company_email || undefined,
          companyPhone: data.company_phone || undefined,
          companyNinea: data.company_ninea || undefined,
          companyRc: data.company_rc || undefined,
          pdfFooterText: data.pdf_footer_text || undefined,
        })
      } catch {
        // silencieux : on garde les defauts du PdfTemplate
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return company
}
