import { Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"
import {
  FormationBrochure,
  FormationDeadline,
  FormationDetailsCard,
  FormationPayButton,
  type FormationEmailDetails,
} from "./_formation"

export type RelancePaiementFormationProps = FormationEmailDetails

export default function RelancePaiementFormationEmail(props: RelancePaiementFormationProps) {
  const { firstName, cohortName } = props
  return (
    <EmailLayout preview={`Votre place vous attend : ${cohortName}`}>
      <Text style={emailStyles.heading}>Bonjour {firstName},</Text>
      <Text style={emailStyles.paragraph}>
        Votre place pour la formation <strong>{cohortName}</strong> est toujours
        réservée, mais nous n&apos;avons pas encore reçu votre paiement. Nous vous
        accordons un délai supplémentaire.
      </Text>

      <FormationDetailsCard details={props} />
      <FormationDeadline deadline={props.deadline} />
      <FormationPayButton waveLink={props.waveLink} label="Régler ma place" />
      <FormationBrochure brochureUrl={props.brochureUrl} />

      <Text style={emailStyles.paragraph}>
        Une question ? Répondez simplement à cet email.
        <br />
        L&apos;équipe Jolof Stream
      </Text>
    </EmailLayout>
  )
}
