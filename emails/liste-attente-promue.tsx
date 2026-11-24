import { Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"
import {
  FormationBrochure,
  FormationDeadline,
  FormationDetailsCard,
  FormationPayButton,
  type FormationEmailDetails,
} from "./_formation"

export type ListeAttentePromueProps = FormationEmailDetails

export default function ListeAttentePromueEmail(props: ListeAttentePromueProps) {
  const { firstName, cohortName } = props
  return (
    <EmailLayout preview={`Une place s'est libérée : ${cohortName}`}>
      <Text style={emailStyles.heading}>Bonne nouvelle, {firstName}</Text>
      <Text style={emailStyles.paragraph}>
        Une place s&apos;est libérée pour la formation <strong>{cohortName}</strong> et
        elle vous revient, puisque vous étiez en tête de la liste d&apos;attente.
      </Text>

      <FormationDetailsCard details={props} />
      <FormationDeadline deadline={props.deadline} />
      <FormationPayButton waveLink={props.waveLink} label="Confirmer ma place" />
      <FormationBrochure brochureUrl={props.brochureUrl} />

      <Text style={emailStyles.paragraph}>L&apos;équipe Jolof Stream</Text>
    </EmailLayout>
  )
}
