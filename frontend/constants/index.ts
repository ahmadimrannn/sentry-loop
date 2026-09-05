import { FileText, FlaskConical, ShieldAlert } from "lucide-react";

export const MAX_INPUT_LENGTH = 600;
export const POLL_INTERVAL_MS = 2500;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 100;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EXAMPLE_PROMPTS: {
  text: string;
  service: Service;
}[] = [
    {
      text: "Conflict analysis pipeline runs fine end to end, no errors thrown anywhere in the logs. But on some requests the report comes back with partial reasoning where a full analysis should be. Only some conflicts get flagged, and it's not consistent across similar inputs.",
      service: "lumen",
    },
    {
      text: "Sales team says the failed-leads view in the dashboard won't load at all right now. Clicking into it throws an error instead of showing which leads failed processing. This is blocking their manual follow-up work, not just a display glitch.",
      service: "cognilead",
    },
    {
      text: "Reviewing the eval scoring logic and noticed a hard-failing criterion can still end up passing overall. It looks like a high score on other criteria is averaging out the one that clearly failed. Not sure yet if this has caused a real bad outcome, but the scoring rule itself seems exploitable.",
      service: "lumen",
    },
    {
      text: "Tried resuming an investigation thread I assumed had already started from an earlier run. Instead of resuming cleanly, it threw a key error right away. Seems like the resume logic doesn't check whether a checkpoint actually exists first.",
      service: "cognilead",
    },
  ];

export const STEP_LABELS: Record<string, string> = {
  query_events: "Checking event history",
  query_routes: "Mapping affected routes",
  analyze_severity: "Assessing severity",
  propose_fix: "Drafting proposed fix",
  propose_fix_node: "Drafting proposed fix",
  finalize: "Finalising run",
  finalize_node: "Finalising run",
};

export const navItems = [
    {
      name: "Incidents",
      href: "/dashboard",
      icon: ShieldAlert,
      exact: true,
    },
    {
      name: "Proposals",
      href: "/dashboard/proposals",
      icon: FileText,
      exact: false,
    },
    {
      name: "Try It Yourself",
      href: "/dashboard/try-it-yourself",
      icon: FlaskConical,
      exact: false,
    },
];

export const navLinks = [
    { name: "How It Works", path: "#how-it-works" },
    { name: "Architecture", path: "#architecture" },
    { name: "Github", path: "https://github.com/ahmadimrannn/sentry-loop" },
]
