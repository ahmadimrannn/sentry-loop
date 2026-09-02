import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useActionState } from "react";
import { verifyEmailOtp, resendEmailOtp } from "@/app/auth/send-otp/actions";

interface VerifyOtpFormProps extends React.ComponentProps<"form"> {
  email: string;
}

interface OtpState {
  error?: string;
  success?: boolean;
}

export function VerifyOtpForm({
  className,
  email,
  ...props
}: VerifyOtpFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: OtpState | null, formData: FormData) => {
      const otp = formData.get('otp') as string;
      return verifyEmailOtp(email, otp);
    },
    null as OtpState | null
  );

  const [resendState, resendAction, resendPending] = useActionState(
    async () => {
      return resendEmailOtp(email);
    },
    null as OtpState | null
  );

  return (
    <form className={cn("flex flex-col gap-6", className)} action={formAction} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter the 6-digit code sent to <br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="otp">Verification Code</FieldLabel>
          <Input
            id="otp"
            name="otp"
            type="text"
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]{6}"
            required
            className="text-center text-2xl tracking-widest"
          />
          <FieldDescription>
            Check your email for the 6-digit code
          </FieldDescription>
        </Field>

        {state?.error && (
          <div className="rounded-md px-3 py-2 text-sm text-red-500">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="rounded-md px-3 py-2 text-sm text-green-600">
            Email verified successfully! Redirecting...
          </div>
        )}

        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Verifying..." : "Verify Email"}
          </Button>
        </Field>

        <div className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          <form action={resendAction} className="inline">
            <button
              type="submit"
              disabled={resendPending}
              className="underline underline-offset-4 hover:text-foreground disabled:opacity-50"
            >
              {resendPending ? "Sending..." : "Resend email"}
            </button>
          </form>
          {resendState?.success && (
            <p className="mt-2 text-green-600 text-xs">OTP sent successfully!</p>
          )}
          {resendState?.error && (
            <p className="mt-2 text-red-500 text-xs">{resendState.error}</p>
          )}
        </div>

        <div className="text-center text-sm">
          <a href="/auth/sign-in" className="text-primary underline underline-offset-4 hover:text-primary/80">
            Back to sign in
          </a>
        </div>
      </FieldGroup>
    </form>
  );
}
