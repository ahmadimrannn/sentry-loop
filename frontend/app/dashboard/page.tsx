"use client";

import { Button } from "@/components/ui/button"
import signOut from '../auth/sign-out/actions'
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function Dashboard() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !session) {
        router.push('/auth/sign-in');
        }
    }, [session, isPending, router]);
    
    const handleSignOut = async () => {
        await signOut()
    }
    return (
        <>
            Welcome to dashboard.
            <Button type="submit" onClick={handleSignOut}>
                Sign Out
            </Button>
        </>
    )
}