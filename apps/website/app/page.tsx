import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { CodeExamples } from "@/components/marketing/CodeExamples";
import { FAQ } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { FiveMinutePath } from "@/components/marketing/FiveMinutePath";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { NotAPlatform } from "@/components/marketing/NotAPlatform";
import { OpenSourceTrust } from "@/components/marketing/OpenSourceTrust";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { ProductLoop } from "@/components/marketing/ProductLoop";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { UseCases } from "@/components/marketing/UseCases";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <ProblemSection />
        <FiveMinutePath />
        <ProductLoop />
        <FeatureGrid />
        <CodeExamples />
        <UseCases />
        <ComparisonTable />
        <NotAPlatform />
        <OpenSourceTrust />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
