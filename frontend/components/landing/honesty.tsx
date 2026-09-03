import { BlurFade } from "@/components/ui/blur-fade";

export function Honesty() {
  return (
    <section className="py-24 md:py-32 bg-white dark:bg-black">
      <div className="mx-auto max-w-2xl px-6">
        <BlurFade delay={0.1} inView>
          <h2 className="font-sans text-5xl tracking-tight text-foreground mb-6">
            What this is (and isn&apos;t)
          </h2>
          <div className="font-inter text-xl text-muted-foreground space-y-6 leading-relaxed">
            <p>
              This is a personal showcase of real harness, loop, and context-engineering work. It is not a multi-tenant SaaS product.
            </p>
            <p>
              There is no account isolation, and anyone who signs in sees the same real data that I do. It&apos;s an open window into how I handle my own production incidents, built to demonstrate autonomous investigation capabilities.
            </p>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
