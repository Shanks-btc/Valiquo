import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ProblemSection from "@/components/ProblemSection";
import HowItWorks from "@/components/HowItWorks";
import FlowDiagramSection from "@/components/FlowDiagramSection";
import ProofSection from "@/components/ProofSection";
import NegotiationSection from "@/components/NegotiationSection";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="w-full max-w-full">
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <FlowDiagramSection />
        <ProofSection />
        <NegotiationSection />
      </main>
    </>
  );
}
