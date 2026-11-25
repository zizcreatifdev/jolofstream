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
        Veuillez trouver ci-dessous le récapitulatif de votre devis{" "}
        <strong>{reference}</strong>. Le document détaillé vous sera transmis
        en pièce jointe.
      </Text>

      <div style={emailStyles.card}>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Référence : </span>
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
            <span style={emailStyles.cardLabel}>Validé jusqu&apos;au : </span>
            {validUntil}
          </Text>
        ) : null}
      </div>

      <Text style={emailStyles.paragraph}>
        Pour accepter ce devis ou pour toute question, n&apos;hésitez pas à
        nous contacter par retour de mail.
      </Text>

      <Text style={emailStyles.paragraph}>
        L&apos;équipe Jolof Stream
      </Text>
    </EmailLayout>
  )
}
