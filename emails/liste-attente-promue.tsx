import { Button, Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"

export type ListeAttentePromueProps = {
  firstName: string
  sessionTitle: string
  sessionDate: string
  sessionLocation: string
  price: string
  waveLink?: string
}

export default function ListeAttentePromueEmail({
  firstName,
  sessionTitle,
  sessionDate,
  sessionLocation,
  price,
  waveLink,
}: ListeAttentePromueProps) {
  return (
    <EmailLayout preview={`Une place s'est liberee - ${sessionTitle}`}>
      <Text style={emailStyles.heading}>Bonne nouvelle {firstName} !</Text>
      <Text style={emailStyles.paragraph}>
        Une place s&apos;est liberee pour la formation{" "}
        <strong>{sessionTitle}</strong>. Vous etes le/la prochain(e) sur la
        liste d&apos;attente.
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
        Confirmez votre place en effectuant le paiement{" "}
        <strong>sous 48h</strong>. Passe ce delai, la place sera proposee a
        l&apos;inscrit(e) suivant(e).
      </div>

      {waveLink && (
        <Button href={waveLink} style={emailStyles.button}>
          Confirmer ma place
        </Button>
      )}

      <Text style={emailStyles.paragraph}>
        L&apos;equipe Jolof Stream
      </Text>
    </EmailLayout>
  )
}
