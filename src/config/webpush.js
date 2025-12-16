import webpush from "web-push";

export const webPushStart = () => {
    webpush.setVapidDetails(
        `mailto:support@${process.env.DOMAIN}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
};
