import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { DotPattern } from "@/components/ui/dot-pattern";
import { BlurFade } from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden items-center justify-center min-h-ful pt-38 md:pt-40 md:pb-32 lg:pt-58 lg:pb-40">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white mask-[linear-gradient(to_bottom,black_60%,transparent)] dark:bg-black">
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className={cn(
            "fill-black/5 dark:fill-white/5",
          )}
        />
      </div>

      <div className="mx-auto max-w-4xl px-6">
        <BlurFade delay={0.1} inView>
          <div className="flex flex-col items-center text-center">
            <h1 className="font-sans text-5xl md:text-6xl lg:text-7xl tracking-tighter text-foreground text-balance">
              Your AI On-Call Engineer
            </h1>
            
            <p className="mt-6 font-inter text-lg md:text-xl text-muted-foreground max-w-2xl text-balance">
              SentryLoop autonomously investigates production incidents, tracing logs, metrics, and events to uncover the root cause. It drafts a clear fix proposal while keeping every change behind human approval.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link href="/auth/sign-in">
                <div className="relative rounded-lg">
                  <Button size="lg" className="px-8 py-4 font-sans cursor-pointer">
                    Get Started
                  </Button>
                  <BorderBeam 
                    size={48} 
                    duration={4} 
                    colorFrom="var(--color-neutral-400)" 
                    colorTo="var(--color-neutral-800)" 
                  />
                </div>
              </Link>
              
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="font-sans font-semibold px-8 py-4 cursor-pointer">
                  See how it works
                </Button>
              </Link>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
