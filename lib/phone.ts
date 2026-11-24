// Numero de telephone : format senegalais (9 chiffres, avec ou sans +221)
// ou international (+ et 8 a 15 chiffres). Normalise en +XXXXXXXXX.
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null
  let value = input.trim().replace(/[\s.\-()/]/g, "")
  if (!value) return null
  if (value.startsWith("00")) value = `+${value.slice(2)}`
  if (/^[37]\d{8}$/.test(value)) return `+221${value}`
  if (/^221[37]\d{8}$/.test(value)) return `+${value}`
  if (/^\+221/.test(value)) return /^\+221[37]\d{8}$/.test(value) ? value : null
  if (/^\+[1-9]\d{7,14}$/.test(value)) return value
  return null
}

export const PHONE_ERROR = "Numéro invalide : 9 chiffres (77 123 45 67) ou format international (+33 6 12 34 56 78)."
