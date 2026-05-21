"use client"

import { PDFDownloadLink } from "@react-pdf/renderer"
import { Download } from "lucide-react"

import {
  PdfTemplate,
  type PdfTemplateProps,
} from "@/components/admin/documents/pdf-template"

export default function PdfDownload({
  fileName,
  ...props
}: PdfTemplateProps & { fileName: string }) {
  return (
    <PDFDownloadLink
      document={<PdfTemplate {...props} />}
      fileName={fileName}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
    >
      {({ loading }) => (
        <>
          <Download className="h-4 w-4" />
          {loading ? "Preparation..." : "Telecharger PDF"}
        </>
      )}
    </PDFDownloadLink>
  )
}
