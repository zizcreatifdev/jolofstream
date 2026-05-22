import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

import { TEMPLATE_TITLES, type TemplateType } from "@/lib/contrats"

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
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#18181b",
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    borderBottom: "2pt solid #C8151B",
    paddingBottom: 10,
  },
  logo: { fontSize: 20, fontWeight: "bold", color: "#C8151B" },
  logoSub: { fontSize: 9, color: "#71717a", marginTop: 2 },
  companyInfo: { fontSize: 9, color: "#52525b", textAlign: "right" },
  docTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
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
  signatures: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signBlock: { width: "45%" },
  signTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 36,
  },
  signLine: { borderTop: "0.5pt solid #18181b", paddingTop: 4 },
  signHint: { fontSize: 8, color: "#71717a", marginTop: 4 },
  faitA: {
    marginTop: 18,
    fontSize: 9,
    color: "#52525b",
    fontStyle: "italic",
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

const OBLIGATIONS_PRESTATAIRE: Record<TemplateType, string[]> = {
  prestation_services: [
    "Assurer la prestation audiovisuelle convenue (captation, montage, livraison).",
    "Respecter les delais et les conditions techniques.",
    "Mettre a disposition le materiel professionnel necessaire.",
    "Livrer un master final conforme aux specifications du devis.",
  ],
  ceo_content: [
    "Realiser le shooting CEO Content selon le pack choisi (Essentiel ou Premium).",
    "Fournir les contenus video et photo livrables dans le delai convenu.",
    "Editer et livrer les formats adaptes aux reseaux sociaux.",
  ],
  creator_weekend: [
    "Encadrer le creator weekend (programmation et coaching).",
    "Mettre a disposition le studio et le materiel pendant la session.",
    "Assurer la livraison des rushs et exports prevus au pack.",
  ],
  formation: [
    "Dispenser la formation au programme convenu, par formateurs qualifies.",
    "Fournir les supports pedagogiques et les attestations de fin de session.",
    "Garantir un encadrement personnalise et un suivi post-formation.",
  ],
  personnalise: [
    "Executer la prestation conformement au descriptif annexe au present contrat.",
    "Respecter les delais et conditions convenus.",
  ],
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
  companyName,
  companyAddress,
  companyEmail,
  companyPhone,
  companyNinea,
}: {
  companyName: string
  companyAddress: string
  companyEmail: string
  companyPhone: string
  companyNinea: string
}) {
  return (
    <View style={styles.header} fixed>
      <View>
        <Text style={styles.logo}>{companyName}</Text>
        <Text style={styles.logoSub}>Agence audiovisuelle</Text>
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
}: {
  companyName: string
  reference: string
}) {
  return (
    <Text
      style={styles.footer}
      fixed
      render={({ pageNumber, totalPages }) =>
        `${companyName} - Contrat ${reference} - Page ${pageNumber} / ${totalPages}`
      }
    />
  )
}

export function PdfContrat({
  contrat,
  client,
  project,
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
  companyName: string
  companyAddress: string
  companyEmail: string
  companyPhone: string
  companyNinea: string
  date: string
}) {
  const title = TEMPLATE_TITLES[contrat.templateType]
  const obligations = OBLIGATIONS_PRESTATAIRE[contrat.templateType]

  const clientLine =
    client.organization && client.organization.trim()
      ? `${client.name} - ${client.organization}`
      : client.name

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header
          companyName={companyName}
          companyAddress={companyAddress}
          companyEmail={companyEmail}
          companyPhone={companyPhone}
          companyNinea={companyNinea}
        />

        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.meta}>
          Reference : {contrat.reference} - Date : {contrat.createdAt}
        </Text>

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
            de la prestation suivante : <Text style={{ fontWeight: "bold" }}>{project.title}</Text>
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

        <Article number={4} title="Obligations du Prestataire">
          <View style={styles.list}>
            {obligations.map((o, i) => (
              <Text key={`o-${i}`} style={styles.listItem}>
                - {o}
              </Text>
            ))}
          </View>
        </Article>

        <Footer companyName={companyName} reference={contrat.reference} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Header
          companyName={companyName}
          companyAddress={companyAddress}
          companyEmail={companyEmail}
          companyPhone={companyPhone}
          companyNinea={companyNinea}
        />

        <Article number={5} title="Obligations du Client">
          <Text style={styles.articleText}>
            Le Client s&apos;engage a fournir au Prestataire l&apos;ensemble
            des informations et acces necessaires a la bonne execution de la
            prestation : acces au lieu, autorisations de tournage,
            coordination des intervenants, validation des elements creatifs.
          </Text>
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

        <Text style={styles.faitA}>Fait a Dakar, le {date}</Text>

        <View style={styles.signatures}>
          <View style={styles.signBlock}>
            <Text style={styles.signTitle}>Pour {companyName}</Text>
            <View style={styles.signLine}>
              <Text style={styles.signHint}>Signature et cachet</Text>
            </View>
          </View>
          <View style={styles.signBlock}>
            <Text style={styles.signTitle}>Le Client</Text>
            <View style={styles.signLine}>
              <Text style={styles.signHint}>
                Lu et approuve - Signature precedee de la mention manuscrite
              </Text>
            </View>
          </View>
        </View>

        <Footer companyName={companyName} reference={contrat.reference} />
      </Page>
    </Document>
  )
}
