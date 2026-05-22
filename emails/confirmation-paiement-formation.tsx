import { Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"

export type ConfirmationPaiementProps = {
  firstName: string
  sessionTitle: string
  sessionDate: string
  sessionLocation: string
}

export default function ConfirmationPaiementEmail({
  firstName,
  sessionTitle,
  sessionDate,
  sessionLocation,
}: ConfirmationPaiementProps) {
  return (
    <EmailLayout preview={`Paiement confirme - ${sessionTitle}`}>
      <Text style={emailStyles.heading}>Bonjour {firstName},</Text>
      <Text style={emailStyles.paragraph}>
        Votre paiement a ete confirme. <strong>Votre place est reservee !</strong>
      </Text>

      <div style={emailStyles.card}>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Formation : </span>
          {sessionTitle}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Date : </span>
          {sessionDate}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Lieu : </span>
          {sessionLocation}
        </Text>
      </div>

      <Text style={emailStyles.paragraph}>
        A bientot le <strong>{sessionDate}</strong> a {sessionLocation}.
      </Text>

      <Text style={emailStyles.paragraph}>
        L&apos;equipe Jolof Stream
      </Text>
    </EmailLayout>
  )
}
