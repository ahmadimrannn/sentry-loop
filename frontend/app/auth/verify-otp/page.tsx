'use client';

import { VerifyOtpForm } from "@/components/verify-otp-form"
import { authClient } from "@/lib/auth/client";
import Image from 'next/image';
import Link from 'next/link'
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import AuthImage from "../../../components/shared/AuthImage"


function VerifyOtpContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    useEffect(() => {
        if (session) {
        router.push('/dashboard');
        }
    }, [session, isPending, router]);

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
                        <VerifyOtpForm email={email} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <VerifyOtpContent />
        </Suspense>
    );
}
