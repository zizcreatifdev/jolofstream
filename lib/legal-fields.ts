// Champs legaux de l'editeur du site (Parametres > Informations de l'agence),
// affiches en tete de /mentions-legales ; une ligne vide est masquee
export const LEGAL_FIELDS = [
  { key: "company_name", label: "Raison sociale" },
  { key: "company_legal_form", label: "Forme juridique" },
  { key: "company_ninea", label: "NINEA" },
  { key: "company_rc", label: "Registre du commerce" },
  { key: "company_address", label: "Siège" },
  { key: "company_email", label: "Email" },
  { key: "company_phone", label: "Téléphone" },
  { key: "company_publication_manager", label: "Responsable de publication" },
] as const
