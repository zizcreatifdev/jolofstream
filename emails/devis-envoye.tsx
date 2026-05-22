import { Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"

export type DevisEnvoyeProps = {
  clientFirstName: string
  reference: string
  subject: string
  totalTtc: string
  validUntil?: string
}

export default function DevisEnvoyeEmail({
  clientFirstName,
  reference,
  subject,
  totalTtc,
  validUntil,
}: DevisEnvoyeProps) {
  return (
    <EmailLayout preview={`Votre devis ${reference} - Jolof Stream`}>
      <Text style={emailStyles.heading}>Bonjour {clientFirstName},</Text>
      <Text style={emailStyles.paragraph}>
        Veuillez trouver ci-dessous le recapitulatif de votre devis{" "}
        <strong>{reference}</strong>. Le document detaille vous sera transmis
        en piece jointe.
      </Text>

      <div style={emailStyles.card}>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Reference : </span>
          {reference}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Objet : </span>
          {subject}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Montant TTC : </span>
          {totalTtc}
        </Text>
        {validUntil ? (
          <Text style={emailStyles.cardRow}>
            <span style={emailStyles.cardLabel}>Valide jusqu&apos;au : </span>
            {validUntil}
          </Text>
        ) : null}
      </div>

      <Text style={emailStyles.paragraph}>
        Pour accepter ce devis ou pour toute question, n&apos;hesitez pas a
        nous contacter par retour de mail.
      </Text>

      <Text style={emailStyles.paragraph}>
        L&apos;equipe Jolof Stream
      </Text>
    </EmailLayout>
  )
}
