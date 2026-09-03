'use client';

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from 'next/image';
import Link from 'next/link'
import { useActionState, useEffect } from "react";
import { sendPasswordResetEmail } from "@/app/auth/forgot-password/actions";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import AuthImage from "../../../components/shared/AuthImage"


interface ForgotPasswordState {
  error?: string;
  success?: boolean;
  message?: string;
}

export default function ForgotPasswordPage() {
    const [state, formAction, isPending] = useActionState(sendPasswordResetEmail, null);

    const { data: session } = authClient.useSession();
    const router = useRouter();

    useEffect(() => {
        if (session) {
            router.push('/dashboard');
        }
    }, [session, router]);

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <AuthImage />
            <div className="flex flex-col justify-center px-6 md:px-10">
                <div className="flex flex-col items-center justify-center">
                    <div>
                        <Link href={"/"}>
                            <Image 
                                src={"/logo_header.png"}
                                alt="Sentry Loop Logo"
                                width={60}
                                height={60}
                            />
                        </Link>
                    </div>
                    <div className="w-full max-w-xs">
                        <form className={cn("flex flex-col gap-6")} action={formAction}>
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                            <h1 className="text-2xl font-sans tracking-tight">Reset your password</h1>
                            <p className="text-sm font-inter text-balance text-muted-foreground">
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
                            <Button type="submit" disabled={isPending} className="w-full py-4">
                                {isPending ? "Sending..." : "Send Reset Email"}
                            </Button>
                            </Field>

                            <div className="text-center text-sm">
                            <a href="/auth/sign-in" className="text-primary underline underline-offset-4 hover:text-primary/80 font-inter">
                                Back to sign in
                            </a>
                            </div>
                        </FieldGroup>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
