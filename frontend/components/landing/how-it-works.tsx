"use client";

import React, { useRef } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";

const Node = React.forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex h-16 w-40 items-center justify-center rounded-xl border bg-white px-4 text-center font-sans text-sm font-medium shadow-sm dark:bg-black dark:border-white/10 dark:text-white",
        className,
      )}
    >
      {children}
    </div>
  );
});
Node.displayName = "Node";

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const node1Ref = useRef<HTMLDivElement>(null);
  const node2Ref = useRef<HTMLDivElement>(null);
  const node3Ref = useRef<HTMLDivElement>(null);
  const node4Ref = useRef<HTMLDivElement>(null);
  const node5Ref = useRef<HTMLDivElement>(null);
  const node6Ref = useRef<HTMLDivElement>(null);
  const node7Ref = useRef<HTMLDivElement>(null);

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-white dark:bg-black">
      <div className="mx-auto max-w-6xl px-6">
        <BlurFade delay={0.1} inView>
          <div className="mb-16 text-center">
            <h2 className="font-sans text-5xl tracking-tight text-foreground">
              How the investigation loop works
            </h2>
          </div>

          <div
            className="relative flex w-full mx-auto flex-col items-center justify-center gap-12 overflow-hidden rounded-2xl border border-black/5 bg-black/2 p-10 md:p-20 dark:border-white/5 dark:bg-white/2"
            ref={containerRef}
          >
            {/* Top row */}
            <div className="flex w-full flex-col md:flex-row justify-between items-center z-10 gap-8">
              <Node ref={node1Ref}>1. Signal comes in</Node>
              <Node ref={node2Ref}>2. Agent picks a tool</Node>
              <Node ref={node3Ref}>3. Reads real result</Node>
            </div>
            
            {/* Middle row */}
            <div className="flex w-full flex-row justify-center items-center z-10 my-4 md:my-0">
               <Node ref={node4Ref} className="border-black dark:border-white border-2">4. Updates hypothesis</Node>
            </div>

            {/* Bottom row */}
            <div className="flex w-full flex-col md:flex-row justify-between items-center z-10 gap-8">
              <Node ref={node5Ref}>5. Decides to stop</Node>
              <Node ref={node6Ref}>6. Drafts fix proposal</Node>
              <Node ref={node7Ref}>7. Human approves</Node>
            </div>

            {/* Top row connections */}
            <AnimatedBeam containerRef={containerRef} fromRef={node1Ref} toRef={node2Ref} />
            <AnimatedBeam containerRef={containerRef} fromRef={node2Ref} toRef={node3Ref} />
            
            {/* Cross connections to hypothesis */}
            <AnimatedBeam containerRef={containerRef} fromRef={node3Ref} toRef={node4Ref} curvature={40} reverse endYOffset={-10} />
            <AnimatedBeam containerRef={containerRef} fromRef={node4Ref} toRef={node2Ref} curvature={-40} startYOffset={-10} />
            
            {/* Exit loop connection */}
            <AnimatedBeam containerRef={containerRef} fromRef={node4Ref} toRef={node5Ref} curvature={40} reverse />
            
            {/* Bottom row connections */}
            <AnimatedBeam containerRef={containerRef} fromRef={node5Ref} toRef={node6Ref} />
            <AnimatedBeam containerRef={containerRef} fromRef={node6Ref} toRef={node7Ref} />
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
