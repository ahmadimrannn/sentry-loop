'use client';

import { VerifyOtpForm } from "@/components/verify-otp-form"
import Image from 'next/image';
import Link from 'next/link'
import { useSearchParams } from "next/navigation";

export default function VerifyOtpPage() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    if (!email) {
        return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Missing email address</h1>
            <p className="text-muted-foreground mb-4">
                Please start the verification process again
            </p>
            <a href="/auth/sign-in" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Back to sign in
            </a>
            </div>
        </div>
        );
    }

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
                <VerifyOtpForm email={email} />
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
