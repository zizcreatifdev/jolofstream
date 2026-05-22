import { Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"

export type RelanceFactureProps = {
  clientFirstName: string
  reference: string
  totalTtc: string
  dueDate?: string
  daysPastDue: number
}

export default function RelanceFactureEmail({
  clientFirstName,
  reference,
  totalTtc,
  dueDate,
  daysPastDue,
}: RelanceFactureProps) {
  return (
    <EmailLayout preview={`Rappel : facture ${reference} en attente`}>
      <Text style={emailStyles.heading}>Bonjour {clientFirstName},</Text>
      <Text style={emailStyles.paragraph}>
        Nous vous rappelons que la facture <strong>{reference}</strong> d&apos;un
        montant de <strong>{totalTtc}</strong> est en attente de reglement{" "}
        {daysPastDue > 0
          ? `depuis ${daysPastDue} jour${daysPastDue > 1 ? "s" : ""}`
          : "et arrive a echeance"}
        .
      </Text>

      <div style={emailStyles.card}>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Reference : </span>
          {reference}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Montant TTC : </span>
          {totalTtc}
        </Text>
        {dueDate ? (
          <Text style={emailStyles.cardRow}>
            <span style={emailStyles.cardLabel}>Echeance : </span>
            {dueDate}
          </Text>
        ) : null}
      </div>

      <Text style={emailStyles.paragraph}>
        Si vous avez deja effectue le paiement, veuillez ignorer cet email.
        Sinon, n&apos;hesitez pas a nous contacter pour tout besoin
        d&apos;eclaircissement.
      </Text>

      <Text style={emailStyles.paragraph}>
        Cordialement,
        <br />
        L&apos;equipe Jolof Stream
      </Text>
    </EmailLayout>
  )
}
