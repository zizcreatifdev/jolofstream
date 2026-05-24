import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"

import { TEMPLATE_TITLES, type TemplateType } from "@/lib/contrats"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jolofstream.vercel.app"
const LOGO_COULEUR = `${SITE_URL}/logos/Logo_JolofStream_couleur.png`

export type ContratPdfData = {
  reference: string
  templateType: TemplateType
  notes?: string | null
  createdAt: string
}

export type ClientPdfData = {
  name: string
  organization?: string | null
  email?: string | null
  phone?: string | null
}

export type ProjectPdfData = {
  title: string
  type?: string | null
  date?: string | null
  location?: string | null
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingTop: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#18181b",
    lineHeight: 1.45,
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#C8151B",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    borderBottom: "1pt solid #e4e4e7",
    paddingBottom: 10,
  },
  logo: { fontSize: 18, fontWeight: "bold", color: "#C8151B" },
  logoSub: { fontSize: 9, color: "#71717a", marginTop: 2 },
  companyInfo: { fontSize: 9, color: "#52525b", textAlign: "right" },
  refBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  refBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#fafafa",
    borderRadius: 4,
    border: "0.5pt solid #e4e4e7",
  },
  refLabel: { fontSize: 8, color: "#71717a", textTransform: "uppercase" },
  refValue: { fontSize: 10, fontWeight: "bold", color: "#18181b" },
  confidentielBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#C8151B",
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 6,
    letterSpacing: 1,
  },
  meta: {
    fontSize: 9,
    color: "#71717a",
    textAlign: "center",
    marginBottom: 18,
  },
  partiesBlock: {
    backgroundColor: "#fafafa",
    border: "0.5pt solid #e4e4e7",
    borderRadius: 4,
    padding: 12,
    marginBottom: 18,
  },
  partieLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#C8151B",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  partieText: { fontSize: 10, color: "#18181b", marginBottom: 6 },
  article: { marginBottom: 14 },
  articleTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 4,
    borderBottom: "0.5pt solid #e4e4e7",
    paddingBottom: 2,
  },
  articleText: { fontSize: 10, color: "#27272a", textAlign: "justify" },
  list: { marginLeft: 10, marginTop: 2 },
  listItem: { fontSize: 10, color: "#27272a", marginBottom: 2 },
  signaturesSeparator: {
    marginTop: 28,
    marginBottom: 14,
    borderTop: "1pt dashed #a1a1aa",
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signBlock: { width: "47%" },
  signTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  signHint: { fontSize: 8, color: "#71717a", marginBottom: 4 },
  signZone: {
    height: 60,
    borderBottom: "0.5pt dashed #71717a",
    marginBottom: 4,
    alignItems: "flex-start",
    justifyContent: "flex-end",
  },
  signImage: {
    maxHeight: 56,
    maxWidth: 180,
  },
  signCaption: {
    fontSize: 9,
    color: "#27272a",
    fontWeight: "bold",
  },
  signCaptionSub: { fontSize: 8, color: "#71717a", marginTop: 1 },
  faitA: {
    marginTop: 18,
    fontSize: 9,
    color: "#52525b",
    fontStyle: "italic",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#a1a1aa",
    textAlign: "center",
    borderTop: "0.5pt solid #e4e4e7",
    paddingTop: 6,
  },
  notesBlock: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#fef9c3",
    borderLeft: "2pt solid #F5B800",
  },
  notesLabel: { fontSize: 8, fontWeight: "bold", color: "#92400e" },
  notesText: { fontSize: 9, color: "#78350f" },
})

type ArticlesByTemplate = {
  obligationsPrestataire: { title: string; items: string[] }
  obligationsClient: { title: string; items: string[] }
}

function articlesFor(t: TemplateType): ArticlesByTemplate {
  if (t === "formation") {
    return {
      obligationsPrestataire: {
        title: "Contenu de la formation",
        items: [
          "Programme detaille, duree et lieu communiques au prealable.",
          "Nombre de participants maximum fixe selon le pack choisi.",
          "Materiel pedagogique et supports fournis aux participants.",
          "Attestation de fin de formation remise a chaque participant.",
        ],
      },
      obligationsClient: {
        title: "Obligations du Client",
        items: [
          "Presence et ponctualite des participants designes.",
          "Mise a disposition d'un espace adapte si formation intra.",
          "Paiement integral avant le debut de la formation.",
          "Communication des prerequis techniques en amont.",
        ],
      },
    }
  }
  return {
    obligationsPrestataire: {
      title: "Obligations de Jolof Stream",
      items: [
        "Mise a disposition du materiel professionnel necessaire a la prestation.",
        "Presence d'une equipe technique qualifiee le jour de la prestation.",
        "Livraison des fichiers et masters dans les delais convenus.",
        "Backup systematique des enregistrements pendant 30 jours minimum.",
      ],
    },
    obligationsClient: {
      title: "Obligations du Client",
      items: [
        "Faciliter l'acces au lieu de prestation et aux installations techniques.",
        "Fournir les informations techniques et creatives necessaires.",
        "Designer un interlocuteur unique pour la coordination le jour J.",
        "Regler les honoraires selon les modalites convenues au devis.",
      ],
    },
  }
}

function Article({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.article}>
      <Text style={styles.articleTitle}>
        Article {number} - {title}
      </Text>
      {children}
    </View>
  )
}

function Header({
  companyAddress,
  companyEmail,
  companyPhone,
  companyNinea,
}: {
  companyAddress: string
  companyEmail: string
  companyPhone: string
  companyNinea: string
}) {
  return (
    <View style={styles.header} fixed>
      <View>
        <Image
          src={LOGO_COULEUR}
          style={{ width: 140, height: 42, objectFit: "contain" }}
        />
      </View>
      <View style={styles.companyInfo}>
        <Text>{companyAddress}</Text>
        <Text>{companyPhone}</Text>
        <Text>{companyEmail}</Text>
        <Text>NINEA : {companyNinea}</Text>
      </View>
    </View>
  )
}

function Footer({
  companyName,
  reference,
  createdAt,
}: {
  companyName: string
  reference: string
  createdAt: string
}) {
  return (
    <Text
      style={styles.footer}
      fixed
      render={({ pageNumber, totalPages }) =>
        `${companyName} - Contrat ${reference} - ${createdAt} - Page ${pageNumber} sur ${totalPages}`
      }
    />
  )
}

export function PdfContrat({
  contrat,
  client,
  project,
  signatureUrl,
  companyName,
  companyAddress,
  companyEmail,
  companyPhone,
  companyNinea,
  date,
}: {
  contrat: ContratPdfData
  client: ClientPdfData
  project: ProjectPdfData
  signatureUrl?: string | null
  companyName: string
  companyAddress: string
  companyEmail: string
  companyPhone: string
  companyNinea: string
  date: string
}) {
  const title = TEMPLATE_TITLES[contrat.templateType]
  const articles = articlesFor(contrat.templateType)
  const showConfidentiel = contrat.templateType !== "formation"
  const hasSignature =
    typeof signatureUrl === "string" && /^https?:\/\//.test(signatureUrl)

  const clientLine =
    client.organization && client.organization.trim()
      ? `${client.name} - ${client.organization}`
      : client.name

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topAccent} fixed />
        <Header
          companyAddress={companyAddress}
          companyEmail={companyEmail}
          companyPhone={companyPhone}
          companyNinea={companyNinea}
        />

        <View style={styles.refBlock}>
          <View style={styles.refBadge}>
            <Text style={styles.refLabel}>Reference :</Text>
            <Text style={styles.refValue}>{contrat.reference}</Text>
          </View>
          {showConfidentiel ? (
            <Text style={styles.confidentielBadge}>CONFIDENTIEL</Text>
          ) : null}
        </View>

        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.meta}>Etabli le {contrat.createdAt}</Text>

        <View style={styles.partiesBlock}>
          <Text style={styles.partieLabel}>Entre les soussignes</Text>
          <Text style={styles.partieText}>
            {companyName}, dont le siege social est situe a{" "}
            {companyAddress}, NINEA : {companyNinea}, represente par ses
            cofondateurs, ci-apres designe le Prestataire,
          </Text>
          <Text style={styles.partieLabel}>Et</Text>
          <Text style={styles.partieText}>
            {clientLine}
            {client.email ? `, email : ${client.email}` : ""}
            {client.phone ? `, telephone : ${client.phone}` : ""}, ci-apres
            designe le Client.
          </Text>
        </View>

        <Article number={1} title="Objet du contrat">
          <Text style={styles.articleText}>
            Le present contrat a pour objet la realisation par le Prestataire
            de la prestation suivante :{" "}
            <Text style={{ fontWeight: "bold" }}>{project.title}</Text>
            {project.type ? ` (${project.type})` : ""}
            {project.location ? ` - lieu : ${project.location}` : ""}.
          </Text>
        </Article>

        <Article number={2} title="Duree">
          <Text style={styles.articleText}>
            {project.date
              ? `La prestation est prevue le ${project.date}.`
              : "La prestation sera realisee selon l'accord entre les parties et le planning communique."}
          </Text>
        </Article>

        <Article number={3} title="Modalites de paiement">
          <Text style={styles.articleText}>
            Le paiement intervient par Wave Business ou par virement
            bancaire. Un acompte de 50 % est exigible a la signature du
            present contrat. Le solde est du le jour de la prestation, sauf
            stipulation differente convenue dans le devis associe.
          </Text>
        </Article>

        <Article number={4} title={articles.obligationsPrestataire.title}>
          <View style={styles.list}>
            {articles.obligationsPrestataire.items.map((o, i) => (
              <Text key={`op-${i}`} style={styles.listItem}>
                - {o}
              </Text>
            ))}
          </View>
        </Article>

        <Footer
          companyName={companyName}
          reference={contrat.reference}
          createdAt={contrat.createdAt}
        />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.topAccent} fixed />
        <Header
          companyAddress={companyAddress}
          companyEmail={companyEmail}
          companyPhone={companyPhone}
          companyNinea={companyNinea}
        />

        <Article number={5} title={articles.obligationsClient.title}>
          <View style={styles.list}>
            {articles.obligationsClient.items.map((o, i) => (
              <Text key={`oc-${i}`} style={styles.listItem}>
                - {o}
              </Text>
            ))}
          </View>
        </Article>

        <Article number={6} title="Propriete intellectuelle">
          <Text style={styles.articleText}>
            Les enregistrements et fichiers sources restent la propriete du
            Prestataire jusqu&apos;au paiement integral. Apres reglement
            complet, le Client dispose d&apos;une licence d&apos;utilisation
            non exclusive sur les livrables finaux pour ses besoins
            internes et de communication.
          </Text>
        </Article>

        <Article number={7} title="Resiliation">
          <Text style={styles.articleText}>
            En cas de resiliation a l&apos;initiative du Client moins de 7
            jours avant la prestation, l&apos;acompte verse est conserve par
            le Prestataire au titre des frais engages. En cas de
            resiliation par le Prestataire pour cas de force majeure,
            l&apos;acompte est integralement rembourse.
          </Text>
        </Article>

        <Article number={8} title="Loi applicable">
          <Text style={styles.articleText}>
            Le present contrat est soumis au droit senegalais. Tout litige
            qui ne pourrait etre regle a l&apos;amiable sera porte devant
            les juridictions competentes de Dakar.
          </Text>
        </Article>

        {contrat.notes && contrat.notes.trim().length > 0 ? (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>Notes annexes</Text>
            <Text style={styles.notesText}>{contrat.notes}</Text>
          </View>
        ) : null}

        <View style={styles.signaturesSeparator} />
        <View style={styles.signatures}>
          <View style={styles.signBlock}>
            <Text style={styles.signTitle}>Pour {companyName}</Text>
            <Text style={styles.signHint}>Cachet et signature</Text>
            <View style={styles.signZone}>
              {hasSignature ? (
                <Image src={signatureUrl as string} style={styles.signImage} />
              ) : null}
            </View>
            <Text style={styles.signCaption}>{companyName}</Text>
            <Text style={styles.signCaptionSub}>Cofondateurs</Text>
          </View>
          <View style={styles.signBlock}>
            <Text style={styles.signTitle}>Le Client / La Societe</Text>
            <Text style={styles.signHint}>
              Lu et approuve - Signature precedee de la mention manuscrite
            </Text>
            <View style={styles.signZone} />
            <Text style={styles.signCaption}>
              {client.organization || client.name}
            </Text>
            <Text style={styles.signCaptionSub}>
              {client.organization ? `Represente par ${client.name}` : "Le Client"}
            </Text>
          </View>
        </View>

        <Text style={styles.faitA}>Fait a Dakar, le {date}</Text>

        <Footer
          companyName={companyName}
          reference={contrat.reference}
          createdAt={contrat.createdAt}
        />
      </Page>
    </Document>
  )
}
