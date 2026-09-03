import Image from "next/image";

export default function AuthImage() {
    return (
        <div className="relative hidden bg-muted lg:block">
            <div className="flex flex-col gap-3  justify-start items-start left-0 bottom-0 absolute z-10 px-10 py-16">
                <Image 
                    src={"/logo-copy.png"}
                    alt="Sentry Loop logo"
                    width={40}
                    height={40}
                />
                <h1 className="font-sans tracking-tight text-3xl text-white">
                    Your AI On-Call Engineer
                </h1>
                <p className="text-gray-300 font-inter text-lg w-120">
                    SentryLoop investigates production incidents for you, tracing logs, metrics, and events to uncover the root cause. It drafts a fix proposal while keeping every change behind your approval.
                    
                </p>
            </div>
            <Image
                fill
                src="/auth-page.png"
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
        </div>
    )
}