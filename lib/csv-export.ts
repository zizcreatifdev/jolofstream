/**
 * Serialise un tableau de lignes en CSV (separateur ";" pour Excel FR).
 * Cellules contenant guillemets, virgules, points-virgules ou sauts de ligne
 * sont automatiquement quotees. Utilisable serveur et client.
 */
export function formatCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((cell) => {
          const v = (cell ?? "").toString()
          if (/[",\n;]/.test(v)) return `"${v.replace(/"/g, '""')}"`
          return v
        })
        .join(";")
    )
    .join("\n")
}

/**
 * BOM UTF-8 (﻿) pour que Excel detecte l'encodage.
 */
export const CSV_BOM = "﻿"

/**
 * Genere un CSV cote client (sep ; pour Excel FR, BOM UTF-8 pour les accents)
 * et declenche le telechargement.
 */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = formatCsv(rows)
  const blob = new Blob([CSV_BOM + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
