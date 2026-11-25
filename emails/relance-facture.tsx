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
        montant de <strong>{totalTtc}</strong> est en attente de règlement{" "}
        {daysPastDue > 0
          ? `depuis ${daysPastDue} jour${daysPastDue > 1 ? "s" : ""}`
          : "et arrive à échéance"}
        .
      </Text>

      <div style={emailStyles.card}>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Référence : </span>
          {reference}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Montant TTC : </span>
          {totalTtc}
        </Text>
        {dueDate ? (
          <Text style={emailStyles.cardRow}>
            <span style={emailStyles.cardLabel}>Échéance : </span>
            {dueDate}
          </Text>
        ) : null}
      </div>

      <Text style={emailStyles.paragraph}>
        Si vous avez déjà effectué le paiement, veuillez ignorer cet email.
        Sinon, n&apos;hésitez pas à nous contacter pour tout besoin
        d&apos;éclaircissement.
      </Text>

      <Text style={emailStyles.paragraph}>
        Cordialement,
        <br />
        L&apos;équipe Jolof Stream
      </Text>
    </EmailLayout>
  )
}
