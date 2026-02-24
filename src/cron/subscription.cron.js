import cron from "node-cron";
import {
    handleSubscriptioncarriedForwardDays,
    handleSubscriptionExpiry
} from "../jobs/subscription.job.js";

export const startSubscriptionCrons = () => {
    cron.schedule("0 0 * * *", async () => {
        try {
            console.log("🟢 Running daily subscription jobs");

            await handleSubscriptioncarriedForwardDays();
            await handleSubscriptionExpiry();

            console.log("✅ Subscription cron completed");
        } catch (err) {
            console.error("❌ Subscription cron failed", err);
        }
    });
};
