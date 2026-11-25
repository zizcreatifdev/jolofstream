import { Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"

// Accuse de reception envoye au demandeur d'un devis (/contact)
export type AccuseReceptionDevisProps = {
  firstName: string
  need: string
  desiredDate: string
  location: string
  contactEmail?: string
  contactPhone?: string
}

export default function AccuseReceptionDevisEmail(props: AccuseReceptionDevisProps) {
  return (
    <EmailLayout
      preview="Votre demande de devis est bien arrivée"
      contactEmail={props.contactEmail || undefined}
      contactPhone={props.contactPhone || undefined}
    >
      <Text style={emailStyles.heading}>Bonjour {props.firstName},</Text>
      <Text style={emailStyles.paragraph}>
        C&apos;est dans la boîte : votre demande de devis est bien arrivée chez Jolof Stream. Notre équipe revient
        vers vous sous 24h avec un devis détaillé.
      </Text>
      <div style={emailStyles.card}>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Besoin : </span>
          {props.need}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Date souhaitée : </span>
          {props.desiredDate}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Lieu : </span>
          {props.location}
        </Text>
      </div>
      <Text style={emailStyles.paragraph}>
        Une précision à ajouter ? Répondez simplement à cet email.
        <br />
        L&apos;équipe Jolof Stream
      </Text>
    </EmailLayout>
  )
}
