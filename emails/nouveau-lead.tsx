import { Button, Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"

export type NouveauLeadProps = {
  adminFirstName?: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientOrganization: string
  serviceType: string
  projectDate: string
  projectLocation: string
  projectDescription?: string
  dashboardUrl: string
}

export default function NouveauLeadEmail({
  adminFirstName,
  clientName,
  clientEmail,
  clientPhone,
  clientOrganization,
  serviceType,
  projectDate,
  projectLocation,
  projectDescription,
  dashboardUrl,
}: NouveauLeadProps) {
  return (
    <EmailLayout preview={`Nouvelle demande de devis - ${serviceType}`}>
      <Text style={emailStyles.heading}>
        {adminFirstName ? `Bonjour ${adminFirstName},` : "Bonjour,"}
      </Text>
      <Text style={emailStyles.paragraph}>
        Une nouvelle demande de devis vient d&apos;etre soumise via le site.
      </Text>

      <div style={emailStyles.card}>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Client : </span>
          {clientName}
        </Text>
        {clientOrganization ? (
          <Text style={emailStyles.cardRow}>
            <span style={emailStyles.cardLabel}>Organisation : </span>
            {clientOrganization}
          </Text>
        ) : null}
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Email : </span>
          {clientEmail}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Telephone : </span>
          {clientPhone}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Service : </span>
          {serviceType}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Date souhaitee : </span>
          {projectDate}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Lieu : </span>
          {projectLocation}
        </Text>
        {projectDescription ? (
          <Text style={emailStyles.cardRow}>
            <span style={emailStyles.cardLabel}>Description : </span>
            {projectDescription}
          </Text>
        ) : null}
      </div>

      <Button href={dashboardUrl} style={emailStyles.button}>
        Voir dans le dashboard
      </Button>
    </EmailLayout>
  )
}
