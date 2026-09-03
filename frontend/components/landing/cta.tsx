import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { BlurFade } from "@/components/ui/blur-fade";
import { Ripple } from "@/components/ui/ripple"

export function Cta() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32  dark:bg-black">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full dark:bg-black mask-[radial-gradient(ellipse_at_center,black_40%,transparent_70%)]">
        <Ripple />
      </div>

      <div className="mx-auto max-w-4xl px-6">
        <BlurFade delay={0.1} inView>
          <div className="flex flex-col items-center text-center">
            <h2 className="font-sans text-4xl md:text-6xl tracking-tighter text-foreground text-balance">
              Let the agent investigate your next incident.
            </h2>

            <div className="mt-10">
              <Link href="/auth/sign-in">
                <div className="relative rounded-lg">
                  <Button className="px-12 py-6 text-lg font-sans">
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
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
