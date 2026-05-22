/**
 * Genere un CSV cote client (sep ; pour Excel FR, BOM UTF-8 pour les accents)
 * et declenche le telechargement.
 */
export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
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
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
