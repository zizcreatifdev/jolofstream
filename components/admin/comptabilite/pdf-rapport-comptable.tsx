import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jolofstream.vercel.app"
const LOGO_COULEUR = `${SITE_URL}/logos/Logo_JolofStream_couleur.png`

export type ResumeData = {
  totalRecettes: number
  totalDepenses: number
  benefice: number
  marge: number
  countRecettes: number
  countDepenses: number
}

export type RecetteItem = {
  date: string
  reference: string
  client: string
  totalTtc: number
}

export type DepenseItem = {
  date: string
  description: string
  categorie: string
  montant: number
}

export type RentabiliteItem = {
  title: string
  client: string
  recettes: number
  depenses: number
  benefice: number
  marge: number
}

export type CategorieTotal = {
  categorie: string
  montant: number
  pourcentage: number
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#18181b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    borderBottom: "2pt solid #C8151B",
    paddingBottom: 12,
  },
  logo: { fontSize: 22, fontWeight: "bold", color: "#C8151B" },
  logoSub: { fontSize: 9, color: "#71717a", marginTop: 2 },
  companyInfo: { fontSize: 9, color: "#52525b", textAlign: "right" },
  docTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 6 },
  docMeta: { fontSize: 9, color: "#71717a", marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 8,
    marginTop: 6,
    borderBottom: "1pt solid #e4e4e7",
    paddingBottom: 4,
  },
  resumeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  resumeCard: {
    width: "50%",
    padding: 12,
    borderRight: "1pt solid #e4e4e7",
    borderBottom: "1pt solid #e4e4e7",
  },
  resumeLabel: {
    fontSize: 9,
    color: "#71717a",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  resumeValue: { fontSize: 16, fontWeight: "bold", color: "#18181b" },
  resumeValueRed: { fontSize: 16, fontWeight: "bold", color: "#C8151B" },
  resumeValuePositive: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#059669",
  },
  resumeValueNegative: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C8151B",
  },
  margeBarLabel: {
    fontSize: 9,
    color: "#71717a",
    marginTop: 14,
    marginBottom: 4,
  },
  margeBarTrack: {
    width: "100%",
    height: 14,
    backgroundColor: "#f4f4f5",
    borderRadius: 3,
    overflow: "hidden",
  },
  margeBarFill: {
    height: 14,
    backgroundColor: "#C8151B",
  },
  margeBarText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#18181b",
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#C8151B",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: "0.5pt solid #e4e4e7",
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: "0.5pt solid #e4e4e7",
    backgroundColor: "#fafafa",
  },
  tableRowHighlight: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: "0.5pt solid #e4e4e7",
    backgroundColor: "#FFF3C0",
  },
  tableText: { fontSize: 9, color: "#18181b" },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: "#C8151B",
    marginTop: 6,
  },
  totalText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },
  emptyText: {
    fontSize: 10,
    color: "#71717a",
    fontStyle: "italic",
    paddingVertical: 12,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    fontSize: 8,
    color: "#a1a1aa",
    textAlign: "center",
    borderTop: "0.5pt solid #e4e4e7",
    paddingTop: 6,
  },
  catRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottom: "0.5pt solid #e4e4e7",
  },
  catName: { fontSize: 9, color: "#18181b" },
  catValue: { fontSize: 9, fontWeight: "bold", color: "#18181b" },
  catPct: { fontSize: 9, color: "#71717a", width: 50, textAlign: "right" },
})

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA"
}

function formatPct(n: number) {
  if (!Number.isFinite(n)) return "0%"
  return n.toFixed(1) + "%"
}

function Header({
  companyAddress,
  periode,
  generatedAt,
}: {
  companyAddress: string
  periode: string
  generatedAt: string
}) {
  return (
    <View>
      <View style={styles.header} fixed>
        <View>
          <Image
            src={LOGO_COULEUR}
            style={{ width: 140, height: 42, objectFit: "contain" }}
          />
        </View>
        <View style={styles.companyInfo}>
          <Text>{companyAddress}</Text>
          <Text>Genere le {generatedAt}</Text>
        </View>
      </View>
      <Text style={styles.docTitle}>Rapport Comptable</Text>
      <Text style={styles.docMeta}>Periode : {periode}</Text>
    </View>
  )
}

function Footer({ companyName }: { companyName: string }) {
  return (
    <Text
      style={styles.footer}
      fixed
      render={({ pageNumber, totalPages }) =>
        `${companyName} - Rapport comptable - Page ${pageNumber} / ${totalPages}`
      }
    />
  )
}

export function PdfRapportComptable({
  periode,
  resume,
  recettes,
  depenses,
  rentabilite,
  categories,
  companyName,
  companyAddress,
  generatedAt,
}: {
  periode: string
  resume: ResumeData
  recettes: RecetteItem[]
  depenses: DepenseItem[]
  rentabilite: RentabiliteItem[]
  categories: CategorieTotal[]
  companyName: string
  companyAddress: string
  generatedAt: string
}) {
  const margeBarPct = Math.max(0, Math.min(100, resume.marge))
  const top3 = rentabilite.slice(0, 3).map((p) => p.title)

  return (
    <Document>
      {/* Page 1 — Resume */}
      <Page size="A4" style={styles.page}>
        <Header
          companyAddress={companyAddress}
          periode={periode}
          generatedAt={generatedAt}
        />
        <Text style={styles.sectionTitle}>Synthese de la periode</Text>
        <View style={styles.resumeGrid}>
          <View style={styles.resumeCard}>
            <Text style={styles.resumeLabel}>Recettes totales</Text>
            <Text style={styles.resumeValuePositive}>
              {formatMoney(resume.totalRecettes)}
            </Text>
            <Text style={styles.logoSub}>
              {resume.countRecettes} facture
              {resume.countRecettes > 1 ? "s" : ""} payee
              {resume.countRecettes > 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.resumeCard}>
            <Text style={styles.resumeLabel}>Depenses totales</Text>
            <Text style={styles.resumeValueRed}>
              {formatMoney(resume.totalDepenses)}
            </Text>
            <Text style={styles.logoSub}>
              {resume.countDepenses} depense
              {resume.countDepenses > 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.resumeCard}>
            <Text style={styles.resumeLabel}>Benefice net</Text>
            <Text
              style={
                resume.benefice >= 0
                  ? styles.resumeValuePositive
                  : styles.resumeValueNegative
              }
            >
              {formatMoney(resume.benefice)}
            </Text>
          </View>
          <View style={styles.resumeCard}>
            <Text style={styles.resumeLabel}>Marge</Text>
            <Text style={styles.resumeValue}>{formatPct(resume.marge)}</Text>
          </View>
        </View>

        <Text style={styles.margeBarLabel}>Indicateur de marge</Text>
        <View style={styles.margeBarTrack}>
          <View
            style={[
              styles.margeBarFill,
              { width: `${margeBarPct}%` },
            ]}
          />
        </View>
        <Text style={styles.margeBarText}>{formatPct(resume.marge)}</Text>

        <Footer companyName={companyName} />
      </Page>

      {/* Page 2 — Recettes */}
      <Page size="A4" style={styles.page}>
        <Header
          companyAddress={companyAddress}
          periode={periode}
          generatedAt={generatedAt}
        />
        <Text style={styles.sectionTitle}>
          Recettes - Factures payees et paiements formations
        </Text>
        {recettes.length === 0 ? (
          <Text style={styles.emptyText}>
            Aucune recette sur cette periode.
          </Text>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: 75 }]}>Date</Text>
              <Text style={[styles.tableHeaderText, { width: 110 }]}>
                Reference
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Client</Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: 100, textAlign: "right" },
                ]}
              >
                Total TTC
              </Text>
            </View>
            {recettes.map((r, i) => (
              <View
                key={`rec-${i}`}
                style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.tableText, { width: 75 }]}>{r.date}</Text>
                <Text style={[styles.tableText, { width: 110 }]}>
                  {r.reference}
                </Text>
                <Text style={[styles.tableText, { flex: 1 }]}>{r.client}</Text>
                <Text
                  style={[
                    styles.tableText,
                    { width: 100, textAlign: "right" },
                  ]}
                >
                  {formatMoney(r.totalTtc)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={[styles.totalText, { flex: 1 }]}>Total recettes</Text>
              <Text style={[styles.totalText, { width: 100, textAlign: "right" }]}>
                {formatMoney(resume.totalRecettes)}
              </Text>
            </View>
          </View>
        )}
        <Footer companyName={companyName} />
      </Page>

      {/* Page 3 — Depenses */}
      <Page size="A4" style={styles.page}>
        <Header
          companyAddress={companyAddress}
          periode={periode}
          generatedAt={generatedAt}
        />
        <Text style={styles.sectionTitle}>Depenses</Text>
        {depenses.length === 0 ? (
          <Text style={styles.emptyText}>
            Aucune depense sur cette periode.
          </Text>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: 75 }]}>Date</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                Description
              </Text>
              <Text style={[styles.tableHeaderText, { width: 110 }]}>
                Categorie
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: 100, textAlign: "right" },
                ]}
              >
                Montant
              </Text>
            </View>
            {depenses.map((d, i) => (
              <View
                key={`dep-${i}`}
                style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.tableText, { width: 75 }]}>{d.date}</Text>
                <Text style={[styles.tableText, { flex: 1 }]}>
                  {d.description}
                </Text>
                <Text style={[styles.tableText, { width: 110 }]}>
                  {d.categorie}
                </Text>
                <Text
                  style={[
                    styles.tableText,
                    { width: 100, textAlign: "right" },
                  ]}
                >
                  {formatMoney(d.montant)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={[styles.totalText, { flex: 1 }]}>Total depenses</Text>
              <Text
                style={[styles.totalText, { width: 100, textAlign: "right" }]}
              >
                {formatMoney(resume.totalDepenses)}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
              Repartition par categorie
            </Text>
            {categories.map((c, i) => (
              <View key={`cat-${i}`} style={styles.catRow}>
                <Text style={styles.catName}>{c.categorie}</Text>
                <Text style={styles.catValue}>{formatMoney(c.montant)}</Text>
                <Text style={styles.catPct}>{formatPct(c.pourcentage)}</Text>
              </View>
            ))}
          </View>
        )}
        <Footer companyName={companyName} />
      </Page>

      {/* Page 4 — Rentabilite */}
      <Page size="A4" style={styles.page}>
        <Header
          companyAddress={companyAddress}
          periode={periode}
          generatedAt={generatedAt}
        />
        <Text style={styles.sectionTitle}>Rentabilite par projet</Text>
        {rentabilite.length === 0 ? (
          <Text style={styles.emptyText}>
            Aucun projet avec des donnees financieres sur cette periode.
          </Text>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Projet</Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: 75, textAlign: "right" },
                ]}
              >
                Recettes
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: 75, textAlign: "right" },
                ]}
              >
                Depenses
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: 75, textAlign: "right" },
                ]}
              >
                Benefice
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: 50, textAlign: "right" },
                ]}
              >
                Marge
              </Text>
            </View>
            {rentabilite.map((p, i) => {
              const isTop = top3.includes(p.title)
              return (
                <View
                  key={`renta-${i}`}
                  style={
                    isTop
                      ? styles.tableRowHighlight
                      : i % 2 === 0
                        ? styles.tableRow
                        : styles.tableRowAlt
                  }
                >
                  <Text style={[styles.tableText, { flex: 2 }]}>
                    {isTop ? "* " : ""}
                    {p.title}
                  </Text>
                  <Text
                    style={[
                      styles.tableText,
                      { width: 75, textAlign: "right" },
                    ]}
                  >
                    {formatMoney(p.recettes)}
                  </Text>
                  <Text
                    style={[
                      styles.tableText,
                      { width: 75, textAlign: "right" },
                    ]}
                  >
                    {formatMoney(p.depenses)}
                  </Text>
                  <Text
                    style={[
                      styles.tableText,
                      { width: 75, textAlign: "right" },
                    ]}
                  >
                    {formatMoney(p.benefice)}
                  </Text>
                  <Text
                    style={[
                      styles.tableText,
                      { width: 50, textAlign: "right" },
                    ]}
                  >
                    {formatPct(p.marge)}
                  </Text>
                </View>
              )
            })}
          </View>
        )}
        <Text
          style={[styles.logoSub, { marginTop: 8, fontStyle: "italic" }]}
        >
          * Top 3 projets les plus rentables (en evidence jaune)
        </Text>
        <Footer companyName={companyName} />
      </Page>
    </Document>
  )
}
