import { Button, Link, Text } from "@react-email/components"

import { emailStyles } from "./_layout"

// Bloc commun aux emails de formation : cohorte, dates, lieu, montant,
// echeance de paiement, lien Wave et plaquette
export type FormationEmailDetails = {
  firstName: string
  programName: string
  cohortName: string
  sessionDate: string
  sessionLocation: string
  price: string
  waveLink?: string
  // Echeance en toutes lettres ("mardi 1 décembre 2026 à 14:30")
  deadline?: string
  brochureUrl?: string
}

export function FormationDetailsCard({ details }: { details: FormationEmailDetails }) {
  return (
    <div style={emailStyles.card}>
      <Text style={emailStyles.cardRow}>
        <span style={emailStyles.cardLabel}>Programme : </span>
        {details.programName}
      </Text>
      <Text style={emailStyles.cardRow}>
        <span style={emailStyles.cardLabel}>Cohorte : </span>
        {details.cohortName}
      </Text>
      <Text style={emailStyles.cardRow}>
        <span style={emailStyles.cardLabel}>Dates : </span>
        {details.sessionDate}
      </Text>
      <Text style={emailStyles.cardRow}>
        <span style={emailStyles.cardLabel}>Lieu : </span>
        {details.sessionLocation}
      </Text>
      <Text style={emailStyles.cardRow}>
        <span style={emailStyles.cardLabel}>Montant : </span>
        {details.price}
      </Text>
    </div>
  )
}

export function FormationDeadline({ deadline }: { deadline?: string }) {
  if (!deadline) return null
  return (
    <div style={emailStyles.alert}>
      Votre place est réservée : merci de la régler <strong>avant le {deadline}</strong>{" "}
      (heure de Dakar). Elle sera confirmée à réception du paiement.
    </div>
  )
}

export function FormationPayButton({ waveLink, label }: { waveLink?: string; label: string }) {
  if (!waveLink) {
    return (
      <Text style={emailStyles.paragraph}>
        Vous recevrez le lien de paiement Wave sous 24 h.
      </Text>
    )
  }
  return (
    <Button href={waveLink} style={emailStyles.button}>
      {label}
    </Button>
  )
}

export function FormationBrochure({ brochureUrl }: { brochureUrl?: string }) {
  if (!brochureUrl) return null
  return (
    <Text style={emailStyles.paragraph}>
      Le programme détaillé est disponible dans la plaquette :{" "}
      <Link href={brochureUrl}>télécharger la plaquette (PDF)</Link>.
    </Text>
  )
}
