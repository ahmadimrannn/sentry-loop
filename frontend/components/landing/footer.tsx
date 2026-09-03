import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-12 border-t border-black/5 dark:border-white/5 bg-white dark:bg-black">
      <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <Link href="/" className="font-sans flex justify-center items-center text-lg tracking-tight">
            <Image 
                src={"/logo_header.png"}
                alt="Sentry Loop Logo"
                width={40}
                height={40}
            />
            <p>Sentry Loop</p>
          </Link>
          <span className="font-inter text-sm text-muted-foreground text-center md:text-left">
            A personal showcase of autonomous investigation capabilities.
          </span>
        </div>

        <Link
          href="#"
          className="text-muted-foreground hover:text-foreground transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="sr-only">GitHub</span>
        </Link>
      </div>
    </footer>
  );
}