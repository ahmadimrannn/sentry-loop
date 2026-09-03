import { LoginForm } from "@/components/login-form"
import Image from 'next/image';
import Link from 'next/link'

export default async function SignInPage() {

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-18 md:gap-13 px-6 md:px-10">
        <div className=" h-full flex-col flex items-center justify-center">
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
                <LoginForm/>
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