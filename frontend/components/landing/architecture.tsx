import { BlurFade } from "@/components/ui/blur-fade";
import { GitPullRequest, Database, Shield } from "lucide-react";

export function Architecture() {
  return (
    <section id="architecture" className="py-24 md:py-32 bg-white dark:bg-black">
      <div className="mx-auto max-w-6xl px-6">
        <BlurFade delay={0.1} inView>
          <div className="mb-16">
            <h2 className="font-sans text-5xl tracking-tighter text-foreground">
              Architecture & guardrails
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <div className="flex flex-col gap-4 px-8 py-6 border rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                <h3 className="font-sans text-lg font-semibold tracking-tight text-foreground">
                  LangGraph & pgvector
                </h3>
              </div>
              <p className="font-inter text-muted-foreground leading-relaxed">
                LangGraph state machine, not a fixed pipeline &mdash; the number of investigation steps varies per incident. Postgres with pgvector stores every past investigation, so the agent checks its own history before starting a new one.
              </p>
            </div>

            <div className="flex flex-col gap-4 px-8 py-6 border rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                <h3 className="font-sans text-lg font-semibold tracking-tight text-foreground">
                  Read-only tools
                </h3>
              </div>
              <p className="font-inter text-muted-foreground leading-relaxed">
                No tool the agent can call is able to modify, restart, or deploy anything. Every tool is strictly read-only, limited to querying logs, checking metrics, and reading code.
              </p>
            </div>

            <div className="flex flex-col gap-4 px-8 py-6 border rounded-lg">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                <h3 className="font-sans text-lg font-semibold tracking-tight text-foreground">
                  Drafts, not deploys
                </h3>
              </div>
              <p className="font-inter text-muted-foreground leading-relaxed">
                Every proposed fix is just a draft. It sits behind a human approval step and is never applied automatically. You have the final say on every code change.
              </p>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
