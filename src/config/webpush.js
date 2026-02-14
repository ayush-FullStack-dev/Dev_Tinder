import webpush from "web-push";
import { success, info } from "../../logs/printLogs.js";


export const webPushStart = async () => {
    info("INITIALIZING WEB PUSH ...");
    await webpush.setVapidDetails(
        `mailto:support@${process.env.DOMAIN}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    success("WEB PUSH READY ✓");
};
