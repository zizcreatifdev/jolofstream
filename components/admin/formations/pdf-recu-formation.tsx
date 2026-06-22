import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#18181b",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  logo: { width: 150, height: 45, objectFit: "contain" },
  companyInfo: { fontSize: 9, color: "#52525b", textAlign: "right" },
  companyInfoLine: { marginBottom: 2 },
  separator: {
    height: 2,
    backgroundColor: "#C8151B",
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  titleBlock: { flex: 1 },
  docTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#18181b",
  },
  docSubtitle: {
    fontSize: 11,
    color: "#52525b",
    marginTop: 4,
  },
  docRef: {
    fontSize: 11,
    color: "#C8151B",
    fontWeight: "bold",
    marginTop: 10,
  },
  docDate: { fontSize: 10, color: "#71717a", marginTop: 2 },
  paidBadge: {
    backgroundColor: "#16a34a",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 4,
  },
  paidBadgeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    padding: 12,
    marginBottom: 14,
  },
  infoBoxTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoMain: { fontSize: 12, fontWeight: "bold", color: "#18181b" },
  infoLine: { fontSize: 10, color: "#3f3f46", marginTop: 4 },
  infoMuted: { fontSize: 10, color: "#71717a", marginTop: 4 },
  amountWrapper: {
    marginTop: 4,
    marginBottom: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
  },
  amountLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#C8151B",
    marginTop: 4,
  },
  amountMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  amountMetaText: { fontSize: 10, color: "#52525b" },
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },
  signatureBlock: { width: "45%" },
  signatureLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  signatureImage: { width: 120, height: 50, objectFit: "contain" },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomStyle: "dashed",
    borderBottomColor: "#a1a1aa",
    marginTop: 36,
    marginBottom: 4,
  },
  signatureName: { fontSize: 9, color: "#3f3f46" },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 10,
  },
  footerLineMain: {
    fontSize: 9,
    color: "#18181b",
    textAlign: "center",
    fontWeight: "bold",
  },
  footerLineSub: {
    fontSize: 8,
    color: "#71717a",
    textAlign: "center",
    marginTop: 3,
  },
})

export interface PdfRecuFormationProps {
  reference: string
  formation: {
    title: string
    dateStart: string
    dateEnd: string
    location: string
    price: number
  }
  participant: {
    firstName: string
    lastName: string
    email: string
    phone?: string | null
  }
  paidAt: string
  companyName: string
  companyAddress: string
  companyEmail: string
  companyPhone: string
  companyNinea?: string
  logoSrc?: string
  signatureUrl?: string
}

const formatAmount = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) +
  " FCFA"

const formatDate = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d)
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

function computeDuration(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "-"
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate()
  if (sameDay) {
    const hours = Math.max(
      1,
      Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60))
    )
    return `${hours} heure${hours > 1 ? "s" : ""}`
  }
  const diffMs = e.getTime() - s.getTime()
  const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  return `${days} jour${days > 1 ? "s" : ""}`
}

export function PdfRecuFormation({
  reference,
  formation,
  participant,
  paidAt,
  companyName,
  companyAddress,
  companyEmail,
  companyPhone,
  companyNinea,
  logoSrc,
  signatureUrl,
}: PdfRecuFormationProps) {
  const duration = computeDuration(formation.dateStart, formation.dateEnd)
  const dateRange = `${formatDate(formation.dateStart)} au ${formatDate(
    formation.dateEnd
  )}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {logoSrc ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logoSrc} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "#C8151B" }}>
                {companyName}
              </Text>
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyInfoLine}>{companyName}</Text>
            <Text style={styles.companyInfoLine}>{companyAddress}</Text>
            <Text style={styles.companyInfoLine}>{companyEmail}</Text>
            <Text style={styles.companyInfoLine}>{companyPhone}</Text>
            {companyNinea ? (
              <Text style={styles.companyInfoLine}>NINEA : {companyNinea}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.docTitle}>RECU DE PAIEMENT</Text>
            <Text style={styles.docSubtitle}>Formation professionnelle</Text>
            <Text style={styles.docRef}>Reference : {reference}</Text>
            <Text style={styles.docDate}>
              Date d&apos;emission : {formatDate(paidAt)}
            </Text>
          </View>
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>PAYE</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>Formation</Text>
          <Text style={styles.infoMain}>{formation.title}</Text>
          <Text style={styles.infoLine}>Periode : {dateRange}</Text>
          <Text style={styles.infoLine}>Lieu : {formation.location}</Text>
          <Text style={styles.infoLine}>Duree : {duration}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>Participant</Text>
          <Text style={styles.infoMain}>
            {participant.firstName} {participant.lastName}
          </Text>
          <Text style={styles.infoLine}>Email : {participant.email}</Text>
          {participant.phone ? (
            <Text style={styles.infoLine}>Telephone : {participant.phone}</Text>
          ) : null}
        </View>

        <View style={styles.amountWrapper}>
          <Text style={styles.amountLabel}>Montant regle</Text>
          <Text style={styles.amountValue}>{formatAmount(formation.price)}</Text>
          <View style={styles.amountMeta}>
            <Text style={styles.amountMetaText}>
              Mode de paiement : Wave Business
            </Text>
            <Text style={styles.amountMetaText}>
              Reglement : {formatDateTime(paidAt)}
            </Text>
          </View>
        </View>

        <View style={styles.signaturesRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Pour {companyName}</Text>
            {signatureUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={signatureUrl} style={styles.signatureImage} />
            ) : null}
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{companyName}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Lu et approuve</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>
              {participant.firstName} {participant.lastName}
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerLineMain}>
            Merci de votre confiance - {companyName}
          </Text>
          <Text style={styles.footerLineSub}>
            {companyEmail} | {companyPhone}
          </Text>
          <Text style={styles.footerLineSub}>
            Ce recu fait foi de paiement pour la formation indiquee.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
