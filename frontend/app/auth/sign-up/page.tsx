import { SignupForm } from "@/components/signup-form"
import Image from 'next/image';
import Link from 'next/link'

export default async function SignupPage() {

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col px-6 md:px-10">
            <div className="absolute flex justify-center gap-2 md:justify-start">
                <Link href="/" className="flex items-center py-3 font-medium">
                    <div className="flex items-center justify-center rounded-md">
                        <Image src={"/logo_header.png"} width={40} height={40} alt='Sentry Loop Logo' />
                    </div>
                    <p className='font-sans'>Sentry Loop</p>
                </Link>
            </div>
            <div className="flex h-full items-center justify-center">
                <div className="w-full max-w-xs">
                    <SignupForm />
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
    )
}
