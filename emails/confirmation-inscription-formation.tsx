import { Button, Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"

export type ConfirmationInscriptionProps = {
  firstName: string
  sessionTitle: string
  sessionDate: string
  sessionLocation: string
  price: string
  waveLink?: string
}

export default function ConfirmationInscriptionEmail({
  firstName,
  sessionTitle,
  sessionDate,
  sessionLocation,
  price,
  waveLink,
}: ConfirmationInscriptionProps) {
  return (
    <EmailLayout preview={`Inscription enregistree - ${sessionTitle}`}>
      <Text style={emailStyles.heading}>Bonjour {firstName},</Text>
      <Text style={emailStyles.paragraph}>
        Votre inscription a la formation <strong>{sessionTitle}</strong> a bien
        ete enregistree.
      </Text>

      <div style={emailStyles.card}>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Date : </span>
          {sessionDate}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Lieu : </span>
          {sessionLocation}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Tarif : </span>
          {price}
        </Text>
      </div>

      <div style={emailStyles.alert}>
        Votre place sera <strong>confirmee apres reception du paiement</strong>.
        Aucun paiement n&apos;est effectue sur le site : tout passe par Wave
        Business.
      </div>

      {waveLink ? (
        <>
          <Text style={emailStyles.paragraph}>
            Cliquez ci-dessous pour proceder au paiement maintenant :
          </Text>
          <Button href={waveLink} style={emailStyles.button}>
            Payer maintenant
          </Button>
        </>
      ) : (
        <Text style={emailStyles.paragraph}>
          Vous recevrez le lien de paiement Wave sous 24h.
        </Text>
      )}

      <Text style={emailStyles.paragraph}>
        A bientot !<br />
        L&apos;equipe Jolof Stream
      </Text>
    </EmailLayout>
  )
}
