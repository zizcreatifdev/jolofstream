import {
  AboutStatsSection,
  FeaturedServicesSection,
  FinalCtaSection,
  FormationsPreviewSection,
  HeroSection,
  PortfolioPreviewSection,
  ServiceBandSection,
  TestimonialsSection,
} from "@/components/public/home-sections"
import { JsonLd } from "@/components/public/json-ld"

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Jolof Stream",
          url: "https://jolofstream.com",
          logo: "https://jolofstream.com/logos/Logo_JolofStream_couleur.png",
          description:
            "Agence de captation et diffusion en direct. Dakar, Senegal.",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Dakar",
            addressCountry: "SN",
          },
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+221-70-241-48-48",
            contactType: "customer service",
            availableLanguage: ["French"],
          },
          sameAs: [],
        }}
      />
      <HeroSection />
      <ServiceBandSection />
      <AboutStatsSection />
      <FeaturedServicesSection />
      <PortfolioPreviewSection />
      <FormationsPreviewSection />
      <TestimonialsSection />
      <FinalCtaSection />
    </>
  )
}
