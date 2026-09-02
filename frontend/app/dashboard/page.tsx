"use client";

import { Button } from "@/components/ui/button"
import signOut from '../auth/sign-out/actions'

export default function Dashboard() {
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