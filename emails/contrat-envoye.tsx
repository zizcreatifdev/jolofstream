import { Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"

export type ContratEnvoyeProps = {
  clientFirstName: string
  templateTitle: string
  reference: string
  projectTitle: string
  dashboardNote?: string
}

export default function ContratEnvoyeEmail({
  clientFirstName,
  templateTitle,
  reference,
  projectTitle,
  dashboardNote,
}: ContratEnvoyeProps) {
  return (
    <EmailLayout preview={`Votre contrat ${templateTitle}`}>
      <Text style={emailStyles.heading}>Bonjour {clientFirstName},</Text>
      <Text style={emailStyles.paragraph}>
        Veuillez trouver ci-joint votre contrat{" "}
        <strong>{templateTitle}</strong>. Nous vous remercions de la
        confiance accordée a Jolof Stream pour cette collaboration.
      </Text>

      <div style={emailStyles.card}>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Référence contrat : </span>
          {reference}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Projet : </span>
          {projectTitle}
        </Text>
      </div>

      <div style={emailStyles.alert}>
        Pour signer ce contrat, imprimez-le, signez-le et retournez-nous une
        copie par email à jolofstream@gmail.com ou en main propre.
      </div>

      {dashboardNote ? (
        <Text style={emailStyles.paragraph}>{dashboardNote}</Text>
      ) : null}

      <Text style={emailStyles.paragraph}>
        Pour toute question relative aux clauses, n&apos;hésitez pas à nous
        contacter directement.
      </Text>

      <Text style={emailStyles.paragraph}>
        Cordialement,
        <br />
        L&apos;équipe Jolof Stream
      </Text>
    </EmailLayout>
  )
}
