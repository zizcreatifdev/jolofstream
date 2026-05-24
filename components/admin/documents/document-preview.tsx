"use client"

type Line = {
  description: string
  quantity: number
  unitPrice: number
  total?: number
}

export type DocumentPreviewProps = {
  type: "devis" | "facture"
  invoiceType?: "standard" | "acompte" | "solde" | "avoir"
  reference: string
  date: string
  validUntil?: string
  dueDate?: string
  client: {
    name: string
    organization?: string | null
    email?: string | null
    phone?: string | null
    tvaExempt?: boolean
  }
  lines: Line[]
  subtotalHt: number
  brsEnabled: boolean
  brsAmount: number
  tvaEnabled: boolean
  tvaAmount: number
  tvaExempt?: boolean
  totalTtc: number
  notes?: string | null
  companyName?: string
  companyAddress?: string
  companyEmail?: string
  companyPhone?: string
  companyNinea?: string
  companyRc?: string
  pdfFooterText?: string
}

function formatFCFA(amount: number): string {
  return (
    new Intl.NumberFormat("fr-FR").format(Math.round(amount || 0)) + " FCFA"
  )
}

function titleFor(
  type: "devis" | "facture",
  invoiceType?: string
): string {
  if (type === "devis") return "DEVIS"
  if (invoiceType === "avoir") return "AVOIR"
  if (invoiceType === "acompte") return "FACTURE D'ACOMPTE"
  if (invoiceType === "solde") return "FACTURE DE SOLDE"
  return "FACTURE"
}

export function DocumentPreview({
  type,
  invoiceType,
  reference,
  date,
  validUntil,
  dueDate,
  client,
  lines,
  subtotalHt,
  brsEnabled,
  brsAmount,
  tvaEnabled,
  tvaAmount,
  tvaExempt,
  totalTtc,
  notes,
  companyName = "Jolof Stream",
  companyAddress = "Dakar, Senegal",
  companyEmail = "jolofstream@gmail.com",
  companyPhone = "+221 70 241 48 48",
  companyNinea,
  companyRc,
  pdfFooterText = "Paiement : Wave Business ou virement bancaire",
}: DocumentPreviewProps) {
  const exonere = Boolean(tvaExempt || client.tvaExempt)

  return (
    <div
      className="mx-auto w-full max-w-[680px] rounded-lg border border-zinc-200 bg-white font-sans text-zinc-900"
      style={{ fontSize: "12px", minHeight: "800px", padding: "40px" }}
    >
      {/* EN-TETE */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/Logo_JolofStream_couleur.png"
            alt="Jolof Stream"
            style={{ height: "40px", width: "auto", objectFit: "contain" }}
          />
          <p className="mt-1 text-xs text-zinc-500">{companyName}</p>
        </div>
        <div className="text-right text-xs leading-relaxed text-zinc-500">
          <p>{companyAddress}</p>
          <p>{companyEmail}</p>
          <p>{companyPhone}</p>
          {companyNinea ? <p>NINEA : {companyNinea}</p> : null}
          {companyRc ? <p>RC : {companyRc}</p> : null}
        </div>
      </div>

      {/* TITRE */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          {titleFor(type, invoiceType)}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{reference}</p>
        <p className="text-sm text-zinc-500">Date : {date}</p>
        {validUntil ? (
          <p className="text-sm text-zinc-500">
            Valide jusqu&apos;au : {validUntil}
          </p>
        ) : null}
        {dueDate ? (
          <p className="text-sm text-zinc-500">Echeance : {dueDate}</p>
        ) : null}
      </div>

      {/* DESTINATAIRE */}
      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Destinataire
        </p>
        <p className="mt-1 text-sm font-semibold text-zinc-900">
          {client.name}
        </p>
        {client.organization ? (
          <p className="text-xs text-zinc-500">{client.organization}</p>
        ) : null}
        {client.email ? (
          <p className="text-xs text-zinc-500">{client.email}</p>
        ) : null}
        {client.phone ? (
          <p className="text-xs text-zinc-500">{client.phone}</p>
        ) : null}
        {exonere ? (
          <span className="mt-2 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            TVA exoneree
          </span>
        ) : null}
      </div>

      {/* TABLEAU PRESTATIONS */}
      <div className="mt-8 overflow-hidden rounded-md border border-zinc-100">
        <div className="flex bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <span className="flex-1">Description</span>
          <span className="w-12 text-right">Qte</span>
          <span className="w-28 text-right">Prix unit.</span>
          <span className="w-28 text-right">Total</span>
        </div>
        {lines.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-zinc-400">
            Ajoutez des prestations pour voir le detail.
          </div>
        ) : (
          lines.map((l, i) => (
            <div
              key={i}
              className="flex border-b border-zinc-100 px-3 py-2.5 text-sm text-zinc-800"
            >
              <span className="flex-1 pr-2">
                {l.description || "Description"}
              </span>
              <span className="w-12 text-right">{l.quantity}</span>
              <span className="w-28 text-right">
                {formatFCFA(l.unitPrice)}
              </span>
              <span className="w-28 text-right font-medium">
                {formatFCFA(l.total ?? l.quantity * l.unitPrice)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* TOTAUX */}
      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-[280px] space-y-2">
          <div className="flex justify-between text-sm text-zinc-600">
            <span>Sous-total HT</span>
            <span>{formatFCFA(subtotalHt)}</span>
          </div>
          {brsEnabled ? (
            <div className="flex justify-between text-sm text-zinc-600">
              <span>BRS 5%</span>
              <span>{formatFCFA(brsAmount)}</span>
            </div>
          ) : null}
          {tvaEnabled && !exonere ? (
            <div className="flex justify-between text-sm text-zinc-600">
              <span>TVA 18%</span>
              <span>{formatFCFA(tvaAmount)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between rounded bg-[#C8151B] px-4 py-2 font-bold text-white">
            <span>TOTAL TTC</span>
            <span>{formatFCFA(totalTtc)}</span>
          </div>
        </div>
      </div>

      {/* NOTES */}
      {notes && notes.trim().length > 0 ? (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Notes
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
            {notes}
          </p>
        </div>
      ) : null}

      {/* PIED DE PAGE */}
      <div className="mt-8 border-t border-zinc-100 pt-4 text-center text-xs text-zinc-400">
        {pdfFooterText} | {companyEmail} | {companyPhone}
      </div>
    </div>
  )
}
