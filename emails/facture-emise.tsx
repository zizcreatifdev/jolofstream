import { Text } from "@react-email/components"

import { EmailLayout, emailStyles } from "./_layout"

export type FactureEmiseProps = {
  clientFirstName: string
  reference: string
  totalTtc: string
  dueDate?: string
  waveNumber?: string
  bankInfo?: string
}

export default function FactureEmiseEmail({
  clientFirstName,
  reference,
  totalTtc,
  dueDate,
  waveNumber,
  bankInfo,
}: FactureEmiseProps) {
  return (
    <EmailLayout preview={`Votre facture ${reference} - Jolof Stream`}>
      <Text style={emailStyles.heading}>Bonjour {clientFirstName},</Text>
      <Text style={emailStyles.paragraph}>
        Votre facture <strong>{reference}</strong> d&apos;un montant de{" "}
        <strong>{totalTtc}</strong> est disponible.
      </Text>

      <div style={emailStyles.card}>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Reference : </span>
          {reference}
        </Text>
        <Text style={emailStyles.cardRow}>
          <span style={emailStyles.cardLabel}>Montant TTC : </span>
          {totalTtc}
        </Text>
        {dueDate ? (
          <Text style={emailStyles.cardRow}>
            <span style={emailStyles.cardLabel}>Echeance : </span>
            {dueDate}
          </Text>
        ) : null}
      </div>

      <Text style={emailStyles.heading}>Modes de paiement</Text>
      <Text style={emailStyles.paragraph}>
        {waveNumber ? (
          <>
            <strong>Wave Business : </strong>
            {waveNumber}
            <br />
          </>
        ) : (
          <>
            <strong>Wave Business</strong> (numero communique sur demande)
            <br />
          </>
        )}
        {bankInfo ? (
          <>
            <strong>Virement bancaire : </strong>
            {bankInfo}
          </>
        ) : (
          <strong>Virement bancaire</strong>
        )}
      </Text>

      <Text style={emailStyles.paragraph}>
        Merci pour votre confiance.
        <br />
        L&apos;equipe Jolof Stream
      </Text>
    </EmailLayout>
  )
}
