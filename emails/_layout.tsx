import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import type { ReactNode } from "react"

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  padding: "24px 0",
  color: "#18181b",
}

const container = {
  margin: "0 auto",
  maxWidth: "560px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
}

const header = {
  backgroundColor: "#C8151B",
  padding: "20px 28px",
  color: "#ffffff",
}

const logo = {
  fontSize: "22px",
  fontWeight: "bold" as const,
  letterSpacing: "-0.01em",
  margin: "0",
  color: "#ffffff",
}

const logoSub = {
  fontSize: "12px",
  margin: "4px 0 0",
  color: "#ffffff",
  opacity: 0.85,
}

const body = {
  padding: "28px",
}

const footer = {
  padding: "16px 28px 24px",
  textAlign: "center" as const,
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "1.5",
}

export function EmailLayout({
  preview,
  children,
  contactEmail = "jolofstream@gmail.com",
  contactPhone = "+221 70 241 48 48",
}: {
  preview: string
  children: ReactNode
  contactEmail?: string
  contactPhone?: string
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Jolof Stream</Text>
            <Text style={logoSub}>Captation et diffusion en direct</Text>
          </Section>
          <Section style={body}>{children}</Section>
          <Hr style={{ margin: "0", borderTop: "1px solid #e4e4e7" }} />
          <Section style={footer}>
            <Text style={{ margin: "0" }}>
              {contactEmail} &nbsp;|&nbsp; {contactPhone}
            </Text>
            <Text style={{ margin: "4px 0 0" }}>Dakar, Senegal</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const emailStyles = {
  heading: {
    fontSize: "20px",
    fontWeight: "700" as const,
    margin: "0 0 12px",
    color: "#18181b",
  },
  paragraph: {
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 12px",
    color: "#3f3f46",
  },
  card: {
    backgroundColor: "#fafafa",
    border: "1px solid #e4e4e7",
    borderRadius: "8px",
    padding: "16px",
    marginTop: "12px",
    marginBottom: "12px",
  },
  cardRow: {
    fontSize: "13px",
    margin: "0 0 4px",
    color: "#3f3f46",
  },
  cardLabel: {
    fontWeight: "600" as const,
    color: "#52525b",
  },
  alert: {
    backgroundColor: "#FEF9C3",
    border: "1px solid #F5B800",
    borderRadius: "8px",
    padding: "12px 14px",
    margin: "16px 0",
    fontSize: "13px",
    color: "#854d0e",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#C8151B",
    color: "#ffffff",
    padding: "10px 18px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600" as const,
    margin: "12px 0",
  },
}
