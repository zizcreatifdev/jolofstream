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

export default function HomePage() {
  return (
    <>
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
