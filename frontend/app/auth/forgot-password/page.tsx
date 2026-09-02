'use client';

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from 'next/image';
import Link from 'next/link'
import { useActionState } from "react";
import { sendPasswordResetEmail } from "@/app/auth/forgot-password/actions";
import { cn } from "@/lib/utils";

interface ForgotPasswordState {
  error?: string;
  success?: boolean;
  message?: string;
}

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(sendPasswordResetEmail, null);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-2 px-6 md:px-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center py-3 font-medium">
            <div className="flex items-center justify-center rounded-md">
              <Image src={"/logo_header.png"} width={40} height={40} alt='Sentry Loop Logo' />
            </div>
            <p className='font-sans'>Sentry Loop</p>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form className={cn("flex flex-col gap-6")} action={formAction}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Reset your password</h1>
                  <p className="text-sm text-balance text-muted-foreground">
                    Enter your email address and we&apos;ll send you a link to reset your password
                  </p>
                </div>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                  />
                </Field>

                {state?.error && (
                  <div className="rounded-md px-3 py-2 text-sm text-red-500">
                    {state.error}
                  </div>
                )}

                {state?.success && (
                  <div className="rounded-md px-3 py-2 text-sm text-green-600">
                    {state.message}
                  </div>
                )}

                <Field>
                  <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? "Sending..." : "Send Reset Email"}
                  </Button>
                </Field>

                <div className="text-center text-sm">
                  <a href="/auth/sign-in" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    Back to sign in
                  </a>
                </div>
              </FieldGroup>
            </form>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          fill
          src="/auth-page.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
