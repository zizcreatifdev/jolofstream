import { Button, Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"

// Notification admin d'une demande de devis du site (/contact)
export type NouveauLeadProps = {
  clientName: string
  clientEmail: string
  clientPhone: string
  clientOrganization?: string | null
  need: string
  desiredDate: string
  location: string
  platforms?: string | null
  cameras?: string | null
  participants?: number | null
  description?: string | null
  requestUrl: string
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <Text style={emailStyles.cardRow}>
      <span style={emailStyles.cardLabel}>{label} : </span>
      {value}
    </Text>
  )
}

export default function NouveauLeadEmail(props: NouveauLeadProps) {
  return (
    <EmailLayout preview={`Nouvelle demande de devis : ${props.need}`}>
      <Text style={emailStyles.heading}>Bonjour,</Text>
      <Text style={emailStyles.paragraph}>
        Une nouvelle demande de devis vient d&apos;arriver depuis le site. Réponse promise sous 24h.
      </Text>

      <div style={emailStyles.card}>
        <Row label="Besoin" value={props.need} />
        <Row label="Date souhaitée" value={props.desiredDate} />
        <Row label="Lieu" value={props.location} />
        <Row label="Organisation" value={props.clientOrganization} />
        <Row label="Diffusion" value={props.platforms} />
        <Row label="Caméras" value={props.cameras} />
        <Row label="Participants" value={props.participants} />
      </div>

      <div style={emailStyles.card}>
        <Row label="Contact" value={props.clientName} />
        <Row label="Email" value={props.clientEmail} />
        <Row label="Téléphone" value={props.clientPhone} />
      </div>

      {props.description ? (
        <Text style={emailStyles.paragraph}>
          <strong>Projet :</strong>
          <br />
          {props.description}
        </Text>
      ) : null}

      <Button href={props.requestUrl} style={emailStyles.button}>
        Ouvrir la demande
      </Button>
    </EmailLayout>
  )
}
