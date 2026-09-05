/* eslint-disable @typescript-eslint/no-explicit-any */
type Service = "lumen" | "cognilead";
type PageState = "idle" | "running" | "done" | "error" | "ratelimit";

interface StatusResponse {
  step_count: number;
  checked_this_step: string | null;
  severities_tried: string[];
  routes_tried: string[];
  investigation_summary: string | null;
  is_fix_proposed: boolean;
  proposed_change: string | null;
  reached_via: string | null;
  done: boolean;
  error: string | null;
}

interface StepSnapshot {
  stepCount: number;
  label: string;
  severities: string[];
  routes: string[];
}

interface ProposalsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

interface IncidentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface ForgotPasswordState {
  error?: string;
  success?: boolean;
  message?: string;
}

interface ForgotPasswordState {
  error?: string;
  success?: boolean;
  message?: string;
}

interface SendOtpState {
  error?: string;
  success?: boolean;
}

interface SessionActionState {
  error?: string;
  success?: boolean;
  sessions?: any[];
}

interface SignInState {
  error?: string;
  success?: boolean;
}

interface SignUpState {
  error?: string;
  success?: boolean;
}

interface DashboardNavProps {
  userEmail?: string | null;
  userName?: string | null;
  userImage?: string | null;
  children: React.ReactNode;
}