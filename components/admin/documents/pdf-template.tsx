import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#18181b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  logo: { fontSize: 20, fontWeight: "bold", color: "#C8151B" },
  logoSub: { fontSize: 10, color: "#71717a", marginTop: 2 },
  companyInfo: { fontSize: 9, color: "#52525b", textAlign: "right" },
  docTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  docRef: { fontSize: 10, color: "#71717a", marginBottom: 2 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#71717a",
    textTransform: "uppercase",
    marginBottom: 6,
    borderBottom: "1pt solid #e4e4e7",
    paddingBottom: 4,
  },
  destinataireName: { fontSize: 11, fontWeight: "bold" },
  muted: { color: "#71717a" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderText: { fontSize: 9, fontWeight: "bold", color: "#52525b" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: "1pt solid #f4f4f5",
  },
  tableText: { fontSize: 9, color: "#18181b" },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  totalsWrapper: { marginTop: 16, alignItems: "flex-end" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
    width: 260,
  },
  totalLabel: { flex: 1, fontSize: 10, color: "#52525b" },
  totalValue: { width: 100, textAlign: "right", fontSize: 10 },
  totalTtcRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    width: 260,
    backgroundColor: "#C8151B",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  totalTtcLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
  },
  totalTtcValue: {
    width: 100,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
  },
  notes: { fontSize: 9, color: "#52525b", lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40 },
  footerLine: {
    borderTop: "1pt solid #e4e4e7",
    paddingTop: 8,
    fontSize: 8,
    color: "#a1a1aa",
    textAlign: "center",
  },
  exemptBadge: {
    marginTop: 4,
    backgroundColor: "#fef3c7",
    color: "#854d0e",
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 8,
    alignSelf: "flex-start",
  },
})

export interface PdfTemplateProps {
  type: "devis" | "facture"
  invoiceType?: "standard" | "acompte" | "solde" | "avoir"
  reference: string
  date: string
  validUntil?: string
  dueDate?: string
  client: {
    name: string
    organization?: string | null
    email?: string | null
    phone?: string | null
  }
  lines: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotalHt: number
  brsEnabled: boolean
  brsAmount: number
  tvaEnabled: boolean
  tvaAmount: number
  tvaExempt: boolean
  totalTtc: number
  notes?: string | null
  companyName?: string
  companyAddress?: string
  companyEmail?: string
  companyPhone?: string
  companyNinea?: string
  companyRc?: string
  pdfFooterText?: string
}

const formatAmount = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(n) + " FCFA"

export function PdfTemplate({
  type,
  invoiceType,
  reference,
  date,
  validUntil,
  dueDate,
  client,
  companyName = "Jolof Stream",
  companyAddress = "Dakar, Senegal",
  companyEmail = "jolofstream@gmail.com",
  companyPhone = "+221 70 241 48 48",
  companyNinea,
  companyRc,
  pdfFooterText = "Paiement : Wave Business ou virement bancaire",
  lines,
  subtotalHt,
  brsEnabled,
  brsAmount,
  tvaEnabled,
  tvaAmount,
  tvaExempt,
  totalTtc,
  notes,
}: PdfTemplateProps) {
  const title =
    type === "devis"
      ? "DEVIS"
      : invoiceType === "avoir"
      ? "AVOIR"
      : "FACTURE"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>{companyName}</Text>
            <Text style={styles.logoSub}>
              Captation et diffusion en direct
            </Text>
          </View>
          <View style={styles.companyInfo}>
            <Text>{companyAddress}</Text>
            <Text>{companyEmail}</Text>
            <Text>{companyPhone}</Text>
            {companyNinea ? <Text>NINEA : {companyNinea}</Text> : null}
            {companyRc ? <Text>RC : {companyRc}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.docTitle}>{title}</Text>
          <Text style={styles.docRef}>Reference : {reference}</Text>
          <Text style={styles.docRef}>Date : {date}</Text>
          {validUntil ? (
            <Text style={styles.docRef}>Valide jusqu&apos;au : {validUntil}</Text>
          ) : null}
          {dueDate ? (
            <Text style={styles.docRef}>Echeance : {dueDate}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinataire</Text>
          <Text style={styles.destinataireName}>{client.name}</Text>
          {client.organization ? (
            <Text style={styles.muted}>{client.organization}</Text>
          ) : null}
          {client.email ? (
            <Text style={styles.muted}>{client.email}</Text>
          ) : null}
          {client.phone ? (
            <Text style={styles.muted}>{client.phone}</Text>
          ) : null}
          {tvaExempt ? (
            <Text style={styles.exemptBadge}>TVA exoneree</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prestations</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qte</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>
              Prix unit.
            </Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>
              Total
            </Text>
          </View>
          {lines.map((line, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableText, styles.colDesc]}>
                {line.description}
              </Text>
              <Text style={[styles.tableText, styles.colQty]}>
                {line.quantity}
              </Text>
              <Text style={[styles.tableText, styles.colPrice]}>
                {formatAmount(line.unitPrice)}
              </Text>
              <Text style={[styles.tableText, styles.colTotal]}>
                {formatAmount(line.total)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsWrapper}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{formatAmount(subtotalHt)}</Text>
          </View>
          {brsEnabled ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>BRS (5%)</Text>
              <Text style={styles.totalValue}>{formatAmount(brsAmount)}</Text>
            </View>
          ) : null}
          {tvaEnabled && !tvaExempt ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA (18%)</Text>
              <Text style={styles.totalValue}>{formatAmount(tvaAmount)}</Text>
            </View>
          ) : null}
          {tvaExempt ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA</Text>
              <Text style={styles.totalValue}>Exoneree</Text>
            </View>
          ) : null}
          <View style={styles.totalTtcRow}>
            <Text style={styles.totalTtcLabel}>TOTAL TTC</Text>
            <Text style={styles.totalTtcValue}>{formatAmount(totalTtc)}</Text>
          </View>
        </View>

        {notes ? (
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text style={styles.footerLine}>
            {pdfFooterText} | {companyEmail} | {companyPhone}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
