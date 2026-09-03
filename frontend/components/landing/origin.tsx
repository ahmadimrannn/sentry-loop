import { BlurFade } from "@/components/ui/blur-fade";

export function Origin() {
  return (
    <section className="py-24 md:py-32 bg-white dark:bg-black">
      <div className="mx-auto max-w-2xl px-6">
        <BlurFade delay={0.1} inView>
          <h2 className="font-sans text-5xl tracking-tight text-foreground mb-6">
            Why I built this
          </h2>
          <div className="font-inter text-lg text-muted-foreground space-y-6 leading-relaxed">
            <p>
              I built SentryLoop to solve a real problem for my own production applications. It investigates my actual logs, and the incidents shown elsewhere on this site are real, not sample data.
            </p>
            <p>
              When an alert fires, I need to know what broke and why, but digging through traces and codebase history manually takes too long. This agent is a direct solution to that friction: it does the legwork of exploring the codebase and drafting a fix, so I only have to review its work.
            </p>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
