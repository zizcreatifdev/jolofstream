import { Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"
import {
  FormationBrochure,
  FormationDeadline,
  FormationDetailsCard,
  FormationPayButton,
  type FormationEmailDetails,
} from "./_formation"

export type ConfirmationInscriptionProps = FormationEmailDetails & {
  waitlisted?: boolean
}

export default function ConfirmationInscriptionEmail(props: ConfirmationInscriptionProps) {
  const { firstName, cohortName, waitlisted } = props
  return (
    <EmailLayout preview={`Inscription enregistrée : ${cohortName}`}>
      <Text style={emailStyles.heading}>Bonjour {firstName},</Text>
      <Text style={emailStyles.paragraph}>
        Votre inscription à la formation <strong>{cohortName}</strong> a bien été
        enregistrée.
      </Text>

      <FormationDetailsCard details={props} />

      {waitlisted ? (
        <div style={emailStyles.alert}>
          La cohorte est complète : vous êtes sur la <strong>liste d&apos;attente</strong>.
          Nous vous écrirons dès qu&apos;une place se libère. Aucun paiement n&apos;est
          demandé pour l&apos;instant.
        </div>
      ) : (
        <>
          <FormationDeadline deadline={props.deadline} />
          <Text style={emailStyles.paragraph}>
            Aucun paiement n&apos;est effectué sur le site : tout passe par Wave Business.
          </Text>
          <FormationPayButton waveLink={props.waveLink} label="Payer maintenant" />
        </>
      )}

      <FormationBrochure brochureUrl={props.brochureUrl} />

      <Text style={emailStyles.paragraph}>
        À bientôt,
        <br />
        L&apos;équipe Jolof Stream
      </Text>
    </EmailLayout>
  )
}
