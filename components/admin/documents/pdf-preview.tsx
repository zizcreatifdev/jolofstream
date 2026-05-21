"use client"

import { PDFViewer } from "@react-pdf/renderer"

import {
  PdfTemplate,
  type PdfTemplateProps,
} from "@/components/admin/documents/pdf-template"

export default function PdfPreview(props: PdfTemplateProps) {
  return (
    <PDFViewer
      style={{ width: "100%", height: "100%", border: "none" }}
      showToolbar={false}
    >
      <PdfTemplate {...props} />
    </PDFViewer>
  )
}
