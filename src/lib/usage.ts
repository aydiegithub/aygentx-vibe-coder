import { RateLimiterPrisma } from "rate-limiter-flexible";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

const FREE_POINTS = 6;
const DURATION = 30 * 24 * 60 * 60;
const GENERATION_COST = 1;
const PRO_POINTS = 100;

export async function getUsageTracker() {
    if (!prisma) {
        throw new Error("Database client is not initialized");
    }

    const { has } = await auth();
    const hasProAccess = has({ plan: "pro_user" })

    const usageTracker = new RateLimiterPrisma({
        storeClient: prisma,
        tableName: "Usage",
        points: hasProAccess ? PRO_POINTS : FREE_POINTS,
        duration: DURATION,
    });

    return usageTracker;
}

export async function consumedCredits() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("User not authenticated");
    }

    try {
        const usageTracker = await getUsageTracker();
        const result = await usageTracker.consume(userId, GENERATION_COST);
        return result;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to consume credits: ${error.message}`);
        }
        throw error;
    }
}

export async function getUsageStatus() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("User not authenticated");
    }

    try {
        const usageTracker = await getUsageTracker();
        const result = await usageTracker.get(userId);
        return result;
    } catch (error) {
        console.error("Error getting usage status:", error);
        return null;
    }
}
