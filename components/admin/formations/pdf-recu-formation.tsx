import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

const RED = "#C8151B"
const GREEN_BG = "#edf7ed"
const GREEN_TEXT = "#2e7d32"
const PALE_RED = "#fff7f7"
const NEUTRAL_BG = "#f5f5f5"
const MUTED = "#6b7280"
const INK = "#18181b"
const DIVIDER = "#e5e7eb"

const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: INK,
    backgroundColor: "#ffffff",
  },

  // Header
  header: {
    backgroundColor: RED,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  brandTagline: {
    color: "#ffffff",
    opacity: 0.75,
    fontSize: 10,
    marginTop: 3,
  },
  recuBadge: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  recuBadgeText: {
    color: RED,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#ffffff",
    opacity: 0.2,
    marginTop: 16,
    marginBottom: 12,
  },
  refLabel: {
    color: "#ffffff",
    opacity: 0.6,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  refValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
  refDate: {
    color: "#ffffff",
    opacity: 0.65,
    fontSize: 11,
    marginTop: 3,
  },

  // Paiement confirme banner
  banner: {
    backgroundColor: PALE_RED,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  bannerCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bannerCheckText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  bannerTitle: {
    color: RED,
    fontSize: 13,
    fontWeight: "bold",
  },
  bannerSub: {
    color: MUTED,
    fontSize: 11,
    marginTop: 2,
  },

  // Body
  body: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 4,
  },
  block: {
    marginBottom: 18,
  },
  blockLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 6,
  },
  blockTitle: {
    color: INK,
    fontSize: 14,
    fontWeight: "bold",
  },
  blockLine: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginBottom: 18,
  },

  participantRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  initialsCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  initialsText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  participantInfo: { flex: 1 },
  participantName: {
    color: INK,
    fontSize: 14,
    fontWeight: "bold",
  },
  participantLine: {
    color: MUTED,
    fontSize: 11,
    marginTop: 2,
  },

  // Montant
  amountBox: {
    backgroundColor: NEUTRAL_BG,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  amountLeft: { flex: 1 },
  amountLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  amountValue: {
    color: RED,
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 4,
  },
  payeBadge: {
    backgroundColor: GREEN_BG,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  payeBadgeText: {
    color: GREEN_TEXT,
    fontSize: 11,
    fontWeight: "bold",
  },
  acompteBadge: {
    backgroundColor: "#fff3e0",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  acompteBadgeText: {
    color: "#b45309",
    fontSize: 11,
    fontWeight: "bold",
  },
  amountBoxCompact: {
    backgroundColor: NEUTRAL_BG,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  amountRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    paddingTop: 8,
    marginTop: 4,
  },
  amountSmallLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.6,
  },
  amountSmallValue: {
    color: INK,
    fontSize: 12,
    fontWeight: "bold",
  },
  amountRedValue: {
    color: RED,
    fontSize: 20,
    fontWeight: "bold",
  },
  amountOrangeValue: {
    color: "#c2410c",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Footer
  footer: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    color: MUTED,
    fontSize: 9,
  },

  // Zones tampon / signature
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 6,
    paddingBottom: 22,
  },
  signatureSquare: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },
  signatureSquareLeft: { borderColor: RED, marginRight: 20 },
  signatureSquareRight: { borderColor: "#cccccc" },
  signatureSquareLabel: {
    color: MUTED,
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 0.6,
    textAlign: "center",
  },
  signatureSquareName: {
    color: MUTED,
    fontSize: 9,
    textAlign: "center",
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
  amountPaid?: number
  totalPrice?: number
  companyName: string
  companyAddress: string
  companyEmail: string
  companyPhone: string
  companyNinea?: string
  logoSrc?: string
  signatureUrl?: string
}

function formatFCFA(amount: number): string {
  const rounded = Math.round(amount)
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return `${formatted} FCFA`
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d)
}

function formatDateTimeShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const date = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d)
  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
  return `${date} a ${time}`
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

function buildInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0).toUpperCase()
  const last = lastName.trim().charAt(0).toUpperCase()
  return `${first}${last}` || "JS"
}

export function PdfRecuFormation({
  reference,
  formation,
  participant,
  paidAt,
  amountPaid,
  totalPrice,
  companyName,
  companyEmail,
  companyPhone,
  companyNinea,
}: PdfRecuFormationProps) {
  const duration = computeDuration(formation.dateStart, formation.dateEnd)
  const dateRange = `${formatDateShort(formation.dateStart)} au ${formatDateShort(
    formation.dateEnd
  )}`
  const initials = buildInitials(participant.firstName, participant.lastName)
  const paymentDateTime = formatDateTimeShort(paidAt)

  const total = totalPrice ?? formation.price
  const paid = amountPaid ?? total
  const isPartial = paid < total
  const remaining = Math.max(0, total - paid)

  return (
    <Document>
      <Page size={[400, 880]} style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.brandName}>{companyName}</Text>
              <Text style={styles.brandTagline}>
                Captation et diffusion en direct
              </Text>
            </View>
            <View style={styles.recuBadge}>
              <Text style={styles.recuBadgeText}>RECU</Text>
            </View>
          </View>
          <View style={styles.headerDivider} />
          <Text style={styles.refLabel}>REFERENCE</Text>
          <Text style={styles.refValue}>{reference}</Text>
          <Text style={styles.refDate}>{formatDateShort(paidAt)}</Text>
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerCheckCircle}>
            <Text style={styles.bannerCheckText}>V</Text>
          </View>
          <View>
            <Text style={styles.bannerTitle}>
              {isPartial ? "Acompte enregistre" : "Paiement confirme"}
            </Text>
            <Text style={styles.bannerSub}>
              Wave Business - {paymentDateTime}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.block}>
            <Text style={styles.blockLabel}>FORMATION</Text>
            <Text style={styles.blockTitle}>{formation.title}</Text>
            <Text style={styles.blockLine}>Periode : {dateRange}</Text>
            <Text style={styles.blockLine}>Lieu : {formation.location}</Text>
            <Text style={styles.blockLine}>Duree : {duration}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.block}>
            <Text style={styles.blockLabel}>PARTICIPANT</Text>
            <View style={styles.participantRow}>
              <View style={styles.initialsCircle}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>
                  {participant.firstName} {participant.lastName}
                </Text>
                <Text style={styles.participantLine}>{participant.email}</Text>
                {participant.phone ? (
                  <Text style={styles.participantLine}>
                    {participant.phone}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {isPartial ? (
            <View style={styles.amountBoxCompact}>
              <View style={styles.amountRow}>
                <Text style={styles.amountSmallLabel}>MONTANT TOTAL</Text>
                <Text style={styles.amountSmallValue}>{formatFCFA(total)}</Text>
              </View>
              <View style={styles.amountRow}>
                <View>
                  <Text style={styles.amountSmallLabel}>MONTANT REGLE</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View style={styles.acompteBadge}>
                    <Text style={styles.acompteBadgeText}>ACOMPTE</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.amountRedValue, { textAlign: "right" }]}>
                {formatFCFA(paid)}
              </Text>
              <View style={styles.amountRowFinal}>
                <Text style={styles.amountSmallLabel}>RESTE A PAYER</Text>
                <Text style={styles.amountOrangeValue}>
                  {formatFCFA(remaining)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.amountBox}>
              <View style={styles.amountLeft}>
                <Text style={styles.amountLabel}>MONTANT REGLE</Text>
                <Text style={styles.amountValue}>{formatFCFA(paid)}</Text>
              </View>
              <View style={styles.payeBadge}>
                <Text style={styles.payeBadgeText}>Paye</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.signaturesRow}>
          <View style={[styles.signatureSquare, styles.signatureSquareLeft]}>
            <Text style={styles.signatureSquareLabel}>TAMPON / SIGNATURE</Text>
            <Text style={styles.signatureSquareName}>{companyName}</Text>
          </View>
          <View style={[styles.signatureSquare, styles.signatureSquareRight]}>
            <Text style={styles.signatureSquareLabel}>LU ET APPROUVE</Text>
            <Text style={styles.signatureSquareName}>
              {participant.firstName} {participant.lastName}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {companyEmail} - {companyPhone}
          </Text>
          <Text style={styles.footerText}>
            {companyNinea ? `NINEA : ${companyNinea}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
