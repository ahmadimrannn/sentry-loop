import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Origin } from "@/components/landing/origin";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Architecture } from "@/components/landing/architecture";
import { Honesty } from "@/components/landing/honesty";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen dark:bg-black">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Origin />
        <HowItWorks />
        <Architecture />
        <Honesty />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
