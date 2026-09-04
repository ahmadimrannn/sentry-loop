import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive/10 text-destructive border-destructive/20",
        outline: "text-foreground border-border",
        approved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/40",
        rejected: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800/40",
        pending_approval: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/40",
        critical: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400 dark:bg-red-950/40 dark:border-red-800/40",
        error: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400 dark:bg-orange-950/40 dark:border-orange-800/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
